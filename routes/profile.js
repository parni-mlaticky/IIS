const express = require("express");
const router = express.Router();
const profileModel = require("../models/User");
const { authenticate, isAuthorized } = require("../middlewares/auth");
module.exports = router;

router.get("/", authenticate, async (req, res) => {
  try {
    const profileId = req.userData.userId;
    if (!profileId) {
      return res
        .status(404)
        .render("404", { message: "Profile not found", url: req.url });
    }
    res.redirect(`/profile/${profileId}`);
  } catch (err) {
    console.log(err);
    res.status(500).error("error", {
      message: "Error retrieving profile from database",
      status: 500,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res
        .status(404)
        .render("404", { message: "Profile not found", url: req.url });
    }
    res.render("profile", { user: profile });
    console.log(profile);
  } catch (err) {
    console.log(err);
    res.status(500).render("error", {
      message: "Error retrieving profile from database",
      status: 500,
    });
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
        return res
          .status(404)
          .render("404", { message: "Profile not found", url: req.url });
      }
      res.render("profile/edit", { user: profile });
    } catch (err) {
      console.log(err);
      res.status(500).render("error", {
        message: "Error retrieving profile from database",
        status: 500,
      });
    }
  },
);

router.put("/:id", authenticate, isAuthorized("user"), async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res
        .status(404)
        .render("404", { message: "Profile not found", url: req.url });
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
    res
      .status(500)
      .render("error", { message: "Error updating profile", status: 500 });
  }
});

router.delete("/:id", authenticate, isAuthorized("user"), async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res
        .status(404)
        .render("404", { message: "Profile not found", url: req.url });
    }
    await profile.delete();
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .render("error", { message: "Error deleting profile", status: 500 });
  }
});
