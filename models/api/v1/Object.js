const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ObjectSchema = new Schema(
  {
    file: {
      fileName: { type: String, required: true },
      filePath: { type: String, required: true },
      fileType: { type: String, required: true },
      fileSize: { type: Number, required: true },
    },
    title: { type: String, required: true },
    description: { type: String, default: "No description provided" },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const Object = mongoose.model("Object", ObjectSchema);

module.exports = Object;
