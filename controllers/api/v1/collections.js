const Collection = require("../../../models/api/v1/Collection");
const User = require("../../../models/api/v1/User");

// Get all collections
const index = async (req, res) => {
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

    // Fetch only published and active collections
    const collections = await Collection.find({
      isPublished: true,
      isActive: true,
    })
      .select(
        "_id type title price coverImage createdBy likes views ratings location"
      )
      .populate("createdBy", "username");

    if (!collections || collections.length === 0) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "No collections found.",
        },
      });
    }

    // Process collections to add the number of likes, views, and average rating
    const processedCollections = collections.map((collection) => {
      const processedCollection = collection.toObject();
      processedCollection.likes = collection.likes.length;
      processedCollection.views = collection.views.length;
      // Calculate the average rating
      if (collection.ratings.length > 0) {
        const totalRating = collection.ratings.reduce((acc, rating) => {
          return acc + rating.rating;
        }, 0);
        processedCollection.ratings = totalRating / collection.ratings.length;
      } else {
        processedCollection.ratings = 0;
      }
      return processedCollection;
    });

    return res.status(200).json({
      status: "success",
      data: { collections: processedCollections },
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return res.status(500).json({
      status: "fail",
      data: {
        message: "Error fetching collections.",
      },
    });
  }
};

// Get all collections by a specific artist
const indexByCreator = async (req, res) => {
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

    const creatorId = req.params.id;

    // Fetch only published and active collections
    const collections = await Collection.find({
      createdBy: creatorId,
      isPublished: true,
      isActive: true,
    })
      .select(
        "_id type title price coverImage createdBy likes views ratings location"
      )
      .populate("createdBy", "username");

    if (!collections || collections.length === 0) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "No collections found.",
        },
      });
    }

    // Process collections to add the number of likes, views, and average rating
    const processedCollections = collections.map((collection) => {
      const processedCollection = collection.toObject();
      processedCollection.likes = collection.likes.length;
      processedCollection.views = collection.views.length;
      // Calculate the average rating
      if (collection.ratings.length > 0) {
        const totalRating = collection.ratings.reduce((acc, rating) => {
          return acc + rating.rating;
        }, 0);
        processedCollection.ratings = totalRating / collection.ratings.length;
      } else {
        processedCollection.ratings = 0;
      }
      return processedCollection;
    });

    return res.status(200).json({
      status: "success",
      data: { collections: processedCollections },
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return res.status(500).json({
      status: "fail",
      data: {
        message: "Error fetching collections.",
      },
    });
  }
};

module.exports = {
  index,
  indexByCreator,
};
