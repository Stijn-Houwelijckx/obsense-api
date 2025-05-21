const User = require("../../../models/api/v1/User");

// Update the user profile
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

    const { tokenAmount } = req.body.tokens;
    const user = req.user; // Get the user from the request

    // Validate input data
    if (!tokenAmount) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Token amount is required",
      });
    }

    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Token amount must be a positive number",
      });
    }

    // Update the user's tokens in the database
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { tokens: tokenAmount } }, // Increment the user's tokens by the specified amount
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "User not found",
      });
    }

    // Send the updated tokens back in the response
    return res.status(200).json({
      code: 200,
      status: "success",
      message: "User tokens updated successfully",
      data: {
        tokens: updatedUser.tokens,
      },
    });
  } catch (err) {
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
  update,
};
