const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const placedObjectController = require("../../../controllers/api/v1/placedObjects");

router.post(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  placedObjectController.create
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  placedObjectController.index
);

module.exports = router;
