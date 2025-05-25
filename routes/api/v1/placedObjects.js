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
  "/collections/:collectionId",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  placedObjectController.indexByCollection
);

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  placedObjectController.show
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  placedObjectController.destroy
);

module.exports = router;
