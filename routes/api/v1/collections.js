const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const collectionController = require("../../../controllers/api/v1/collections");

// Route to get all collections
router.get(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  collectionController.index // Controller to get the artist's collections
);

// Route to get all collections by artist ID
router.get(
  "/creator/:id",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  collectionController.indexByCreator // Controller to get a single collection
);

// Route to get all collections by genre ID
router.get(
  "/genre/:id",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  collectionController.indexByGenre // Controller to get a single collection
);

// Route to get a single collection by ID
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  collectionController.show // Controller to get a single collection
);

// Like a collection
router.post(
  "/:id/like",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  collectionController.likeCollection // Controller to like a collection
);

module.exports = router;
