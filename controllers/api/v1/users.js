const User = require("../../../models/api/v1/User");
const uploadToCloudinary = require("../../../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../../../utils/deleteFromCloudinary");

// Functions to hanbdle requests for the currently authenticated user

// Get the currently logged-in user's profile data
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        data: {
          message: "Unauthorized",
        },
      });
    }

    // Fetch the user data, excluding sensitive fields
    const user = await User.findById(req.user._id) // Get the user ID from the request object
      .select(
        "firstName lastName username email isArtist profilePicture tokens"
      ) // Explicitly select fields
      .lean(); // Use lean() for performance if we don't need Mongoose documents

    if (!user) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "User not found",
        },
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user: user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Unable to fetch current user",
      error: err.message,
    });
  }
};

// Change the currently logged-in user's profile picture
const changeProfilePicture = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        data: {
          message: "Unauthorized",
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "No file uploaded",
        },
      });
    }

    // Get the user's current profile picture details
    const user = await User.findById(req.user._id).select("profilePicture");

    // Delete the current profile picture from Cloudinary
    if (
      user.profilePicture.fileName &&
      user.profilePicture.fileName !== "Default"
    ) {
      await deleteFromCloudinary(user.profilePicture.fileName, "image");
    }

    // Upload the new profile picture to Cloudinary
    const result = await uploadToCloudinary(
      req.file.path,
      "profileImage",
      req.file.originalname
    );

    // Update the user's profile picture details
    user.profilePicture = {
      fileName: result.public_id,
      filePath: result.url,
      fileType: result.format,
      fileSize: result.bytes,
    };

    await user.save();

    // Fetch the complete user details
    const updatedUser = await User.findById(req.user._id).select(
      "firstName lastName username email isArtist profilePicture tokens"
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Unable to update profile picture",
      data: {
        code: 500,
        details: err.message,
      },
    });
  }
};

// ================================================================================================= //

// Functions to handle requests for all users

// Get all users
const index = async (req, res) => {
  try {
    const users = await User.find({});
    if (users.length === 0) {
      res.status(204).json({
        status: "success",
        message: "No users found",
        data: {
          users: [],
        },
      });
    } else {
      res.status(200).json({
        status: "success",
        data: {
          users: users,
        },
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Unable to fetch users",
      error: err.message,
    });
  }
};

// Update the user profile
const update = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        data: {
          message: "Unauthorized",
        },
      });
    }

    const { firstName, lastName, username, email } = req.body.user;
    const user = req.user; // Get the user ID from the request object

    // Validate input data
    if (!firstName || !lastName || !username || !email) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      });
    }

    // Update the user profile
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { firstName, lastName, username, email },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        message: "User profile updated successfully",
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Unable to update user profile",
      error: err.message,
    });
  }
};

module.exports = {
  // Export funtions for currently authenticated users
  getCurrentUser,
  changeProfilePicture,

  // Export functions for all users
  index,
  update,
};
