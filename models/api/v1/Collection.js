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
    objects: [{ type: Schema.Types.ObjectId, ref: "Object", default: [] }], // 3D objects in the collection
    maxObjects: { type: Number, default: 10 },
    timesBought: { type: Number, default: 0 },
    likes: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    views: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    ratings: {
      type: [
        {
          user: { type: Schema.Types.ObjectId, ref: "User" },
          rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
          },
        },
      ],
      default: [], // Default to an empty array
    },
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

// Index
CollectionSchema.index({ title: "text" });

const Collection = mongoose.model("Collection", CollectionSchema);

module.exports = Collection;
