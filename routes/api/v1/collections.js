const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const collectionController = require("../../../controllers/api/v1/collections");
const validateFile = require("../../../middleware/validateFile"); // For file validation
const multer = require("multer");

// Initialize multer for file handling (must match field name used in the frontend form)
const upload = multer();

router.post(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  validateFile(
    /\.jpg$|\.jpeg$|\.png$/i,
    ["image/jpeg", "image/png"],
    1 * 1024 * 1024,
    "coverImage"
  ), // File validation for cover image (1MB)
  collectionController.create // Controller to handle collection creation
);

module.exports = router;
