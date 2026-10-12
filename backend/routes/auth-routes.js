const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("prisma");

const router = express.Router();

router.post('/register', (req, res) => {
    


    res.status(200).json(
        {
            status: true,
            message: 'User registered successfully'
        }
    )
});

module.exports = router;