import cloudinary from "../config/cloudinary.js";

export const uploadPostToCloudinary = (buffer, folder = "posts") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto", // image or video both supported
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    ).end(buffer);
  });
};
