const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const genreController = require("../../../controllers/api/v1/genres");

router.post(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  genreController.create
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  genreController.index
);

module.exports = router;
