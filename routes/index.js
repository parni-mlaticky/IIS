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

module.exports = router;