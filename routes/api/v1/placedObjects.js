const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const placedObjectController = require("../../../controllers/api/v1/placedObjects");

router.post(
  "/save",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  placedObjectController.save
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  placedObjectController.index
);

module.exports = router;
