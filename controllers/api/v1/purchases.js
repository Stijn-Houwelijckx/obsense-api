const Purchase = require("../../../models/api/v1/Purchase");
const Collection = require("../../../models/api/v1/Collection");
const User = require("../../../models/api/v1/User");

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

    const userId = req.user._id;
    const { collectionId } = req.body.purchase;

    // Check if the collection ID is provided
    if (!collectionId) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Collection ID is required",
        },
      });
    }

    // Fetch user and collection details
    const user = await User.findById(userId);
    const collection = await Collection.findById(collectionId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "User not found",
        },
      });
    }

    if (!collection) {
      return res.status(404).json({
        status: "fail",
        data: {
          message: "Collection not found",
        },
      });
    }

    // Check if the user already owns the collection
    const existingPurchase = await Purchase.findOne({
      user: userId,
      collection: collectionId,
      isActive: true,
    });

    if (existingPurchase) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "You already own this collection",
        },
      });
    }

    // Check if the user has enough tokens to purchase the collection
    if (user.tokens < collection.price) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Insufficient tokens",
        },
      });
    }

    // Deduct the collection price from the user's tokens
    user.tokens -= collection.price;
    await user.save();

    // Create a new purchase record
    const newPurchase = new Purchase({
      user: userId,
      collection: collectionId,
      price: collection.price,
      paymentStatus: "completed",
      isActive: true,
    });

    // Save the new collection to the database
    const savedPurchase = await newPurchase.save();

    res.status(201).json({
      status: "success",
      data: {
        purchase: savedPurchase,
        tokensLeft: user.tokens,
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
};
