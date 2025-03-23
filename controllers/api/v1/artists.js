const User = require("../../../models/api/v1/User");
const Collection = require("../../../models/api/v1/Collection");

// Get all artists
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
      status: "fail",
      data: {
        message: "Error fetching artists.",
      },
    });
  }
};

module.exports = {
  index,
};
