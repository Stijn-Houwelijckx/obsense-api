const Object = require("../../../models/api/v1/Object");

const create = async (req, res) => {
  res
    .status(200)
    .json({ message: "Create object function not implemented yet." });
};

// Get collections of the currently logged-in artist
const index = async (req, res) => {
  res
    .status(200)
    .json({ message: "Get objects function not implemented yet." });
};

module.exports = {
  create,
  index,
};
