require("dotenv").config();
const User = require("../../../models/api/v1/User");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// function to create new user
const create = async (req, res) => {
    const { firstname, lastname, username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            firstname,
            lastname,
            username,
            email,
            password: hashedPassword,
        });

        await user.save()

        res.json({
            status: "success",
            data: {
                user,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
}

module.exports = {
    create,
};