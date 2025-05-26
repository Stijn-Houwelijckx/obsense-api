const express = require("express");
const router = express.Router();
const passport = require("../../../passport/passport");
const objectController = require("../../../controllers/api/v1/objects");
const validateFile = require("../../../middleware/validateFile"); // For file validation

router.post(
  "/",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  validateFile(
    /\.glb$/i, // Only allow .glb files
    ["application/octet-stream", "model/gltf-binary"], // MIME types for GLB
    20 * 1024 * 1024, // File size validation for object image (20MB)
    "3DObject"
  ),
  objectController.create // Controller to handle collection creation
);

router.get(
  "/collections/:id",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  objectController.indexByCollection
);

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  objectController.show
);

router.get(
  "/", // If another index route is needed, call this one /me
  passport.authenticate("jwt", { session: false }),
  objectController.indexByCreator
);
// update title and description of an object
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  objectController.update
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }), // authenticatie
  objectController.deleteObject
);

router.post(
  "/:id/thumbnail",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  validateFile(
    /\.(jpg|jpeg|png)$/i, // Allow only image files
    ["image/jpeg", "image/png"], // MIME types for images
    1 * 1024 * 1024, // File size validation for thumbnail (1MB)
    "objectThumbnail"
  ), // File validation for thumbnail
  objectController.setThumbnail // Controller to handle thumbnail upload
);

module.exports = router;
