const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("jsonwebtoken");
const userModel = require("../models/User");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname + "-" + Date.now() + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });

module.exports = router;

router.post("/login", async (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Username or password missing" });
    }
    if (req.cookies.token) {
      return res.status(400).json({ message: "User already logged in" });
    }
    const { username, password } = req.body;
    const user = await userModel.getByUsername(username);

    if (user && (await bcrypt.compare(password, user.pwd_hash))) {
      const payload = {
        userId: user.id,
        username: user.username,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });
      res.status(200).json({ message: "User logged in successfully", token });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error logging in");
  }
});

router.post("/register", upload.single("avatar"), async (req, res) => {
  try {
    const { username, password } = req.body;
    const visibility = 0;
    const hashedPassword = await bcrypt.hash(password, 10);
    const picture_path = req.file.path;

    if (!username || !password) {
      return res.status(400).json({ message: "Username or password missing" });
    }

    if (req.cookies.token) {
      return res.status(400).json({ message: "User already logged in" });
    }

    if (await userModel.getByUsername(username)) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const newUser = new userModel(
      null,
      username,
      picture_path,
      hashedPassword,
      visibility,
    );
    await newUser.save();
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });
    res.status(201).json({ message: "User registered successfully", token });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "User logged out successfully" });
});
