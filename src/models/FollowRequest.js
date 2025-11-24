import mongoose from "mongoose";

const followRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

followRequestSchema.index({ requester: 1, target: 1 }, { unique: true });

export default mongoose.model("FollowRequest", followRequestSchema);
