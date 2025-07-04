const Genre = require("../../../models/api/v1/Genre");

const create = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    // Collecting user input for the genre creation
    const { name } = req.body.genre;

    if (!name) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Name is required.",
      });
    }

    // Validation for name
    if (name.length < 1 || name.length > 35) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Name must be between 1 and 35 characters.",
      });
    }

    // Only allow letters, spaces and hyphens
    const regex = /^[a-zA-Z0-9\s-]+$/;
    if (!regex.test(name)) {
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Name can only contain letters, spaces and hyphens.",
      });
    }

    // Check if the genre already exists
    const existingGenre = await Genre.find({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existingGenre.length > 0) {
      // Check if the array has any elements
      return res.status(400).json({
        code: 400,
        status: "fail",
        message: "Genre already exists.",
      });
    }

    // Capitalize each word, handle spaces and hyphens
    const capitalize = (str) => {
      return str
        .split(" ") // Split by spaces only
        .map(
          (word) =>
            word
              .split("-") // Split by hyphen
              .map(
                (part) =>
                  part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
              ) // Capitalize each part of the hyphenated word
              .join("-") // Rejoin the parts with a hyphen
        )
        .join(" "); // Rejoin the words with spaces
    };

    const capitalizedGenreName = capitalize(name);

    // Create a new genre
    const newGenre = await Genre.create({ name: capitalizedGenreName });

    res.status(201).json({
      code: 201,
      status: "success",
      data: {
        genre: newGenre,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: {
        details: err.message,
      },
    });
  }
};

// Get all genres
const index = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    // Fetch all genres
    const genres = await Genre.find().lean();

    if (!genres || genres.length === 0) {
      return res.status(204).json({
        code: 204,
        status: "success",
        message: "No genres found.",
        data: {
          genres: [],
        },
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        genres: genres,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: {
        details: err.message,
      },
    });
  }
};

const show = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        status: "fail",
        message: "Unauthorized",
      });
    }

    const genreId = req.params.id;

    // Fetch the genre
    const genre = await Genre.findById(genreId).lean();

    if (!genre) {
      return res.status(404).json({
        code: 404,
        status: "fail",
        message: "Genre not found.",
      });
    }

    res.status(200).json({
      code: 200,
      status: "success",
      data: {
        genre: genre,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Server error",
      data: {
        details: err.message,
      },
    });
  }
};

module.exports = {
  create,
  index,
  show,
};
