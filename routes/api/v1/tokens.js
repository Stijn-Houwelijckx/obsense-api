const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const tokenController = require("../../../controllers/api/v1/tokens");

// Route to update the user's tokens
router.put(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  tokenController.update
);

module.exports = router;
