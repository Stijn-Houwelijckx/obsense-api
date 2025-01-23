const User = require("../models/api/v1/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// const config = require("config");

// Signup controller
const signup = async (req, res) => {
  try {
    // Get user input
    const { firstname, lastname, email, password } = req.body.user;

    // Ensure all fields are present
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please fill in all fields",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }

    // Check if password is strong enough
    if (password.length < 5) {
      return res.status(400).json({
        status: "error",
        message: "Password should be at least 5 characters long",
      });
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Please enter a valid email",
      });
    }

    // Create new user with email and name
    const user = new User({
      firstname: firstname,
      lastname: lastname,
      email: email,
    });

    // Set password using passport-local-mongoose method
    await user.setPassword(password);

    // Save user to the database
    await user
      .save()
      .then((user) => {
        let token = jwt.sign(
          {
            uid: user._id,
            email: user.email,
          },
          process.env.JWT_SECRET
        );

        res.status(201).json({
          status: "success",
          data: {
            token: token,
          },
        });
      })
      .catch((err) => {
        res.status(400).json({
          status: "error",
          message: "Could not create user",
          error: err.message,
        });
      });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: err.message,
    });
  }
};

module.exports = {
  signup,
};
