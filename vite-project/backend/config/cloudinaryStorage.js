import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "buyto-products",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
});

export default storage;