const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GenreSchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // Name of the genre
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const Genre = mongoose.model("Genre", GenreSchema);

module.exports = Genre;
