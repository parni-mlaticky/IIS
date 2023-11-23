const express = require("express");
const router = express.Router();
const { authenticate, isAuthorized } = require("../middlewares/auth");
const userModel = require("../models/User");

module.exports = router;

router.get("/", authenticate, async (req, res) => {
  try {
    const users = await userModel.getAllWithVisibilityLevel(1);
    res.render("users", { users });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving users from database");
  }
});
