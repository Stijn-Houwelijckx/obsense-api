const User = require("../../../models/api/v1/User");
const Collection = require("../../../models/api/v1/Collection");

// Get all artists
const index = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    // Get pagination parameters from query (defaults: page=1, limit=20)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit; // Calculate how many to skip

    // Fetch total count (to calculate total pages)
    const totalArtists = await User.countDocuments({
      isArtist: true,
    });

    // Find all users who are artists and select only necessary fields
    const artists = await User.find({ isArtist: true })
      .select("username profilePicture")
      .skip(skip)
      .limit(limit)
      .lean();

    if (!artists || artists.length === 0) {
      return res.status(204).json({
        code: 204,
        status: "success",
        message: "No artists found",
        data: {
          artists: [],
        },
      });
    }

    // Fetch the number of collections for each artist
    const artistsWithCollectionCount = await Promise.all(
      artists.map(async (artist) => {
        const collectionCount = await Collection.countDocuments({
          createdBy: artist._id,
        });

        return {
          ...artist,
          collectionCount,
        };
      })
    );

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        artists: artistsWithCollectionCount,
        currentPage: page,
        totalPages: Math.ceil(totalArtists / limit),
        hasMore: page < Math.ceil(totalArtists / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching artists:", error);
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Error fetching artists.",
    });
  }
};

// Show artist
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

    // Find the artist by ID
    const artist = await User.findById(req.params.id).lean();

    if (!artist) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Artist not found",
      });
    }

    // Fetch all collections by the artist
    const collections = await Collection.find({
      createdBy: artist._id,
      isPublished: true,
      isActive: true,
    })
      .select("title coverImage type likes views ratings")
      .lean();

    if (collections && collections.length !== 0) {
      const processedCollections = collections.map((collection) => ({
        ...collection,
        likes: collection.likes.length,
        views: collection.views.length,
        ratings: collection.ratings.length
          ? collection.ratings.reduce((acc, r) => acc + r.rating, 0) /
            collection.ratings.length
          : 0,
      }));

      artist.collections = processedCollections;
    } else {
      artist.collections = [];
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        artist: artist,
      },
    });
  } catch (error) {
    console.error("Error fetching artist:", error);
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Error fetching artist.",
    });
  }
};

module.exports = {
  index,
  show,
};
