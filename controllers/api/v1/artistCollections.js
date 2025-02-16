const Collection = require("../../../models/api/v1/Collection");
const Object = require("../../../models/api/v1/Object");
const User = require("../../../models/api/v1/User");
const uploadToCloudinary = require("../../../utils/uploadToCloudinary");

// Controller to create a new collection
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
          message: "Forbidden: Only artists can create collections.",
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

    // Collecting user input for the collection creation
    const data = JSON.parse(req.body.collection); // Parse the JSON data because it's a string because of FormData

    let { type } = data.collection;
    type = type.toLowerCase(); // Convert to lowercase for consistency
    const { title, description, city, price, genres } = data.collection;

    if (!type || !title || !city || !price) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Please fill in all required fields.",
        },
      });
    }

    if (type !== "tour" && type !== "exposition") {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Invalid collection type.",
        },
      });
    }

    // Validation for title, description, price
    if (title.length < 1 || title.length > 35) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Title must be between 1 and 35 characters.",
        },
      });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Description cannot exceed 1000 characters.",
        },
      });
    }

    const priceValue = Number(price);
    if (price < 0 || !Number.isInteger(priceValue)) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Price must be a non-negative integer.",
        },
      });
    }

    // console.log("Uploaded file object:", req.file);

    // If file is valid, upload it to Cloudinary
    const coverImageResult = await uploadToCloudinary(
      req.file.path,
      "coverImage",
      req.file.originalname
    );

    if (!coverImageResult) {
      return res.status(500).json({
        status: "fail",
        data: {
          message: "Error uploading cover image to Cloudinary",
        },
      });
    }

    // Create the new collection document
    const newCollection = new Collection({
      type,
      title,
      description: description || "No description", // Default to "No description"
      city,
      price,
      coverImage: {
        fileName: coverImageResult.public_id, // Cloudinary public ID
        filePath: coverImageResult.url, // Cloudinary secure URL
        fileType: coverImageResult.format, // File format from Cloudinary
        fileSize: coverImageResult.bytes, // File size from Cloudinary (in bytes)
      },
      createdBy: req.user._id, // Set the creator as the logged-in user
      genres: genres || [], // Allow empty genres
      isActive: true, // Active by default
    });

    // Save the new collection to the database
    const savedCollection = await newCollection.save();

    res.status(201).json({
      status: "success",
      data: {
        collection: savedCollection,
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

// Get collections of the currently logged-in artist
const index = async (req, res) => {
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

    // Find the user from the database to check if they are an artist
    const currentUser = req.user;
    if (!currentUser || !currentUser.isArtist) {
      return res.status(403).json({
        status: "fail",
        data: {
          message: "Forbidden: Only artists can access their collections.",
        },
      });
    }

    // Find collections for the artist and select only necessary fields
    const collections = await Collection.find({ createdBy: req.user._id })
      .select("_id type title coverImage isPublished isActive location") // Select necessary fields
      .sort({ createdAt: -1 }); // Optional: Sort by creation date (newest first)

    if (!collections || collections.length === 0) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "No collections found for this artist.",
        },
      });
    }

    return res.status(200).json({
      status: "success",
      data: { collections: collections },
    });
  } catch (error) {
    console.error("Error fetching artist collections:", error);
    return res.status(500).json({
      status: "fail",
      data: {
        message: "Error fetching collections.",
      },
    });
  }
};

// Get a specific collection by ID for the currently logged-in artist
const show = async (req, res) => {
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

    // Find the user from the database to check if they are an artist
    const currentUser = req.user;
    if (!currentUser || !currentUser.isArtist) {
      return res.status(403).json({
        status: "fail",
        data: {
          message: "Forbidden: Only artists can access their collections.",
        },
      });
    }

    const { id } = req.params;

    // Find the collection by ID and ensure it belongs to the current user
    const collection = await Collection.findOne({
      _id: id,
      createdBy: req.user._id,
    })
      .populate("createdBy", "username") // Only populate 'username' field in createdBy
      .populate("objects") // Populate other fields as needed
      .populate("genres")
      .populate("likes")
      .populate("views")
      .populate("ratings.user");

    if (!collection) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "Collection not found or access denied.",
        },
      });
    }

    return res.status(200).json({
      status: "success",
      data: { collection: collection },
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return res.status(500).json({
      status: "fail",
      data: {
        message: "Error fetching collection.",
      },
    });
  }
};

// Add object(s) to collection
const addObjects = async (req, res) => {
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

    // Find the user from the database to check if they are an artist
    const currentUser = req.user;
    if (!currentUser || !currentUser.isArtist) {
      return res.status(403).json({
        status: "fail",
        data: {
          message: "Forbidden: Only artists can add objects to collections.",
        },
      });
    }

    const collectionId = req.params.id;
    const { objectIds } = req.body.objects;

    // Ensure objectIds is an array
    if (!Array.isArray(objectIds) || objectIds.length === 0) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Please provide an array of object IDs.",
        },
      });
    }

    // Find the collection by ID and ensure it belongs to the current user
    const collection = await Collection.findOne({
      _id: collectionId,
      createdBy: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "Collection not found or access denied.",
        },
      });
    }

    // Check if the collection has reached its maxObjects limit
    if (collection.objects.length + objectIds.length > collection.maxObjects) {
      return res.status(400).json({
        status: "fail",
        data: {
          message:
            "Maximum objects reached for this collection. Buy more slots.",
        },
      });
    }

    // Remove duplicates from the objectIds array
    const uniqueObjectIds = objectIds.filter(
      (id) => !collection.objects.includes(id)
    );

    // If there are no unique IDs to add, return a message
    if (uniqueObjectIds.length === 0) {
      return res.status(400).json({
        status: "fail",
        data: {
          message:
            "No new objects to add. All objects are already in the collection.",
        },
      });
    }

    // Add the unique objects to the collection
    collection.objects.push(...uniqueObjectIds);
    await collection.save();

    return res.status(200).json({
      status: "success",
      data: {
        collection: collection,
      },
    });
  } catch (error) {
    console.error("Error adding objects to collection:", error);
    return res.status(500).json({
      status: "fail",
      data: {
        message: "Error adding objects to collection.",
      },
    });
  }
};

module.exports = {
  create,
  index,
  show,

  addObjects,
};
