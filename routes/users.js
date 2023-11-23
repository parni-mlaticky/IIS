const express = require("express");
const router = express.Router();
const { authenticate, isAuthorized } = require("../middlewares/auth");
const userModel = require("../models/User");

module.exports = router;

router.get("/", async (req, res) => {
  const visibility_level = req.isLogged ? 1 : 2;
  try {
    const users = await userModel.getAllWithVisibilityLevel(visibility_level);
    res.render("users", { users, title: "Users" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving users from database");
  }
});
