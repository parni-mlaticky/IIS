const express = require("express");
const router = express.Router();
const profileModel = require("../models/User");
const { authenticate, isAuthorized } = require("../middlewares/auth");
module.exports = router;

router.get("/:id", async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    res.render("profile", { profile });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving profile from database");
  }
});

router.put("/:id", authenticate, isAuthorized, async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    profile.username = req.body.username;
    profile.picture_path = req.body.picture_path;
    profile.password = req.body.password;
    profile.role = req.body.role;
    profile.visibility = req.body.visibility;
    await profile.save();
    res.redirect(`/profile/${req.params.id}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating profile");
  }
});

router.delete("/:id", authenticate, isAuthorized, async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    await profile.delete();
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting profile");
  }
});
