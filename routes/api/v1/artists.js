const express = require("express");
const router = express.Router();
const artistController = require("../../../controllers/api/v1/artists");
const passport = require("../../../passport/passport");

// Get all artists
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  artistController.index
);

// Get a single artist
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  artistController.show
);

module.exports = router;
