import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET, // Click 'View API Keys' above to copy your API secret
});
const UploadOnCloudinary = async (LocalFilePath) => {
  try {
    if (!LocalFilePath) return null;
    // Upload an image
    const uploadResult = await cloudinary.uploader
      .upload(LocalFilePath, {
        resource_type: "auto",
      })
      .catch((error) => {
        console.log(error);
      });
    fs.unlinkSync(LocalFilePath);
    return uploadResult;
  } catch (error) {
    console.log(error + " Cloudinary Issue");
    fs.unlinkSync(LocalFilePath);
  }
};

export { UploadOnCloudinary };
