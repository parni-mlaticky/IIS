const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("jsonwebtoken");
const userModel = require("../models/User");
const multer = require("multer");
const path = require("path");
const constants = require("../constants");

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
      const message = "username or password missing";
      return res.status(400).render("error", {
        message: message,
        status: 400,
        title: `${400} ${message}`,
      });
    }
    if (req.cookies.token) {
      const message = "User already logged in";
      return res.status(400).render("error", {
        message: message,
        status: 400,
        title: `${400} ${message}`,
      });
    }
    const { username, password } = req.body;
    const user = await userModel.getByUsername(username);

    if (user && (await bcrypt.compare(password, user.pwd_hash))) {
      const payload = {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });
      res.status(200).redirect("/");
    } else {
      const message = "Invalid username or password";
      res.status(401).render("error", {
        message: message,
        status: 401,
        title: `${401} ${message}`,
      });
    }
  } catch (err) {
    console.log(err);
    const message = "Error logging in";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.post("/register", upload.single("avatar"), async (req, res) => {
  try {
    const { username, password } = req.body;
    const visibility = 0;
    const hashedPassword = await bcrypt.hash(password, 10);
    const picture_path =
      req.file?.path || constants.DEFAULT_PROFILE_AVATAR_PATH;

    if (!username || !password) {
      const message = "Username or password missing";
      return res.status(400).render("error", {
        message: message,
        status: 400,
        title: `${400} ${message}`,
      });
    }
    9;
    if (req.cookies.token) {
      const message = "User already logged in";
      return res.status(400).render("error", {
        message: message,
        status: 400,
        title: `${400} ${message}`,
      });
    }

    if (await userModel.getByUsername(username)) {
      const message = "Username already exists";
      return res.status(409).render("error", {
        message: message,
        status: 409,
        title: `${409} ${message},`,
      });
    }

    const newUser = new userModel(
      null,
      username,
      picture_path,
      hashedPassword,
      visibility,
      false,
    );

    await newUser.save();
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });
    res.status(201).redirect("/");
  } catch (err) {
    console.log(err);
    const message = "Error registering user";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "User logged out successfully" });
});
