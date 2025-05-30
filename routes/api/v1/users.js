const express = require("express");
const router = express.Router();
const authController = require("../../../controllers/api/v1/auth");
const userController = require("../../../controllers/api/v1/users");
const passport = require("../../../passport/passport");
const validateFile = require("../../../middleware/validateFile");

// Get profile data of authenticated user
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  userController.getCurrentUser
);

// Update profile data of authenticated user
router.put(
  "/me",
  passport.authenticate("jwt", { session: false }),
  userController.update
);

// Delete profile data of authenticated user
router.delete(
  "/me",
  passport.authenticate("jwt", { session: false }),
  userController.destroy
);

// Change password of authenticated user
router.put(
  "/change-password",
  passport.authenticate("jwt", { session: false }),
  userController.changePassword
);

// Change profile picture of authenticated user
router.put(
  "/me/profile-picture",
  passport.authenticate("jwt", { session: false }),
  validateFile(
    /\.jpg$|\.jpeg$|\.png$/i,
    ["image/jpeg", "image/png"],
    1 * 1024 * 1024,
    "profilePicture"
  ), // File validation for profile picture (1MB)
  userController.changeProfilePicture
);

// Update profile data of authenticated user
router.patch(
  "/me/make-artist",
  passport.authenticate("jwt", { session: false }),
  userController.makeArtist
);

// Get all users
router.get("/", userController.index);

// Sign Up and Login routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

module.exports = router;
