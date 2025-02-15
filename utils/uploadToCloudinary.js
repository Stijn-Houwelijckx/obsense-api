const cloudinary = require("../config/cloudinaryConfig"); // Import Cloudinary config
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

/**
 * Uploads a file to Cloudinary.
 *
 * @param {string} filePath - The path to the file to be uploaded.
 * @param {string} fileType - The type of the file to determine the folder and resource type.
 *                            Valid values are "profileImage", "coverImage", and "object".
 * @returns {Promise<Object>} - A promise that resolves to an object containing the URL and public ID of the uploaded file.
 * @throws {Error} - Throws an error if the file type is invalid or if the upload fails.
 */
const uploadToCloudinary = async (filePath, fileType, originalFileName) => {
  try {
    let folder;
    let resourceType = "image"; // Default for images

    switch (fileType) {
      case "profileImage":
        folder = "profile_images";
        break;
      case "coverImage":
        folder = "cover_images";
        break;
      case "object":
        folder = "objects";
        resourceType = "raw"; // Cloudinary treats 3D models as "raw"
        break;
      default:
        throw new Error("Invalid file type");
    }

    // Remove the file extension from the original file name and replace spaces with underscores
    const originalNameWithoutExtension = path.parse(originalFileName).name;
    const sanitizedFileName = originalNameWithoutExtension.replace(/\s+/g, "-"); // Replace all spaces with '_'

    // Generate the unique file name: UUID + sanitized file name
    const uniqueFileName = `${uuidv4()}_${sanitizedFileName}`;

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      public_id: uniqueFileName,
      resource_type: resourceType,
    });

    fs.unlinkSync(filePath); // Remove file from server after upload

    // console.log("Cloudinary upload result:");
    // console.log(result);

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format
        ? result.format
        : path.extname(originalFileName).slice(1),
      bytes: result.bytes,
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

module.exports = uploadToCloudinary;
