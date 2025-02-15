const Genre = require("../../../models/api/v1/Genre");

const create = async (req, res) => {
  res
    .status(200)
    .json({ message: "Create genre function not implemented yet." });
};

// Get collections of the currently logged-in artist
const index = async (req, res) => {
  res.status(200).json({ message: "Get genres function not implemented yet." });
};

module.exports = {
  create,
  index,
};
