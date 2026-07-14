const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const { generateSecureToken } = require("../utils/cryptoUtils");

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

const isValidFile = (file) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return false;
  }
  
  // Reject double extensions (e.g. image.png.exe)
  const originalName = file.originalname || "";
  const parts = originalName.split(".");
  if (parts.length > 2) {
    return false;
  }

  const ext = path.extname(originalName).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return false;
  }

  return true;
};

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (isValidFile(file)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file upload. Only JPG, JPEG, PNG, WEBP, and AVIF images are allowed. Double extensions are rejected."), false);
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

        // Generate a cryptographically random public ID
        const randomPublicId = generateSecureToken(16);

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "buyto-products",
                    resource_type: "image",
                    public_id: randomPublicId
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
        console.error("========== UPLOAD ERROR START ==========");
        console.error(error.message);
        console.error("========== UPLOAD ERROR END ==========");

        return res.status(500).json({
            success: false,
            message: "Image upload failed"
        });
    }
});

module.exports = router;