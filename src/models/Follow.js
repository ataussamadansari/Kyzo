import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true }); // prevent duplicate follows

// =========== HOOK FOR AUTO COUNT UPDATE ===============

// After creating a follow relationship
followSchema.post("save", async function (doc) {
  try {
    const User = mongoose.model("User");

    // Increment follower's followingCount
    await User.findByIdAndUpdate(doc.follower, {
      $inc: { followingCount: 1 },
    });

    // Increment following's followersCount
    await User.findByIdAndUpdate(doc.following, {
      $inc: { followersCount: 1 },
    });
    console.log(`✅ Counts updated: ${doc.follower} → ${doc.following}`);
  } catch (error) {
    console.error("Error updating follow counts:", error);
  }
});

// After deleting a follow relationship
followSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  try {
    const User = mongoose.model("User");

    // Decrement follower's followingCount (prevent negative)
    await User.findByIdAndUpdate(
      doc.follower,
      {
        $inc: { followingCount: -1 },
      }
    );
    // Ensure it doesn't go below 0
    await User.findByIdAndUpdate(
      doc.follower,
      {
        $max: { followingCount: 0 },
      }
    );

    // Decrement following's followersCount (prevent negative)
    await User.findByIdAndUpdate(
      doc.following,
      {
        $inc: { followersCount: -1 },
      }
    );
    // Ensure it doesn't go below 0
    await User.findByIdAndUpdate(
      doc.following,
      {
        $max: { followersCount: 0 },
      }
    );

    console.log(`✅ Counts decremented: ${doc.follower} ✗ ${doc.following}`);
  } catch (error) {
    console.error("Error updating unfollow counts:", error);
  }
});
export default mongoose.model("Follow", followSchema);
