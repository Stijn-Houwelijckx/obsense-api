const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PlacedObjectSchema = new Schema(
  {
    // "collectionRef" because "collection" is a reserved keyword in MongoDB
    collectionRef: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
    },
    object: { type: Schema.Types.ObjectId, ref: "Object", required: true },
    position: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true },
    },
    scale: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true },
    },
    rotation: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true },
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const PlacedObject = mongoose.model("PlacedObject", PlacedObjectSchema);

module.exports = PlacedObject;
