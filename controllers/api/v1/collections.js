const Collection = require("../../../models/api/v1/Collection");
const Genre = require("../../../models/api/v1/Genre");
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

    // Get pagination parameters from query (defaults: page=1, limit=20)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit; // Calculate how many to skip

    // Fetch total count (to calculate total pages)
    const totalCollections = await Collection.countDocuments({
      isPublished: true,
      isActive: true,
    });

    // Fetch only published and active collections
    const collections = await Collection.find({
      isPublished: true,
      isActive: true,
    })
      .select(
        "_id type title price coverImage createdBy likes views ratings location"
      )
      .populate("createdBy", "username")
      .skip(skip)
      .limit(limit)
      .lean();

    if (!collections || collections.length === 0) {
      return res.status(204).json({
        status: "success",
        message: "No collections found",
        data: {
          collections: [],
        },
      });
    }

    // Process collections to add the number of likes, views, and average rating
    const processedCollections = collections.map((collection) => ({
      ...collection,
      likes: collection.likes.length,
      views: collection.views.length,
      ratings: collection.ratings.length
        ? collection.ratings.reduce((acc, r) => acc + r.rating, 0) /
          collection.ratings.length
        : 0,
    }));

    return res.status(200).json({
      status: "success",
      data: {
        collections: processedCollections,
        currentPage: page,
        totalPages: Math.ceil(totalCollections / limit),
        hasMore: page < Math.ceil(totalCollections / limit), // Check if there are more pages
      },
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

// Get all collections by genre
const indexByGenre = async (req, res) => {
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

    const genreId = req.params.id;

    // Get pagination parameters from query (defaults: page=1, limit=20)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit; // Calculate how many to skip

    // Fetch total count (to calculate total pages)
    const totalCollections = await Collection.countDocuments({
      genres: genreId,
      isPublished: true,
      isActive: true,
    });

    // Check if the genre exists
    const genre = await Genre.findById(genreId);

    if (!genre) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "Genre not found.",
        },
      });
    }

    // Fetch only published and active collections
    const collections = await Collection.find({
      genres: genreId,
      isPublished: true,
      isActive: true,
    })
      .select("_id type title price coverImage createdBy")
      .populate("createdBy", "username")
      .skip(skip)
      .limit(limit)
      .lean();

    if (!collections || collections.length === 0) {
      return res.status(204).json({
        status: "success",
        message: "No collections found",
        data: {
          collections: [],
        },
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        genre: genre.name,
        collections: collections,
        currentPage: page,
        totalPages: Math.ceil(totalCollections / limit),
        hasMore: page < Math.ceil(totalCollections / limit), // Check if there are more pages
      },
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

// Get collection by ID if published and active
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

    const collectionId = req.params.id;

    // Fetch the collection
    const collection = await Collection.findById(collectionId)
      .select(
        "_id type title description city price coverImage createdBy objects likes views ratings genres location isPublished isActive"
      )
      .populate("createdBy", "username")
      .populate("genres", "name");

    if (!collection || !collection.isPublished || !collection.isActive) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "Collection not found.",
        },
      });
    }

    // Process the collection to add the number of likes, views, average rating and number of objects
    const processedCollection = collection.toObject();
    processedCollection.objects = collection.objects.length;
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

    return res.status(200).json({
      status: "success",
      data: { collection: processedCollection },
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

module.exports = {
  index,
  indexByCreator,
  indexByGenre,
  show,
};
