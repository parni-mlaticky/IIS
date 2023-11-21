const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("jsonwebtoken");
const userModel = require("../models/User");

module.exports = router;

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await userModel.getByUsername(username);

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(200).json({ message: "User logged in successfully", token });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error logging in");
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, picture_path, password, role, visibility } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel(
      null,
      username,
      picture_path,
      hashedPassword,
      role,
      visibility,
    );
    await newUser.save();
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({ message: "User registered successfully", token });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/logout", (req, res) => {
  res.json({ message: "User logged out successfully" });
});
