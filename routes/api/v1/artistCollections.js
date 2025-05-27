const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const artistCollectionController = require("../../../controllers/api/v1/artistCollections");
const validateFile = require("../../../middleware/validateFile"); // For file validation
const multer = require("multer");

// Initialize multer for file handling (must match field name used in the frontend form)
const upload = multer();

// Route to create a new collection
router.post(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  validateFile(
    /\.jpg$|\.jpeg$|\.png$/i,
    ["image/jpeg", "image/png"],
    1 * 1024 * 1024,
    "coverImage"
  ), // File validation for cover image (1MB)
  artistCollectionController.create // Controller to handle collection creation
);

// Route to get collections for the logged-in artist
router.get(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  artistCollectionController.index // Controller to get the artist's collections
);

// Route to get a single collection by ID
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  artistCollectionController.show // Controller to get a single collection
);

// Route to add objects to a collection
router.patch(
  "/:id/add-objects",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  artistCollectionController.addObjects // Controller to add objects to a collection
);

router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  artistCollectionController.updateCollection
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    console.log("DELETE route triggered for id:", req.params.id);
    next();
  },
  artistCollectionController.deleteCollection
);

module.exports = router;
