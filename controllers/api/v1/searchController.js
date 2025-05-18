const Collection = require("../../../models/api/v1/Collection");
const User = require("../../../models/api/v1/User");

// Search Collections (M0 tier + partial + full-text)
const searchCollections = async (req, res) => {
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

    const { query, page = 1, limit = 20 } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Query parameter 'query' is required.",
        },
      });
    }

    const parsedLimit = Math.max(parseInt(limit), 1);
    const parsedPage = Math.max(parseInt(page), 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const baseFilter = {
      isPublished: true,
      isActive: true,
    };

    // Text search
    const textResults = await Collection.find(
      {
        ...baseFilter,
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .populate("createdBy", "username")
      .select("type title price coverImage createdBy")
      .lean();

    // Regex search
    const regexResults = await Collection.find({
      ...baseFilter,
      title: { $regex: query, $options: "i" },
    })
      .populate("createdBy", "username")
      .select("type title price coverImage createdBy")
      .lean();

    // Combine and deduplicate by _id
    const combinedMap = new Map();
    [...textResults, ...regexResults].forEach((item) => {
      combinedMap.set(item._id.toString(), item);
    });

    const combinedResults = Array.from(combinedMap.values());
    const totalCount = combinedResults.length;
    const paginated = combinedResults.slice(skip, skip + parsedLimit);
    const totalPages = Math.ceil(totalCount / parsedLimit);

    if (!paginated || paginated.length === 0) {
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
        collections: paginated,
        totalCount,
        currentPage: parsedPage,
        totalPages,
        hasMore: parsedPage < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({
      status: "fail",
      data: {
        message: "Error fetching collections.",
      },
    });
  }
};

module.exports = {
  searchCollections,
};
