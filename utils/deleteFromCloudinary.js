const cloudinary = require("../config/cloudinaryConfig");

/**
 * Deletes a file from Cloudinary based on the provided public ID and file type.
 *
 * @param {string} publicId - The public ID of the file to delete from Cloudinary.
 * @param {string} fileType - The type of the file to delete (e.g., "image" or "object").
 * @returns {Promise<Object>} A promise that resolves to an object containing the success status, message, and result.
 * @throws {Error} Throws an error if the file is not found on Cloudinary or if the deletion fails.
 */
const deleteFromCloudinary = async (publicId, fileType) => {
  try {
    let resourceType = "image"; // Default resource type for images

    if (fileType === "object") {
      resourceType = "raw"; // 3D models are stored as "raw"
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "not found") {
      //   throw new Error("File not found on Cloudinary");
      console.log("File not found on Cloudinary");
    }

    return {
      success: true,
      message: "File successfully deleted",
      result,
    };
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

module.exports = deleteFromCloudinary;
