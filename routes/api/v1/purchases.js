const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const purchaseController = require("../../../controllers/api/v1/purchases");

// Route to create a new purchase record
router.post(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  purchaseController.create
);

// Route to get the logged-in user's purchases
router.get(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  purchaseController.index
);

module.exports = router;
