const PlacedObject = require("../../../models/api/v1/PlacedObject");
const Collection = require("../../../models/api/v1/Collection");
const Object = require("../../../models/api/v1/Object");
const mongoose = require("mongoose");

const save = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    const currentUser = req.user;
    if (!currentUser || !currentUser.isArtist) {
      return res.status(403).json({
        code: 403,
        status: "fail",
        message: "Forbidden: Only artists can access their collections.",
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
      origin,
    } = req.body.placedObject;

    // Validate required fields
    if (
      !placedObjectId ||
      !collectionId ||
      !objectId ||
      !position ||
      !scale ||
      !rotation ||
      deviceHeading === undefined ||
      !origin ||
      !origin.lat === undefined ||
      !origin.lon === undefined ||
      !origin.heading === undefined
    ) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Missing required fields",
      });
    }

    // Check if the collection exists and belongs to the current user
    const collection = await Collection.findOne({
      _id: collectionId,
      createdBy: currentUser._id,
    });

    if (!collection) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Collection not found or does not belong to the user",
      });
    }

    // Check if the object exists and belongs to the current user
    const object = await Object.findOne({
      _id: objectId,
      uploadedBy: currentUser._id,
    });

    if (!object) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Object not found or does not belong to the user",
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
      existingPlacedObject.origin = origin;
      const updatedPlacedObject = await existingPlacedObject.save();

      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Placed object updated successfully",
        data: {
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
        origin,
      });

      return res.status(201).json({
        code: 201,
        status: "success",
        message: "Placed object created successfully",
        data: {
          placedObject: newPlacedObject,
        },
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: {
        details: err.message,
      },
    });
  }
};

// Get placed objects by collection ID
const indexByCollection = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    const { collectionId } = req.params;

    // Check if the collection exists
    const collection = await Collection.findOne({
      _id: collectionId,
    });

    if (!collection) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Collection not found",
      });
    }

    // Get placed objects for the specified collection
    const placedObjects = await PlacedObject.find({
      collectionRef: collectionId,
    }).populate("object");

    if (!placedObjects || placedObjects.length === 0) {
      return res.status(204).json({
        code: 204,
        status: "success",
        message: "No placed objects found in this collection.",
        data: {
          placedObjects: [],
        },
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        placedObjects: placedObjects,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: {
        details: err.message,
      },
    });
  }
};

const destroy = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    const currentUser = req.user;
    if (!currentUser || !currentUser.isArtist) {
      return res.status(403).json({
        code: 403,
        status: "fail",
        message: "Forbidden: Only artists can access their collections.",
      });
    }

    // Check if the ID is a valid MongoDB ObjectId, if not return 404
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Placed object not found",
      });
    }

    // Check if the placed object exists
    const placedObject = await PlacedObject.findById(id);
    if (!placedObject) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Placed object not found",
      });
    }

    // Check if the collection of the placed object belongs to the current user
    const collection = await Collection.findOne({
      _id: placedObject.collectionRef,
      createdBy: currentUser._id,
    });

    if (!collection) {
      return res.status(403).json({
        code: 403,
        status: "fail",
        message:
          "Forbidden: You do not have permission to delete this placed object.",
      });
    }

    // Delete the placed object
    await PlacedObject.deleteOne({ _id: id });

    res.status(200).json({
      code: 200,
      status: "success",
      message: "Placed object deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: {
        details: err.message,
      },
    });
  }
};

const show = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    // Check if the ID is a valid MongoDB ObjectId, if not return 404
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Placed object not found",
      });
    }

    // Find the placed object by ID
    const placedObject = await PlacedObject.findById(id)
      .select("object")
      .populate({
        path: "object",
        select: "title description thumbnail",
      })
      .lean();

    if (!placedObject) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Placed object not found",
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        placedObject: placedObject,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: {
        details: err.message,
      },
    });
  }
};

module.exports = {
  save,
  indexByCollection,
  show,
  destroy,
};
