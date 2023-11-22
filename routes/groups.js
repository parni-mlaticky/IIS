const express = require("express");
const router = express.Router();
const groupModel = require("../models/Group");
const {
  authenticate,
  isAuthorized,
  checkLogin,
} = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/group_avatars/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname + "-" + Date.now() + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });
module.exports = router;

router.get("/", checkLogin, async (req, res) => {
  try {
    const groups = await groupModel.getAll();
    res.render("groups", { groups, user: req.userData });
  } catch (err) {
    console.log(err);
    res.status(500).render("error", {
      message: "Error retrieving groups from database",
      status: 500,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    console.log(group);

    if (group.length == 0) {
      res
        .status(404)
        .render("404", { message: "Group not found", url: req.url });
      return;
    }

    res.render("groups/detail", { group, userDataCookie: req.userData });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .render("error", { message: "Error retrieving group from database" });
  }
});

router.get("/:userid", async (req, res) => {
  try {
    const groups = await groupModel.getByUserId(req.params.userid);
    if (!groups) {
      return res
        .status(404)
        .render("404", { message: "Groups not found", url: req.url });
    }
    res.render("groups", { groups });
  } catch (err) {
    console.log(err);
    res.status(500).render("error", {
      message: "Error retrieving groups from database",
      status: 500,
    });
  }
});

router.get("/:name", async (req, res) => {
  try {
    const groups = await groupModel.getByName(req.params.name);
    if (!groups) {
      return res
        .status(404)
        .render("404", { message: "Groups not found", url: req.url });
    }
    res.render("groups", { groups });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .render("error", {
        message: "Error retrieving groups from database",
        status: 500,
      });
  }
});

router.post("/", authenticate, upload.single("avatar"), async (req, res) => {
  try {
    const existing = await groupModel.getByName(req.body.name);
    console.log(existing);
    if (existing.length != 0) {
      return res
        .status(409)
        .render({ message: "Group already exists", status: 409 });
    }

    if (
      !req.body.name ||
      !req.body.description ||
      !req.body.visibility ||
      !req.file.path
    ) {
      return res
        .status(500)
        .render("error", {
          message: "All form fileds must be filled",
          status: 500,
        });
    }

    const newGroup = new groupModel(
      req.body.name,
      req.body.description,
      req.file.path,
      req.body.visibility,
    );

    const newGroupID = await newGroup.save();
    res.redirect(`/groups/${newGroupID}`);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .render("error", { message: "Error creating group", status: 500 });
  }
});

router.put("/:id", authenticate, isAuthorized("group"), async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    if (!group) {
      return res
        .status(404)
        .render("404", { message: "Group not found", url: req.url });
    }
    group.name = req.body.name;
    group.description = req.body.description;
    group.picture_path = req.body.picture_path;
    group.visibility = req.body.visibility;
    await group.update();
    res.redirect(`/groups/${req.params.id}`);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .render("error", { message: "Error updating group", status: 500 });
  }
});

router.delete("/:id", authenticate, isAuthorized("group"), async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    if (!group) {
      return res
        .status(404)
        .render("404", { message: "Group not found", url: req.url });
    }
    await group.delete();
    res.redirect("/groups");
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .render("error", { message: "Error deleting group", status: 500 });
  }
});
