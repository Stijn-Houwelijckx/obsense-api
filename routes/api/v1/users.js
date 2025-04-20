const express = require("express");
const router = express.Router();
const userController = require("../../../controllers/api/v1/users");
const authController = require("../../../controllers/auth");
const passport = require("../../../passport/passport");
const validateFile = require("../../../middleware/validateFile");

// Get the currently logged-in user's profile data
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  userController.getCurrentUser
);
router.put(
  "/me/profile-picture",
  passport.authenticate("jwt", { session: false }),
  validateFile(
    /\.jpg$|\.jpeg$|\.png$/i,
    ["image/jpeg", "image/png"],
    1 * 1024 * 1024,
    "profilePicture"
  ), // File validation for cover image (1MB)
  userController.changeProfilePicture
);

// Get all users
router.get("/", userController.index);

// Update user profile
router.put(
  "/me",
  passport.authenticate("jwt", { session: false }),
  userController.update
);

// Signup and login routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.put(
  "/change-password",
  passport.authenticate("jwt", { session: false }),
  authController.changePassword
);

module.exports = router;
