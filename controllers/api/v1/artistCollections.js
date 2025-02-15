const Collection = require("../../../models/api/v1/Collection");
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
    let { type } = req.body;
    type = type.toLowerCase(); // Convert to lowercase for consistency
    const { title, description, city, price, genres } = req.body;

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
      data: collections,
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

module.exports = {
  create,
  index,
};
