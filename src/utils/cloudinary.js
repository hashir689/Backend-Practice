import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
const UploadOnCloudinary = async (LocalFilePath) => {
  try {
    if (!LocalFilePath) return null;
    // Upload an image
    const uploadResult = await cloudinary.uploader
      .upload(
        "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
        {
          public_id: "shoes",
          resource_type: "auto",
        }
      )
      .catch((error) => {
        console.log(error);
      });

    console.log(uploadResult);
  } catch (error) {
    fs.unlinkSync(LocalFilePath);
  }
};

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRETE, // Click 'View API Keys' above to copy your API secret
});
