const User = require("../../../models/api/v1/User");

require("dotenv").config();
const jwt = require("jsonwebtoken");

// Sign Up controller
const signup = async (req, res) => {
  try {
    // Get user input
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      isArtist = false,
    } = req.body.user;

    // Make sure all fields are filled in
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Please fill in all required fields.",
      });
    }

    // Check if email or username already exists
    const existingEmailUser = await User.findOne({ email: email });
    const existingUsernameUser = username
      ? await User.findOne({ username: username })
      : null;

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

    // Check if password is long enough
    if (password.length < 8) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "The password should be at least 8 characters long.",
      });
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Please enter a valid email address to sign up.",
      });
    }

    // Create new user object
    const user = new User({ firstName, lastName, username, email, isArtist });

    // Set password using passport-local-mongoose method
    await user.setPassword(password);

    // Authenticate user and save user to the database
    await user
      .save()
      .then((user) => {
        let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.status(201).json({
          code: 201,
          status: "success",
          data: {
            _id: user._id,
            isArtist: user.isArtist,
            token: token,
          },
        });
      })
      .catch((error) => {
        res.status(500).json({
          code: 500,
          status: "error",
          message: "Could not create user. Please try again.",
          data: {
            details: error.message,
          },
        });
      });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Something went wrong. Please try again.",
      data: {
        details: error.message,
      },
    });
  }
};

// Login controller
const login = async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body.user;

    // Make sure all fields are filled in
    if (!email || !password) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Please fill in all required fields.",
      });
    }

    // Authenticate user
    await User.authenticate()(email, password).then((user) => {
      // If user is not found
      if (user.user === false) {
        return res.status(401).json({
          code: 401,
          status: "fail",
          message: "Invalid email or password. Please try again.",
        });
      }

      // Generate token
      let token = jwt.sign({ id: user.user._id }, process.env.JWT_SECRET);

      // If user is found
      res.status(200).json({
        code: 200,
        status: "success",
        data: {
          _id: user.user._id,
          isArtist: user.user.isArtist,
          token: token,
        },
      });
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Something went wrong. Please try again.",
      data: {
        details: error.message,
      },
    });
  }
};

module.exports = {
  signup,
  login,
};
