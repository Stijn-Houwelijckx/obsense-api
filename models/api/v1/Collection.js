const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CollectionSchema = new Schema(
  {
    type: { type: String, enum: ["tour", "exposition"], required: true },
    title: { type: String, required: true },
    description: { type: String, default: "No description" },
    city: { type: String, required: true },
    price: { type: Number, required: true },
    coverImage: {
      fileName: { type: String, required: true },
      filePath: { type: String, required: true },
      fileType: { type: String, required: true },
      fileSize: { type: Number, required: true },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    objects: [
      { type: Schema.Types.ObjectId, ref: "CollectionObject", default: [] },
    ], // 3D objects in the collection
    placedObjects: [
      { type: Schema.Types.ObjectId, ref: "PlacedObject", default: [] },
    ], // Placed 3D objects
    maxObjects: { type: Number, default: 10 },
    timesBought: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    genres: [{ type: Schema.Types.ObjectId, ref: "Genre", default: [] }],
    location: {
      lat: { type: Number, default: null },
      lon: { type: Number, default: null },
    },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Collection = mongoose.model("Collection", CollectionSchema);

module.exports = Collection;
