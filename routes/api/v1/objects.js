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
  ), // File validation for cover image (1MB)
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

// update title and description of an object
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  objectController.update
);

module.exports = router;
