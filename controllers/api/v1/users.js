const User = require("../../../models/api/v1/User");

// Get all users
const index = async (req, res) => {
  try {
    const users = await User.find({});
    if (users.length === 0) {
      res.status(204).json({
        status: "success",
        message: "No users found",
        data: {
          users: [],
        },
      });
    } else {
      res.status(200).json({
        status: "success",
        data: {
          users: users,
        },
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Unable to fetch users",
      error: err.message,
    });
  }
};

module.exports = {
  index,
};
