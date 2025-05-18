const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const searchController = require("../../../controllers/api/v1/searchController");

// Route to search collections
router.get(
  "/collections",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  searchController.searchCollections // Controller to search collections
);

module.exports = router;
