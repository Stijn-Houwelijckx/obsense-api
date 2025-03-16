var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
require("dotenv").config();

// connecting to the database
const mongoose = require("mongoose");
const connection = process.env.DATABASE_CONN;
console.log(`Connecting to ${connection}`);
mongoose.connect(connection);

// importing the routes
const userRoute = require("./routes/api/v1/users");
const artistRoute = require("./routes/api/v1/artists");
const artistCollectionRoute = require("./routes/api/v1/artistCollections");
const objectRoute = require("./routes/api/v1/objects");
const placedObjectRoute = require("./routes/api/v1/placedObjects");
const genreRoute = require("./routes/api/v1/genres");
const purchaseRoute = require("./routes/api/v1/purchases");
const collectionRoute = require("./routes/api/v1/collections");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// using the routes
app.use("/api/v1/users", userRoute);
app.use("/api/v1/artists", artistRoute);
app.use("/api/v1/artist/collections", artistCollectionRoute);
app.use("/api/v1/objects", objectRoute);
app.use("/api/v1/placedObjects", placedObjectRoute);
app.use("/api/v1/genres", genreRoute);
app.use("/api/v1/purchases", purchaseRoute);
app.use("/api/v1/collections", collectionRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
