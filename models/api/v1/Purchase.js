const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PurchaseSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collectionRef: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
    },
    price: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    purchasedAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }, // 30 days from now
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const Purchase = mongoose.model("Purchase", PurchaseSchema);

module.exports = Purchase;
