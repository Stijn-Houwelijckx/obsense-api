const express = require("express");
const router = express.Router();
const authController = require("../../../controllers/auth");
const passport = require("../../../passport/passport");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.put(
  "/change-password",
  passport.authenticate("jwt", { session: false }),
  authController.changePassword
);

module.exports = router;
