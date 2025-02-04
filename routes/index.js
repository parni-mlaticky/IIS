const express = require("express");
const authRoute = require("./auth");
const profileRoute = require("./profile");
const groupsRoute = require("./groups");
const threadsRoute = require("./threads");
const usersRoute = require("./users");
const notificationRoute = require("./notifications");
const { checkLogin } = require("../middlewares/auth");
const router = express.Router();

router.use("/auth", authRoute);
router.use("/profile", profileRoute);
router.use("/groups", groupsRoute);
router.use("/threads", threadsRoute);
router.use("/users", usersRoute);
router.use("/notifications", notificationRoute);

router.get("/", (req, res) => {
  res.render("index", { message: "Hello, EJS!", title: "Home" });
});

router.get("/login", (req, res) => {
  res.render("login", { title: "Login", message: "Hello, EJS!"});
});

router.get("/register", checkLogin, (req, res) => {
  if(req.isLogged){
    res.redirect("/profile?error_message=You are already logged in");
  }
  res.render("register", { title: "Register", error: false });
});

router.get("/logout", (req, res) => {
  res.redirect("/auth/logout");
});

router.use((req, res, next) => {
  res.status(404).render("404", { url: req.originalUrl, title: "404" });
});

module.exports = router;
