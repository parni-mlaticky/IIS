const express = require("express");
const authRoute = require("./auth");
const profileRoute = require("./profile");
const groupsRoute = require("./groups");
const threadsRoute = require("./threads");
const usersRoute = require("./users");

const router = express.Router();

router.use("/auth", authRoute);
router.use("/profile", profileRoute);
router.use("/groups", groupsRoute);
router.use("/threads", threadsRoute);
router.use("/users", usersRoute);

router.get("/", (req, res) => {
  res.render("index", { title: "EJS Example", message: "Hello, EJS!" });
});

router.get("/login", (req, res) => {
  res.render("login", { title: "EJS Example", message: "Hello, EJS!" });
});

router.get("/register", (req, res) => {
  res.render("register", { title: "EJS Example", message: "Hello, EJS!" });
});

router.get("/logout", (req, res) => {
  res.redirect("/auth/logout");
});


router.use((req, res, next) => {
  res.status(404).render("404", { url: req.originalUrl });
});

module.exports = router;
