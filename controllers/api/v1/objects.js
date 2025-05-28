const Object = require("../../../models/api/v1/Object");
const Collection = require("../../../models/api/v1/Collection");
const uploadToCloudinary = require("../../../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../../../utils/deleteFromCloudinary");

const create = async (req, res) => {
  try {
    // Check if the user is authenticated and is an artist
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    const currentUser = req.user;
    if (!currentUser.isArtist) {
      return res.status(403).json({
        code: 403,
        status: "fail",
        message: "Forbidden: Only artists can upload objects.",
      });
    }

    // Now, assuming the file has been validated already, we can proceed:
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "No file uploaded.",
      });
    }

    // Collecting user input for the object creation
    const data = JSON.parse(req.body.object);

    const { title, description } = data.object;

    if (!title) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Title is required.",
      });
    }

    // Validation for title, description
    if (title.length < 1 || title.length > 35) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Title must be between 1 and 35 characters.",
      });
    }

    if (description && description.length > 500) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Description cannot exceed 500 characters.",
      });
    }

    // If file is valid, upload it to Cloudinary
    const objectFileResult = await uploadToCloudinary(
      req.file.path,
      "object",
      req.file.originalname
    );

    if (!objectFileResult) {
      return res.status(500).json({
        code: 500,
        status: "error",
        message: "Error uploading 3D-Object to Cloudinary",
      });
    }

    // console.log("Uploaded 3D-Object to Cloudinary:");
    // console.log(objectFileResult);

    // Create the new object document
    const newObject = new Object({
      uploadedBy: currentUser._id,
      title,
      description: description || "No description provided", // Default to "No description"
      file: {
        fileName: objectFileResult.public_id, // Cloudinary public ID
        filePath: objectFileResult.url, // Cloudinary secure URL
        fileType: objectFileResult.format, // File format from Cloudinary
        fileSize: objectFileResult.bytes, // File size from Cloudinary (in bytes)
      },
    });

    // Save the new object to the database
    const savedObject = await newObject.save();

    res.status(201).json({
      code: 201,
      status: "success",
      data: {
        object: savedObject,
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

const indexByCreator = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    const userObjects = await Object.find({ uploadedBy: req.user._id }).lean();

    if (!userObjects || userObjects.length === 0) {
      return res.status(204).json({
        code: 204,
        status: "success",
        message: "No objects.",
        data: {
          objects: [],
        },
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        objects: userObjects,
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

// Get all objects by collection
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

    const collectionId = req.params.id;

    // Fetch the collection
    const collection = await Collection.findById(collectionId)
      .populate("objects")
      .lean();

    if (!collection) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Collection not found.",
      });
    }

    const objects = collection.objects;

    if (!objects || objects.length === 0) {
      return res.status(204).json({
        code: 204,
        status: "success",
        message: "No objects found in this collection.",
        data: {
          objects: [],
        },
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        objects: objects,
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

const show = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    // Find the user from the database to check if they are an artist
    const currentUser = req.user;
    if (!currentUser || !currentUser.isArtist) {
      return res.status(403).json({
        code: 403,
        status: "fail",
        message: "Forbidden: Only artists can access their collections.",
      });
    }

    const { id } = req.params;

    // Find the collection by ID and ensure it belongs to the current user
    const object = await Object.findOne({
      _id: id,
      uploadedBy: req.user._id,
    })
      .populate("uploadedBy", "username") // Only populate 'username' field in createdBy
      .lean();

    if (!object) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Object not found or access denied.",
      });
    }

    return res.status(200).json({
      code: 200,
      status: "success",
      data: { object: object },
    });
  } catch (error) {
    console.error("Error fetching object:", error);
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Error fetching object.",
    });
  }
};

const update = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    const { title, description } = req.body.object;
    const id = req.params.id; // Get the object ID from the request parameters
    const user = req.user; // Get the user ID from the request object

    // check if user owns object
    const object = await Object.findOne({ _id: id, uploadedBy: user._id });
    if (!object) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Object not found or access denied.",
      });
    }

    // Validate input data
    if (!title || !description) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "All fields are required",
      });
    }

    // update the object
    object.title = title;
    object.description = description;
    const updatedObject = await object.save();
    if (!updatedObject) {
      return res.status(500).json({
        code: 500,
        status: "error",
        message: "Error updating object",
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        object: updatedObject,
      },
    });
  } catch (err) {
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

const deleteObject = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    const objectId = req.params.id;
    const currentUser = req.user;

    // Validate the object ID
    const object = await Object.findOne({
      _id: objectId,
      uploadedBy: currentUser._id,
    });

    if (!object) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Object not found or access denied.",
      });
    }

    // Delete the file from Cloudinary
    try {
      await deleteFromCloudinary(object.file.fileName, "object");
    } catch (err) {
      console.error("Failed to delete file from Cloudinary:", err.message);
      return res.status(500).json({
        code: 500,
        status: "error",
        message: "Error deleting file from Cloudinary",
        data: { details: err.message },
      });
    }

    // Delete the thumbnail if it exists
    if (object.thumbnail && object.thumbnail.fileName) {
      try {
        await deleteFromCloudinary(object.thumbnail.fileName, "image");
      } catch (err) {
        console.warn(
          "Failed to delete thumbnail from Cloudinary:",
          err.message
        );
        // Not a fatal error, continue
      }
    }

    await object.deleteOne();

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Object deleted successfully.",
    });
  } catch (err) {
    console.error("Error deleting object:", err);
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: { details: err.message },
    });
  }
};

const deleteThumbnail = async (req, res) => {
  const objectId = req.params.id;

  try {
    const object = await Object.findById(objectId);
    if (!object) {
      return res.status(404).json({ message: "Object niet gevonden" });
    }

    // Optioneel: verwijder ook thumbnail uit Cloudinary als dat nodig is
    if (object.thumbnail && object.thumbnail.fileName) {
      try {
        await deleteFromCloudinary(object.thumbnail.fileName, "image");
      } catch (err) {
        console.warn(
          "Failed to delete thumbnail from Cloudinary:",
          err.message
        );
      }
    }

    object.thumbnail = null;
    await object.save();

    res.status(200).json({ message: "Thumbnail verwijderd" });
  } catch (error) {
    console.error("Error deleting thumbnail:", error);
    res.status(500).json({ message: "Fout bij verwijderen thumbnail" });
  }
};

const setThumbnail = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "No file uploaded.",
      });
    }

    // Find the object by ID and ensure it belongs to the current user
    const object = await Object.findOne({
      _id: id,
      uploadedBy: req.user._id,
    });
    if (!object) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Object not found or access denied.",
      });
    }

    // If there is already a thumbnail, delete the old one
    if (object.thumbnail && object.thumbnail.fileName) {
      try {
        await deleteFromCloudinary(object.thumbnail.fileName, "image");
      } catch (err) {
        console.warn(
          "Failed to delete old thumbnail from Cloudinary:",
          err.message
        );
        // Not a fatal error, continue
      }
    }

    // If file is valid, upload it to Cloudinary
    const objectThumbnailFileResult = await uploadToCloudinary(
      req.file.path,
      "objectThumbnail",
      req.file.originalname
    );

    if (!objectThumbnailFileResult) {
      return res.status(500).json({
        code: 500,
        status: "error",
        message: "Error uploading thumbnail to Cloudinary",
      });
    }

    // Update the object's thumbnail information
    object.thumbnail = {
      fileName: objectThumbnailFileResult.public_id, // Cloudinary public ID
      filePath: objectThumbnailFileResult.url, // Cloudinary secure URL
      fileType: objectThumbnailFileResult.format, // File format from Cloudinary
      fileSize: objectThumbnailFileResult.bytes, // File size from Cloudinary (in bytes)
    };

    // Save the updated object
    const updatedObject = await object.save();

    if (!updatedObject) {
      return res.status(500).json({
        code: 500,
        status: "error",
        message: "Error saving thumbnail to object.",
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        object: updatedObject,
      },
    });
  } catch (error) {
    console.error("Error setting thumbnail:", error);
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Error setting thumbnail.",
    });
  }
};

module.exports = {
  create,
  indexByCreator,
  indexByCollection,
  show,
  update,
  deleteObject,
  setThumbnail,
  deleteThumbnail,
};
