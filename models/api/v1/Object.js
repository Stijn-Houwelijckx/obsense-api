const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ObjectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "No description provided" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    file: {
      fileName: { type: String, required: true },
      filePath: { type: String, required: true },
      fileType: { type: String, required: true },
      fileSize: { type: Number, required: true },
    },
    thumbnail: {
      fileName: { type: String, required: false, default: null },
      filePath: { type: String, required: false, default: null },
      fileType: { type: String, required: false, default: null },
      fileSize: { type: Number, required: false, default: null },
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const Object = mongoose.model("Object", ObjectSchema);

module.exports = Object;
