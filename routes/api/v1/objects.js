const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const objectController = require("../../../controllers/api/v1/objects");

router.post(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  objectController.create
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  objectController.index
);

module.exports = router;
