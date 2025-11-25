import User from "../models/User.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt_token.js";
import cloudinary from "../config/cloudinary.js";
import dotenv from "dotenv";
import { daysToMs } from "../utils/time.js";
import { resendEmail, sendEmail } from "../utils/send-email.js";
dotenv.config();

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "User register successfully",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // include deleted & deleteAt for checks; password for auth
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // determine allowed window (minutes override days if provided)
    let ALLOWED_TIME_MS;
    if (process.env.DELETE_TIME_MINUTES) {
      ALLOWED_TIME_MS = minutesToMs(Number(process.env.DELETE_TIME_MINUTES));
    } else {
      const days = Number(process.env.DELETE_TIME_DAYS || 30);
      ALLOWED_TIME_MS = daysToMs(days);
    }

    // if user is soft-deleted
    if (user.deleted) {
      const diff = Date.now() - new Date(user.deleteAt).getTime();

      // if deletion window expired -> permanently deleted
      if (diff > ALLOWED_TIME_MS) {
        return res.status(404).json({ message: "Account permanently deleted" });
      }
      // else: still within window — allow login but mark scheduledForDeletion
      // Continue to password check below (so we authenticate user)
    }

    // authenticate
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    // build response metadata when deleted but recoverable
    if (user.deleted) {
      const diff = Date.now() - new Date(user.deleteAt).getTime();
      const remainingMs = Math.max(ALLOWED_TIME_MS - diff, 0);
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

      return res.status(200).json({
        message:
          "Login successful — note: your account is scheduled for deletion.",
        token,
        user, // consider sanitizing fields before sending in production
        scheduledForDeletion: true,
        recoverWithin: {
          minutesLeft: remainingMinutes,
          daysLeft: remainingDays,
        },
        recoverHint:
          "Call the recover endpoint to restore your account before the window expires.",
      });
    }

    // normal active account
    return res.status(200).json({
      message: "Login successful",
      token,
      user,
      scheduledForDeletion: false,
    });
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ message: "Catch " + error.message });
  }
};

// export const login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email }).select("+password");
//     if (!user) return res.status(404).json({ message: "User not found" });

//     if (user.deleted) {
//       const diff = Date.now() - new Date(user.deleteAt).getTime();
//       const deleteWindowDays = Number(process.env.DELETE_TIME_DAYS || 30);
//       const ALLOWED_TIME = daysToMs(deleteWindowDays);

//       if (diff > ALLOWED_TIME) {
//         return res.status(404).json({ message: "Account permanently deleted" });
//       }

//       return res
//         .status(403)
//         .json({ message: "Account deleted. Recover before expiry." });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch)
//       return res.status(400).json({ message: "Invalid crediential" });

//     const token = generateToken(user);

//     res.json({
//       message: "Login successful",
//       token,
//       user: user,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Catch " + error.message });
//   }
// };

export const setUsername = async (req, res) => {
  try {
    const userId = req.user._id;

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({
        message: "User not found",
      });

    const existUsername = await User.findOne({ username });
    // If same user is trying to set same username -> ok
    if (existUsername && existUsername._id.toString() !== userId.toString()) {
      // Generate alternative usernames
      const suggestions = generateUsername(user.name, user.email);

      return res
        .status(400)
        .json({ message: username + " username already taken", suggestions });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username: username },
      { new: true }
    );

    res.json({ message: "Username updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateUsername = (name, email) => {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, ""); // remove only space

  const emailUser = email.split("@")[0].toLowerCase();

  const suggestions = new Set();

  while (suggestions.size < 5) {
    const randomNum = Math.floor(100 + Math.random() * 900); // 4 digit random

    suggestions.add(base + randomNum);
    suggestions.add(emailUser + randomNum);
    suggestions.add(base + "_" + randomNum);
    suggestions.add(emailUser + "_" + randomNum);
    suggestions.add(base + email.slice(0, 3));
  }

  return Array.from(suggestions).slice(0, 5);
};

/**
 * Upload buffer to Cloudinary using upload_stream wrapped in a Promise
 */
const uploadToCloudinary = (buffer, folder = "kyzo_user_profile") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export const setAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // fetch user to get previous avatar info (if any)
    const user = await User.findById(userId).select("+avatarId"); // adjust if you used select:false
    if (!user) return res.status(404).json({ message: "User not found" });

    // upload new image
    const result = await uploadToCloudinary(
      req.file.buffer,
      "kyzo_user_profile"
    );

    // delete old image from Cloudinary (optional but recommended)
    if (user.avatar && user.avatarId) {
      try {
        await cloudinary.uploader.destroy(user.avatarId);
      } catch (err) {
        // log but don't fail the whole request if destroy fails
        console.warn("Failed to delete old avatar from Cloudinary:", err);
      }
    }

    // update user with new avatar (nested structure)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: result.secure_url,
        avatarId: result.public_id,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Upload successful",
      avatar: updatedUser.avatar,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error });
  }
};

// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });

//     if (!user)
//       return res.status(200).json({
//         message: "If an account with that email exists, a reset link will be sent.",
//       });

//     const resetToken = crypto.randomBytes(32).toString("hex");

//     const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

//     user.resetPasswordToken = hashedToken;
//     user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10
//     await user.save();

//     const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

//     const html = `
//       <h2>Password Reset Request</h2>
//       <p>Click the link below to reset your password:</p>
//       <a href="${resetURL}" target="_blank">${resetURL}</a>
//       <p>This link expires in 1 hour.</p>
//     `;

//     await sendEmail({
//       to: user.email,
//       subject: "Password Reset Link",
//       html,
//     });

//     res.status(200).json({ message: "Password reset link sent to email.", resetURL });
//   } catch (error) {
//     console.error("forgotPassword error:", error);
//     res.status(500).json({ message: error.message || "Server error" });
//   }
// };

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found!" });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token for DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    // Reset link
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetURL}" target="_blank">${resetURL}</a>
      <p>This link expires in 10 min.</p>
    `;

    // Send email
    // 1) RESEND
    await resendEmail({
      to: user.email,
      subject: "Reset Password Link by " + process.env.EMAIL_FROM_NAME,
      html: html
    });

    // 2)  SMTP
    // await sendEmail({
    //   to: user.email,
    //   subject: "Reset Password Link by " + process.env.EMAIL_FROM_NAME,
    //   text: `Click the link to reset your password: ${resetURL}`,
    // });

    res.json({ message: "Reset link sent to your email.", resetURL });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Convert token to hashed token for DB lookup
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired link" });

    // Set new password
    user.password = await bcrypt.hash(newPassword, 10);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const resetPassword = async (req, res) => {
//   try {
//     // If client sent token in body or params, accept both
//     const token = req.params.token || req.body.token;
//     if (!token) return res.status(400).json({ message: "Reset token is required." });

//     // Accept multiple possible field names from frontend
//     const password = req.body.password || req.body.newPassword || req.body.new_password;
//     if (!password || typeof password !== "string" || password.trim().length < 8) {
//       return res.status(400).json({
//         message: "New password is required and must be at least 8 characters.",
//       });
//     }

//     // Hash token to match stored value
//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) return res.status(400).json({ message: "Invalid or expired token." });

//     // Hash password safely (directly using saltRounds is simpler)
//     const saltRounds = 10;
//     user.password = await bcrypt.hash(password, saltRounds);

//     // clear reset fields
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;

//     await user.save();

//     res.status(200).json({ message: "Password changed successfully." });
//   } catch (err) {
//     console.error("resetPassword error:", err);
//     res.status(500).json({ message: "Server error: " + err.message });
//   }
// };
