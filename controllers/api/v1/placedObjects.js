const PlacedObject = require("../../../models/api/v1/PlacedObject");
const Collection = require("../../../models/api/v1/Collection");
const Object = require("../../../models/api/v1/Object");
const mongoose = require("mongoose");

const save = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        data: {
          message: "Unauthorized",
        },
      });
    }

    const currentUser = req.user;
    if (!currentUser || !currentUser.isArtist) {
      return res.status(403).json({
        status: "fail",
        data: {
          message: "Forbidden: Only artists can access their collections.",
        },
      });
    }

    const {
      placedObjectId,
      collectionId,
      objectId,
      position,
      scale,
      rotation,
      deviceHeading,
    } = req.body.placedObject;

    // Validate required fields
    if (
      !placedObjectId ||
      !collectionId ||
      !objectId ||
      !position ||
      !scale ||
      !rotation ||
      deviceHeading === undefined
    ) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Missing required fields",
        },
      });
    }

    // Check if the collection exists and belongs to the current user
    const collection = await Collection.findOne({
      _id: collectionId,
      createdBy: currentUser._id,
    });

    if (!collection) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "Collection not found or does not belong to the user",
        },
      });
    }

    // Check if the object exists and belongs to the current user
    const object = await Object.findOne({
      _id: objectId,
      uploadedBy: currentUser._id,
    });

    if (!object) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "Object not found or does not belong to the user",
        },
      });
    }

    // Check if the object is already in the collection
    let existingPlacedObject;

    // Check if the provided placedObjectId is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(placedObjectId)) {
      existingPlacedObject = await PlacedObject.findById(placedObjectId);
    }

    // Check if the object is already placed in the collection
    if (existingPlacedObject) {
      // Update the existing placed object
      existingPlacedObject.position = position;
      existingPlacedObject.scale = scale;
      existingPlacedObject.rotation = rotation;
      existingPlacedObject.deviceHeading = deviceHeading;
      const updatedPlacedObject = await existingPlacedObject.save();

      return res.status(200).json({
        status: "success",
        data: {
          message: "Placed object updated successfully",
          placedObject: updatedPlacedObject,
        },
      });
    } else {
      // Create a new placed object
      const newPlacedObject = await PlacedObject.create({
        collectionRef: collectionId,
        object: objectId,
        position,
        scale,
        rotation,
        deviceHeading,
      });

      return res.status(201).json({
        status: "success",
        data: {
          message: "Placed object created successfully",
          placedObject: newPlacedObject,
        },
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Server error",
      data: {
        code: 500,
        details: err.message,
      },
    });
  }
};

// Get collections of the currently logged-in artist
const index = async (req, res) => {
  res
    .status(200)
    .json({ message: "Get placed objects function not implemented yet." });
};

const destroy = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        data: {
          message: "Unauthorized",
        },
      });
    }

    const currentUser = req.user;
    if (!currentUser || !currentUser.isArtist) {
      return res.status(403).json({
        status: "fail",
        data: {
          message: "Forbidden: Only artists can access their collections.",
        },
      });
    }

    // Check if the placed object exists
    const placedObject = await PlacedObject.findById(id);
    if (!placedObject) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "Placed object not found",
        },
      });
    }

    // Check if the collection of the placed object belongs to the current user
    const collection = await Collection.findOne({
      _id: placedObject.collectionRef,
      createdBy: currentUser._id,
    });

    if (!collection) {
      return res.status(403).json({
        status: "fail",
        data: {
          message:
            "Forbidden: You do not have permission to delete this placed object.",
        },
      });
    }

    // Delete the placed object
    await PlacedObject.deleteOne({ _id: id });

    res.status(200).json({
      status: "success",
      data: {
        message: "Placed object deleted successfully",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Server error",
      data: {
        code: 500,
        details: err.message,
      },
    });
  }
};

module.exports = {
  save,
  index,
  destroy,
};
