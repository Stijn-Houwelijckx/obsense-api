const Object = require("../../../models/api/v1/Object");
const Collection = require("../../../models/api/v1/Collection");
const uploadToCloudinary = require("../../../utils/uploadToCloudinary");

const create = async (req, res) => {
  try {
    // Check if the user is authenticated and is an artist
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        data: {
          message: "Unauthorized",
        },
      });
    }

    const currentUser = req.user;
    if (!currentUser.isArtist) {
      return res.status(403).json({
        status: "fail",
        data: {
          message: "Forbidden: Only artists can upload objects.",
        },
      });
    }

    // Now, assuming the file has been validated already, we can proceed:
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "No file uploaded.",
        },
      });
    }

    // Collecting user input for the object creation
    const data = JSON.parse(req.body.object);

    const { title, description } = data.object;

    if (!title) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Title is required.",
        },
      });
    }

    // Validation for title, description
    if (title.length < 1 || title.length > 35) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Title must be between 1 and 35 characters.",
        },
      });
    }

    if (description && description.length > 500) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Description cannot exceed 500 characters.",
        },
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
        status: "fail",
        data: {
          message: "Error uploading 3D-Object to Cloudinary",
        },
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
      status: "success",
      data: {
        object: savedObject,
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

// Get all objects by collection
const indexByCollection = async (req, res) => {
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

    const collectionId = req.params.id;

    // Fetch the collection
    const collection = await Collection.findById(collectionId)
      .populate("objects")
      .lean();

    if (!collection) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "Collection not found.",
        },
      });
    }

    const objects = collection.objects;

    if (!objects || objects.length === 0) {
      return res.status(204).json({
        status: "success",
        message: "No objects found in this collection.",
        data: {
          objects: [],
        },
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        objects: objects,
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
  create,
  indexByCollection,
};
