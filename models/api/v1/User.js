const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    isArtist: { type: Boolean, default: false },
    profilePicture: {
      fileName: { type: String, default: "Default" },
      filePath: { type: String },
      fileType: { type: String, default: ".jpg" },
      fileSize: { type: Number, default: 8273 },
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

UserSchema.plugin(passportLocalMongoose, { usernameField: "email" });

const User = mongoose.model("User", UserSchema);

module.exports = User;
