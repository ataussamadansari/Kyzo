import multer  from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png"];

    if (!allowed.includes(file.mimetype)) {
        cb(new Error("Only JPG, JPEG & PNG allowed!"), false);
    } else {
        cb(null, true);
    }
};

export const upload = multer({ 
    storage,
    limits: {fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter,
});