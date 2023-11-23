const express = require("express");
const constants = require("../constants");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const profileModel = require("../models/User");
const bcrypt = require("bcrypt");
const { authenticate, isAuthorized, checkLogin } = require("../middlewares/auth");
module.exports = router;

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

router.get("/", authenticate, async (req, res) => {
  try {
    const profileId = req.userData.id;
    if (!profileId) {
      return res
        .status(404)
        .render("404", { message: "Profile not found", url: req.url });
    }
    res.redirect(`/profile/${profileId}`);
  } catch (err) {
    console.log(err);
    res.status(500).render("error", {
      message: "Error retrieving profile from database",
      status: 500,
    });
  }
});


router.get("/:id", checkLogin, async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res
        .status(404)
        .render("404", { message: "Profile not found", url: req.url });
    }
    if(profile.visibility === constants.Visibility.PRIVATE && req.userData.id !== profile.id) {
      return res.status(403).render("profile/private_profile", {
        message: "Profile is private",
        status: 403,
      });
    }

    res.render("profile", { user: profile });
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

const visibility_to_id = (visibility) => {
  switch (visibility) {
    case "public":
      return constants.Visibility.PUBLIC;
    case "registered":
      return constants.Visibility.REGISTERED;
    case "private":
      return constants.Visibility.PRIVATE;
    default:
      throw new Error("Invalid visibility");
  }
};

router.put("/:id", authenticate, isAuthorized("user"), upload.single("picture"), async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res
        .status(404)
        .render("404", { message: "Profile not found", url: req.url });
    }
    const form_old_password = req.body.old_password;
    const old_password_hash = profile.pwd_hash;
    let passwords_match = false;
    if(form_old_password){
      passwords_match = await bcrypt.compare(form_old_password, old_password_hash);
    }
    if(form_old_password && !passwords_match) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }
    const new_password_hash = passwords_match ? await bcrypt.hash(req.body.new_password, 10) : profile.pwd_hash;
    new_username = req.body.username || profile.username;
    new_picture_path = req.file?.path || profile.path_to_avatar;
    new_visibility = req.body.visibility || profile.visibility;
    const profileObj = new profileModel(req.params.id, new_username, new_picture_path, new_password_hash,
      visibility_to_id(new_visibility), profile.is_admin);
    await profileObj.save();
    console.log(profileObj);
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
