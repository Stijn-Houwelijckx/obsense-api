const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  artistname: { type: String, required: false, sparse: true, unique: true },
  email: { type: String, required: true, unique: true },
  isArtist: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

UserSchema.plugin(passportLocalMongoose, { usernameField: "email" });

const User = mongoose.model("User", UserSchema);

module.exports = User;
