const PlacedObject = require("../../../models/api/v1/PlacedObject");

const create = async (req, res) => {
  res
    .status(200)
    .json({ message: "Create placed object function not implemented yet." });
};

// Get collections of the currently logged-in artist
const index = async (req, res) => {
  res
    .status(200)
    .json({ message: "Get placed objects function not implemented yet." });
};

module.exports = {
  create,
  index,
};
