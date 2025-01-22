const mongoose = require("mongoose");
const User = mongoose.model("User", { 
    firstname: String,
    lastname: String,
    username: String,
    email: String,
    password: String,
});

module.exports = User;