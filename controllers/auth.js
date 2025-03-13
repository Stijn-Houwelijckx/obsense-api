const User = require("../models/api/v1/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Signup controller
const signup = async (req, res) => {
  try {
    // Get user input
    const { firstName, lastName, username, email, password } = req.body.user;

    // Ensure all fields are present
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Please fill in all fields",
        },
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "User already exists",
        },
      });
    }

    // Check if artistName is unique
    if (username) {
      const existingUser = await User.findOne({ username: username });
      if (existingUser) {
        return res.status(400).json({
          status: "fail",
          data: {
            message: "username already exists",
          },
        });
      }
    }

    // Check if password is strong enough
    if (password.length < 8) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Password should be at least 8 characters long",
        },
      });
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Please enter a valid email",
        },
      });
    }

    // Create new user with email and name
    const user = new User({
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
    });

    // Set password using passport-local-mongoose method
    await user.setPassword(password);

    // Save user to the database
    await user
      .save()
      .then((user) => {
        let token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET);

        res.status(201).json({
          status: "success",
          data: {
            _id: user._id,
            isArtist: user.isArtist,
            token: token,
          },
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: "error",
          message: "Could not create user",
          data: {
            code: 500,
            details: err.message,
          },
        });
      });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      data: {
        code: 500,
        details: err.message,
      },
    });
  }
};

// Login controller
const login = async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body.user;

    // Ensure all fields are present
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Please fill in all fields",
        },
      });
    }

    // Authenticate user
    await User.authenticate()(email, password).then((user) => {
      // If user is not found
      if (user.user === false) {
        return res.status(400).json({
          status: "fail",
          data: {
            message: "Login failed",
          },
        });
      }

      // Generate token
      let token = jwt.sign({ uid: user.user._id }, process.env.JWT_SECRET);

      // If user is found
      res.status(200).json({
        status: "success",
        data: {
          _id: user.user._id,
          isArtist: user.user.isArtist,
          token: token,
        },
      });
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      data: {
        code: 500,
        details: err.message,
      },
    });
  }
};

// Change password controller
const changePassword = async (req, res) => {
  try {
    // Get user input
    const { oldPassword, newPassword } = req.body.user;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        data: {
          message: "Unauthorized",
        },
      });
    }

    // Ensure all fields are present
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Please fill in all fields",
        },
      });
    }

    // Get user with userId from decoded token
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "User not found",
        },
      });
    }

    // Verify old password
    await user.authenticate(oldPassword).then((result) => {
      if (!result) {
        return res.status(400).json({
          status: "fail",
          data: {
            message: "Old password is incorrect",
          },
        });
      }
    });

    // Check if old password is the same as new password
    if (oldPassword === newPassword) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "New password must be different from old password",
        },
      });
    }

    // Check if password is strong enough
    if (newPassword.length < 5) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Password should be at least 5 characters long",
        },
      });
    }

    // Change password
    await user.changePassword(oldPassword, newPassword).then(() => {
      res.status(200).json({
        status: "success",
        message: "Password changed successfully",
      });
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      data: {
        code: 500,
        details: err.message,
      },
    });
  }
};

module.exports = {
  signup,
  login,
  changePassword,
};
