const express = require("express");
const authRoute = require("./auth");
const profileRoute = require("./profile");
const groupsRoute = require("./groups");
const threadsRoute = require("./threads");

const router = express.Router();

router.use("/auth", authRoute);
router.use("/profile", profileRoute);
router.use("/groups", groupsRoute);
router.use("/threads", threadsRoute);

router.get('/', (req, res) => {
  res.render('index', { title: 'EJS Example', message: 'Hello, EJS!' });
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'EJS Example', message: 'Hello, EJS!' });
});

router.get('/register', (req, res) => {
  res.render('register', { title: 'EJS Example', message: 'Hello, EJS!' });
});

module.exports = router;
