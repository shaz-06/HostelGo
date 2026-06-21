const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"), false);
        }
    }
});

router.get("/", (req, res) => {
    res.send("Upload Route Working...");
});

router.post("/", upload.single("image"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded"
            });
        }

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "buyto-products",
                    resource_type: "image"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(file.buffer);
        });

        return res.status(200).json({
            success: true,
            imageUrl: result.secure_url,
            publicId: result.public_id
        });

    } catch (error) {
        console.log("========== ERROR START ==========");
        console.log(error);
        console.log(error.message);
        console.log("========== ERROR END ==========");

        return res.status(500).json({
            success: false,
            message: "Image upload failed"
        });
    }
});

module.exports = router;