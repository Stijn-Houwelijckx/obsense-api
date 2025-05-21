const Purchase = require("../../../models/api/v1/Purchase");
const Collection = require("../../../models/api/v1/Collection");
const User = require("../../../models/api/v1/User");

// Controller to create a new purchase record
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

    const userId = req.user._id;
    const { collectionId } = req.params;

    // Check if the collection ID is provided
    if (!collectionId) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Collection ID is required",
      });
    }

    // Fetch user and collection details
    const user = await User.findById(userId);
    const collection = await Collection.findById(collectionId);

    if (!user) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "User not found",
      });
    }

    if (!collection) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Collection not found",
      });
    }

    // Check if the user already owns the collection
    const existingPurchase = await Purchase.findOne({
      user: userId,
      collectionRef: collectionId,
      isActive: true,
    });

    if (existingPurchase) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "You already own this collection",
      });
    }

    // Check if the user has enough tokens to purchase the collection
    if (user.tokens < collection.price) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Insufficient tokens",
      });
    }

    // Deduct the collection price from the user's tokens
    user.tokens -= collection.price;
    await user.save();

    // Create a new purchase record
    const newPurchase = new Purchase({
      user: userId,
      collectionRef: collectionId,
      price: collection.price,
      paymentStatus: "completed",
      isActive: true,
    });

    // Save the new collection to the database
    const savedPurchase = await newPurchase.save();

    res.status(201).json({
      code: 201,
      status: "success",
      data: {
        purchase: savedPurchase,
        tokensLeft: user.tokens,
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

// Get purchases for the logged in user
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

    const userId = req.user._id;

    // Fetch all purchases for the user
    const purchases = await Purchase.find({ user: userId })
      .populate({
        path: "collectionRef",
        select: "_id type title coverImage createdBy location",
        populate: { path: "createdBy", select: "username" },
      })
      .sort({ purchasedAt: -1 });

    if (!purchases || purchases.length === 0) {
      return res.status(204).json({
        code: 204,
        status: "success",
        message: "No purchases found",
        data: {
          purchases: [],
        },
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        purchases: purchases,
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

module.exports = {
  create,
  index,
};
