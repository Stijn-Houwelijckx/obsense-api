const User = require("../../../models/api/v1/User");
const uploadToCloudinary = require("../../../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../../../utils/deleteFromCloudinary");

// Functions to handle requests for the authenticated user

// Get profile data of authenticated user
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Authorisation failed. Please sign in again.",
      });
    }

    // Get profile data of the authenticated user, excluding sensitive fields
    const user = await User.findById(req.user._id) // Get the user ID from the request object
      .select(
        "firstName lastName username email isArtist profilePicture tokens"
      )
      .lean(); // Use lean() for performance if we don't need Mongoose documents

    if (!user) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "This user could not be found.",
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        user: user,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: "error",
      message: "This user could not be found. Please try again.",
      data: {
        details: error.message,
      },
    });
  }
};

// Change password of authenticated user
const changePassword = async (req, res) => {
  try {
    // Get user input
    const { oldPassword, newPassword } = req.body.user;

    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Authorisation failed. Please sign in again.",
      });
    }

    // Make sure all fields are filled in
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Please fill in all required fields.",
      });
    }

    // Get user with userId from decoded JWT token
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "This user could not be found.",
      });
    }

    // Check if the old password is correct
    const { user: authenticatedUser, error } = await User.authenticate()(
      user.email,
      oldPassword
    );
    if (error || !authenticatedUser) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "The old password is incorrect.",
        data: {
          oldPassword: "The old password is incorrect.",
        },
      });
    }

    // Check if old password is the same as new password
    if (oldPassword === newPassword) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "The new password must be different from the old password.",
      });
    }

    // Check if new password is long enough
    if (newPassword.length < 8) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "The password should be at least 8 characters long.",
      });
    }

    // Change the password of the user
    await user.changePassword(oldPassword, newPassword).then(() => {
      res.status(200).json({
        code: 200,
        status: "success",
        message: "The password has been changed with success.",
      });
    });
  } catch (err) {
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Something went wrong. Please try again.",
      data: {
        details: err.message,
      },
    });
  }
};

// Change profile picture of authenticated user
const changeProfilePicture = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Authorisation failed. Please sign in again.",
      });
    }

    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "There was no file uploaded. Please try again.",
      });
    }

    // Get current profile picture of the authenticated user
    const user = await User.findById(req.user._id).select("profilePicture");

    // Delete current profile picture from cloudinary
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

    // Update profile picture details of the authenticated user
    user.profilePicture = {
      fileName: result.public_id,
      filePath: result.url,
      fileType: result.format,
      fileSize: result.bytes,
    };

    // Save the updated profile picture details to the database
    await user.save();

    // Fetch the complete user details
    const updatedUser = await User.findById(req.user._id).select(
      "firstName lastName username email isArtist profilePicture tokens"
    );

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Something went wrong. Please try again.",
      data: {
        details: err.message,
      },
    });
  }
};

// Update the user profile
const update = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    const { firstName, lastName, username, email } = req.body.user;
    const user = req.user; // Get the user ID from the request object

    // Validate input data
    if (!firstName || !lastName || !username || !email) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "All fields are required",
      });
    }

    // Check if email or username already exists
    const existingEmailUser = await User.findOne({
      email: email,
      _id: { $ne: user._id },
    });
    const existingUsernameUser = await User.findOne({
      username: username,
      _id: { $ne: user._id },
    });

    if (existingEmailUser || existingUsernameUser) {
      const data = {};
      if (existingEmailUser) {
        data.email = "This email is already in use. Please try again.";
      }
      if (existingUsernameUser) {
        data.username = "This username already exists. Please try again.";
      }
      return res.status(409).json({
        code: 409,
        status: "fail",
        message: "Credentials already exist.",
        data,
      });
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Please enter a valid email",
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
        code: 404,
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      message: "User profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: {
        details: err.message,
      },
    });
  }
};

// Delete account
const destroy = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    // Delete the user account
    const deletedUser = await User.findByIdAndDelete(req.user._id);

    if (!deletedUser) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      message: "User account deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: {
        details: err.message,
      },
    });
  }
};

const makeArtist = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    // Update the user's isArtist field to true
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { isArtist: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      message: "User has been made an artist successfully.",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: {
        details: err.message,
      },
    });
  }
};

module.exports = {
  getCurrentUser,
  changePassword,
  changeProfilePicture,
  update,
  destroy,
  makeArtist,
};
