const express = require("express");
const router = express.Router();
const profileModel = require("../models/User");
const { authenticate, isAuthorized } = require("../middlewares/auth");
module.exports = router;

router.get("/", authenticate, async (req, res) => {
  try {
    const profileId = req.userData.userId;
    if (!profileId) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.redirect(`/profile/${profileId}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving profile from database");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.render("profile", { user: profile });
    console.log(profile);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving profile from database");
  }
});

router.get(
  "/:id/edit",
  authenticate,
  isAuthorized("user"),
  async (req, res) => {
    try {
      const profile = await profileModel.getById(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.render("profile/edit", { user: profile });
    } catch (err) {
      console.log(err);
      res.status(500).send("Error retrieving profile from database");
    }
  },
);

router.put("/:id", authenticate, isAuthorized("user"), async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
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

router.delete("/:id", authenticate, isAuthorized("user"), async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    await profile.delete();
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting profile");
  }
});
