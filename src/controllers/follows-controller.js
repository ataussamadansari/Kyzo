import Follow from "../models/Follow.js";
import FollowRequest from "../models/FollowRequest.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendNotification } from "../config/socket.js";

// ====================== GET ALL FOLLOWERS ======================
export const getFollower = async (req, res) => {
  try {
    const userId = req.user._id;

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalFollowers = await Follow.countDocuments({ following: userId });

    const followers = await Follow.find({ following: userId })
      .select("-following")
      .populate("follower", "name username avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: totalFollowers,
      page,
      limit,
      totalPage: Math.ceil(totalFollowers / limit),
      followers,
    });
  } catch (error) {
    res.status(500).json({
      success: false, message: error.message });
  }
};

// ====================== GET ALL FOLLOWING ======================
export const getFollowing = async (req, res) => {
  try {
    const userId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalFollowing = await Follow.countDocuments({ follower: userId });

    const following = await Follow.find({ follower: userId })
      .select("-follower")
      .populate("following", "name username avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: totalFollowing,
      page,
      limit,
      totalPage: Math.ceil(totalFollowing / limit),
      following,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============== GET USER FOLLOWERS ================
const canViewProfile = async (viewerId, targetUser) => {
  if (!targetUser.isPrivate) return true; // Public profile

  // Private profile → only owner or follower can see
  if (viewerId.toString() === targetUser._id.toString()) return true;

  const isFollower = await Follow.findOne({
    follower: viewerId,
    following: targetUser._id,
  });

  return Boolean(isFollower);
};

export const getUserFollower = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const targetId = req.params.id;

    const targetUser = await User.findById(targetId);
    if (!targetUser)
      return res.status(404).json({
      success: false,
        message: "User not found",
      });

    // Privacy check
    const allowed = await canViewProfile(viewerId, targetUser);
    if (!allowed) {
      return res.status(403).json({
      success: false,
        message: "This profile is private",
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalFollowers = await Follow.countDocuments({ following: targetId });

    const followers = await Follow.find({ following: targetId })
      .populate("follower", "name username avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: totalFollowers,
      page,
      limit,
      totalPage: Math.ceil(totalFollowers / limit),
      followers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===================== GET USER FOLLOWING ===================
export const getUserFollowing = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const targetId = req.params.id;

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({
      success: false, message: "User not found" });

    // Privacy check
    const allowed = await canViewProfile(viewerId, targetUser);
    if (!allowed) {
      return res.status(403).json({ 
      success: false, message: "This profile is private" });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalFollowing = await Follow.countDocuments({ follower: targetId });

    const following = await Follow.find({ follower: targetId })
      .populate("following", "name username avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: totalFollowing,
      page,
      limit,
      totalPage: Math.ceil(totalFollowing / limit),
      following,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ====================== FOLLOW USER (PRIVATE + PUBLIC) ======================
export const followUser = async (req, res) => {
  try {
    const myId = req.user.id;
    const targetId = req.params.id;

    if (myId.toString() === targetId)
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });

    const target = await User.findById(targetId);
    if (!target)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    // Already following?
    const already = await Follow.findOne({
      follower: myId,
      following: targetId,
    });
    if (already)
      return res.status(400).json({
        success: false,
        message: "You are already following this user",
      });

    // Already requested?
    const requested = await FollowRequest.findOne({
      requester: myId,
      target: targetId,
    });
    if (requested)
      return res.status(400).json({
        success: false,
        message: "Follow request already sent",
      });

    // PRIVATE → request
    if (target.isPrivate) {
      await FollowRequest.create({ requester: myId, target: targetId });

      // Send notification
      const reqNotif = await Notification.create({
        user: targetId,
        sender: myId,
        type: "follow_request",
      });

      sendNotification(targetId, {
        type: "follow_request",
        sender: myId,
        notificationId: reqNotif._id,
      });

      return res.json({
        success: true,
        message: "Follow request sent successfully",
      });
    }

    // PUBLIC → dircet follow
    await Follow.create({ follower: myId, following: targetId });

    const followNotif = await Notification.create({
      user: targetId,
      sender: myId,
      type: "follow",
    });

    sendNotification(targetId, {
      type: "follow",
      sender: myId,
      notificationId: followNotif._id,
    });

    // ========== MUTUAL FOLLOW CHECK ==========
    const mutual = await Follow.findOne({
      follower: targetId,
      following: myId,
    });

    if (mutual) {
      const mNotif = await Notification.create({
        user: myId, // A should get notification
        sender: targetId, // B followed back
        type: "follow_back",
      });

      sendNotification(myId, {
        type: "follow_back",
        sender: targetId,
        notificationId: mNotif._id,
      });
    }

    res.json({
      success: true,
      message: `You are now following ${target.name}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ====================== UNFOLLOW USER ======================
export const unfollowUser = async (req, res) => {
  try {
    const myId = req.user._id;
    const targetId = req.params.id;

    const deleted = await Follow.findOneAndDelete({
      follower: myId,
      following: targetId,
    });

    if (!deleted)
      return res.status(400).json({
        success: false,
        message: "Not following this user",
      });

    res.json({ success: true, message: "User unfollowed" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ====================== ACCEPT FOLLOW REQUEST ======================
export const acceptFollowRequest = async (req, res) => {
  try {
    const meId = req.user._id;
    const requesterId = req.params.id;

    const request = await FollowRequest.findOneAndDelete({
      requester: requesterId,
      target: meId,
    });

    if (!request)
      return res.status(400).json({
      success: false, message: "No follow request found" });

    // Create real follow
    await Follow.create({ follower: requesterId, following: meId });

    // ========== SEND NOTIFICATION ==========
    const notif = await Notification.create({
      user: requesterId, // sender of request
      sender: meId, // me (who accepted)
      type: "request_accepted",
    });

    sendNotification(requesterId, {
      type: "request_accepted",
      sender: meId,
      notificationId: notif._id,
    });

    // ========== MUTUAL FOLLOW CHECK ==========
    const mutual = await Follow.findOne({
      follower: meId,
      following: requesterId,
    });

    if (mutual) {
      const mNotif = await Notification.create({
        user: requesterId, // requester gets follow_back
        sender: meId,
        type: "follow_back",
      });

      sendNotification(requesterId, {
        type: "follow_back",
        sender: meId,
        notificationId: mNotif._id,
      });
    }

    res.json({
      success: true,
      message: "Follow request accepted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ====================== REJECT FOLLOW REQUEST ======================
export const rejectFollowRequest = async (req, res) => {
  try {
    const meId = req.user._id;
    const requesterId = req.params.id;

    await FollowRequest.findOneAndDelete({
      requester: requesterId,
      target: meId,
    });

    // ========== SEND NOTIFICATION (REJECTED) ==========
    const notif = await Notification.create({
      user: requesterId,
      sender: meId,
      type: "request_rejected",
    });

    sendNotification(requesterId, {
      type: "request_rejected",
      sender: meId,
      notificationId: notif._id,
    });

    res.json({
      success: true,
      message: "Follow request rejected",
    });
  } catch (error) {
    res.status(500).json({
      success: false, message: error.message });
  }
};

// ====================== GET ALL FOLLOW REQUESTS ======================
export const getFollowRequests = async (req, res) => {
  try {
    const me = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalRequests = await FollowRequest.countDocuments({ target: me });

    const request = await FollowRequest.find({ target: me })
      .populate("requester", "name username avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: totalRequests,
      page,
      limit,
      totalPages: Math.ceil(totalRequests / limit),
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false, message: error.message });
  }
};
