const Collection = require("../../../models/api/v1/Collection");
const Object = require("../../../models/api/v1/Object");
const PlacedObject = require("../../../models/api/v1/PlacedObject");
const Purchase = require("../../../models/api/v1/Purchase");
const Genre = require("../../../models/api/v1/Genre");
const uploadToCloudinary = require("../../../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../../../utils/deleteFromCloudinary");

// Controller to create a new collection
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
        message: "Forbidden: Only artists can create collections.",
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

    // Collecting user input for the collection creation
    const data = JSON.parse(req.body.collection); // Parse the JSON data because it's a string because of FormData

    let { type } = data.collection;
    type = type.toLowerCase(); // Convert to lowercase for consistency
    const { title, description, city, price, genres } = data.collection;

    if (!type || !title || !city || !price) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Please fill in all required fields.",
      });
    }

    if (type !== "tour" && type !== "exposition") {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Invalid collection type.",
      });
    }

    // Validation for title, description, price
    if (title.length < 1 || title.length > 35) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Title must be between 1 and 35 characters.",
      });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Description cannot exceed 1000 characters.",
      });
    }

    const priceValue = Number(price);
    if (price < 0 || !Number.isInteger(priceValue)) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Price must be a non-negative integer.",
      });
    }

    // Check if the genres id's exist in the database
    if (genres && genres.length > 0) {
      const genreIds = await Genre.find({ _id: { $in: genres } }).distinct(
        "_id"
      );
      if (genreIds.length !== genres.length) {
        return res.status(400).json({
          code: 400,
          status: "fail",
          message: "Some genres do not exist.",
        });
      }
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
        code: 500,
        status: "error",
        message: "Error uploading cover image to Cloudinary",
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
      code: 201,
      status: "success",
      data: {
        collection: savedCollection,
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

// Get collections of the currently logged-in artist
const index = async (req, res) => {
  try {
    // Check if the user is authenticated and is an artist
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

    // Find collections for the artist and select only necessary fields
    const collections = await Collection.find({ createdBy: req.user._id })
      .select(
        "_id type title city coverImage objects isPublished isActive location"
      ) // Select necessary fields
      .sort({ createdAt: -1 }); // Optional: Sort by creation date (newest first)

    if (!collections || collections.length === 0) {
      return res.status(204).json({
        code: 204,
        status: "success",
        message: "No collections found.",
        data: {
          collections: [],
        },
      });
    }

    return res.status(200).json({
      code: 200,
      status: "success",
      data: {
        collections: collections,
      },
    });
  } catch (error) {
    console.error("Error fetching artist collections:", error);
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Error fetching collections.",
    });
  }
};

// Get a specific collection by ID for the currently logged-in artist
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
    const collection = await Collection.findOne({
      _id: id,
      createdBy: req.user._id,
    })
      .populate("createdBy", "username") // Only populate 'username' field in createdBy
      .populate("objects") // Populate other fields as needed
      .populate("genres")
      .populate("likes", "username")
      .populate("views", "username")
      .populate("ratings.user", "username")
      .populate("ratings.rating");

    if (!collection) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Collection not found or access denied.",
      });
    }

    return res.status(200).json({
      code: 200,
      status: "success",
      data: { collection: collection },
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Error fetching collection.",
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

    // Find the user from the database to check if they are an artist
    const currentUser = req.user;
    if (!currentUser || !currentUser.isArtist) {
      return res.status(403).json({
        code: 403,
        status: "fail",
        message: "Forbidden: Only artists can update collections.",
      });
    }

    const data = JSON.parse(req.body.collection);

    const { id } = req.params;
    const { title, description, city, price, genres } = data.collection;

    // Validation for title, description, price
    if (title.length < 1 || title.length > 35) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Title must be between 1 and 35 characters.",
      });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Description cannot exceed 1000 characters.",
      });
    }

    const priceValue = Number(price);
    if (price < 0 || !Number.isInteger(priceValue)) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Price must be a non-negative integer.",
      });
    }

    // Check if the genres id's exist in the database
    if (genres && genres.length > 0) {
      const genreIds = await Genre.find({ _id: { $in: genres } }).distinct(
        "_id"
      );
      if (genreIds.length !== genres.length) {
        return res.status(400).json({
          code: 400,
          status: "fail",
          message: "Some genres do not exist.",
        });
      }
    }

    // Zoek collectie, controleer eigenaar
    const collection = await Collection.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Collection not found or access denied.",
      });
    }

    // --- Handle optional cover image update ---
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (collection.coverImage && collection.coverImage.fileName) {
        await deleteFromCloudinary(collection.coverImage.fileName);
      }
      // Upload new image
      const coverImageResult = await uploadToCloudinary(
        req.file.path,
        "coverImage",
        req.file.originalname
      );
      if (!coverImageResult) {
        return res.status(500).json({
          code: 500,
          status: "error",
          message: "Error uploading cover image to Cloudinary",
        });
      }
      // Update coverImage field
      collection.coverImage = {
        fileName: coverImageResult.public_id,
        filePath: coverImageResult.url,
        fileType: coverImageResult.format,
        fileSize: coverImageResult.bytes,
      };
    }
    // If no file, keep the existing coverImage

    // Update collection fields
    collection.title = title;
    collection.description = description || "No description"; // Default to "No description"
    collection.city = city;
    collection.price = priceValue; // Ensure price is a number
    collection.genres = genres || []; // Allow empty genres

    // Save the updated collection
    const updatedCollection = await collection.save();

    return res.status(200).json({
      code: 200,
      status: "success",
      data: {
        collection: updatedCollection,
      },
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: { details: error.message },
    });
  }
};

const destroy = async (req, res) => {
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
        message: "Forbidden: Only artists can delete collections.",
      });
    }

    const { id } = req.params;

    // Zoek collectie die hoort bij ingelogde user
    const collection = await Collection.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Collection not found or access denied.",
      });
    }

    // Delete all PlacedObjects associated with this collection
    await PlacedObject.deleteMany({ collectionRef: id });
    // Delete all purchases associated with this collection
    await Purchase.deleteMany({ collectionRef: id });

    await Collection.deleteOne({ _id: id });

    // delte cover image from Cloudinary
    if (collection.coverImage && collection.coverImage.fileName) {
      await deleteFromCloudinary(collection.coverImage.fileName);
    }

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: { details: error.message },
    });
  }
};

// Add object(s) to collection
const addObjects = async (req, res) => {
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
        message: "Forbidden: Only artists can add objects to collections.",
      });
    }

    const collectionId = req.params.id;
    const { objectIds } = req.body.objects;

    // Ensure objectIds is an array
    if (!Array.isArray(objectIds)) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Please provide an array of object IDs.",
      });
    }

    // Find the collection by ID and ensure it belongs to the current user
    const collection = await Collection.findOne({
      _id: collectionId,
      createdBy: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Collection not found or access denied.",
      });
    }

    // Verify that the object IDs exist in the database
    const foundObjects = await Object.find({
      _id: { $in: objectIds },
    }).distinct("_id");
    const missingIds = objectIds.filter(
      (id) =>
        !foundObjects.map((objId) => objId.toString()).includes(id.toString())
    );
    if (missingIds.length > 0) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Some objects do not exist.",
        data: {
          missingObjectIds: missingIds,
        },
      });
    }

    // Check if the collection has reached its maxObjects limit
    if (collection.objects.length + objectIds.length > collection.maxObjects) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Maximum objects reached for this collection. Buy more slots.",
      });
    }

    // Replace the objects array
    collection.objects = objectIds;
    await collection.save();

    return res.status(200).json({
      code: 200,
      status: "success",
      data: {
        collection: collection,
      },
    });
  } catch (error) {
    console.error("Error adding objects to collection:", error);
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Error adding objects to collection.",
    });
  }
};

const togglePublish = async (req, res) => {
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
        message: "Forbidden: Only artists can toggle publish status.",
      });
    }

    const { id } = req.params;

    // Find the collection by ID and ensure it belongs to the current user
    const collection = await Collection.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Collection not found or access denied.",
      });
    }

    // Toggle the isPublished field
    collection.isPublished = !collection.isPublished;
    await collection.save();

    return res.status(200).json({
      code: 200,
      status: "success",
      data: {
        collection: collection,
      },
    });
  } catch (error) {
    console.error("Error toggling publish status:", error);
    return res.status(500).json({
      code: 500,
      status: "error",
      message: "Error toggling publish status.",
    });
  }
};

module.exports = {
  create,
  index,
  show,
  update,
  destroy,
  addObjects,
  togglePublish,
};
