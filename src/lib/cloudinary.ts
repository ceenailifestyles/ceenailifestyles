import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type CloudinaryFolder =
  | "ceeneai/banners"
  | "ceeneai/categories"
  | "ceeneai/products"
  | "ceeneai/collections"
  | "ceeneai/about"
  | "ceeneai/settings";

export async function uploadToCloudinary(
  fileBufferOrBase64: string,
  folder: CloudinaryFolder = "ceeneai/products"
): Promise<{ url: string; publicId: string }> {
  try {
    const uploadResponse = await cloudinary.uploader.upload(fileBufferOrBase64, {
      folder,
      resource_type: "image",
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" }
      ],
    });

    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

export default cloudinary;

