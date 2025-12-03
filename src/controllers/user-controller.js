import User from "../models/User.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { daysToMs } from "../utils/time.js";
dotenv.config();


export const status = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId).select("isOnline lastSeen");
  if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

  return res.json({
    online: user.isOnline,
    lastSeen: user.lastSeen,
  });
};

// ====================== GET LOGGED IN USER ======================
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    res.json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== UPDATE PROFILE ======================
export const updateMe = async (req, res) => {
  const userId = req.user.id;
  const { name, username, bio, phone, links, isPrivate } = req.body;

  try {
    // Find User
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });

    // Check if username already exists (except current user)
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername && existingUsername._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: `${username} username already exists!`,
        });
      }
    }

    const updatedData = {
      name: name ?? user.name,
      username: username ?? user.username,
      bio: bio ?? user.bio,
      phone: phone ?? user.phone,
      isPrivate: isPrivate ?? user.isPrivate
    };

    // Links update (only if provided & valid array)
    if (Array.isArray(links)) {
      updatedData.links = links;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ====================== CHANGE PASSWORD ======================
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({
        success: false,
        message: "Incorrect old password",
      });
    const hash = await bcrypt.hash(newPassword, 10);

    user.password = hash;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== GET RANDOM / SUGGESTED USERS ======================
export const getSuggestedUsers = async (req, res) => {
  try {
    const myId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));

    // Logged in user - get following list
    const me = await User.findById(myId).select("following");
    if (!me)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Build exclude array: include self + people you already follow
    const exclude = [
      me._id,
      ...((me.following && me.following.map((f) => f)) || []),
    ];

    const skip = (page - 1) * limit;

    const users = await User.aggregate([
      {
        $match: {
          _id: { $nin: exclude }, // remove yourself and all following users
          deleted: { $ne: true },
        },
      },
      // sample from remaining users - choose a reasonable pool size
      { $sample: { size: 100 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          username: 1,
          avatar: 1,
          bio: 1,
        },
      },
    ]);

    // Add isFollowing and isFollowBack for each user
    const Follow = (await import("../models/Follow.js")).default;
    
    const finalList = await Promise.all(
      users.map(async (user) => {
        // Check if logged user follows this suggested user
        const isFollowing = await Follow.exists({
          follower: myId,
          following: user._id,
        });

        // Check if this suggested user follows logged user back
        const isFollowBack = await Follow.exists({
          follower: user._id,
          following: myId,
        });

        return {
          ...user,
          isFollowing: Boolean(isFollowing),
          isFollowBack: Boolean(isFollowBack),
        };
      })
    );

    res.json({
      success: true,
      message: "Suggested users fetched successfully",
      page,
      limit,
      count: finalList.length,
      users: finalList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== GET USER PROFILE BY ID ========================
export const getUserProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== GET USER PROFILE BY USERNAME ======================
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== DELETE ACCOUNT (SOFT DELETE - 15 MIN TEST) ======================
export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      deleted: true,
      deleteAt: Date.now(), // store current timestamp
    });

    const days = Number(process.env.DELETE_TIME_DAYS || 30);

    res.json({
      success: true,
      message: `Account marked for deletion. You can recover within ${days} days.`,
      recoverWithinDays: days,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== RECOVER ACCOUNT (15 MIN TEST) ======================
export const recoverAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (!user.deleted)
      return res.json({
        success: true,
        message: "Account is already active",
      });

    const diff = Date.now() - new Date(user.deleteAt).getTime();
    const deleteWindowDays = Number(process.env.DELETE_TIME_DAYS || 30);
    const ALLOWED_TIME = daysToMs(deleteWindowDays);

    if (diff > ALLOWED_TIME) {
      return res.status(400).json({
        success: false,
        message: "Recovery window expired. Account permanently deleted.",
      });
    }

    // Restore account
    user.deleted = false;
    user.deleteAt = null;
    await user.save();

    res.json({
      success: true,
      message: "Account recovered successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
