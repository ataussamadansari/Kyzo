import cron from "node-cron";
import User from "../models/User.js";
import { daysToMs } from "../utils/time.js";

// schedule: run every day at midnight server time
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("[cleanup] Runnig cleanup job for deleted users");

    const deleteWindowDays = Number(process.env.DELETE_TIME_DAYS || 30);
    const cutoff = Date.now() - daysToMs(deleteWindowDays);

    const expiredUsers = await User.find({
      deleted: true,
      deleteAt: { $lt: cutoff },
    });

    for (const user of expiredUsers) {
      try {
        // 1) Delete Cloudinary avatar (if exist)
        try {
          // handle both flat avatarId or nested avatarId
          const publicId = user.avatarId;
          if (publicId) {
            const destroyResult = await cloudinary.uploader.destroy(publicId);
            console.log(`[cleanup] Cloudinary destroy result:`, destroyResult);
          }
        } catch (error) {
          console.warn(
            "[cleanup] Error deleting cloudinary avatar for",
            user.email,
            error
          );
        }

        // 2) Finally remove user
        await User.findByIdAndDelete(user._id);
        console.log("[cleanup] Deleted user:", user.email);
      } catch (error) {
        console.error("[cleanup] Failed to delete user:", user._id, error);
      }
    }
    console.log("[cleanup] Job finished");
  } catch (error) {
    console.error("[cleanup] Job top-level error:", error);
  }
});

export default null;

