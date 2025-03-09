const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const collectionController = require("../../../controllers/api/v1/collections");

// Route to get collections for the logged-in artist
router.get(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  collectionController.index // Controller to get the artist's collections
);

module.exports = router;
