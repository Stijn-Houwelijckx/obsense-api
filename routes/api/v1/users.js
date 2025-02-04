const express = require("express");
const router = express.Router();
const userController = require("../../../controllers/api/v1/users");
const authController = require("../../../controllers/auth");
const passport = require("../../../passport/passport");

// Get the currently logged-in user's profile data
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  userController.getCurrentUser
);

// Get all users
router.get("/", userController.index);

// Signup and login routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.put(
  "/change-password",
  passport.authenticate("jwt", { session: false }),
  authController.changePassword
);

module.exports = router;
