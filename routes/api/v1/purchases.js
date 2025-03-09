const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const purchaseController = require("../../../controllers/api/v1/purchases");

router.post(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  purchaseController.create
);

module.exports = router;
