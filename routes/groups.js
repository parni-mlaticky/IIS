const express = require("express");
const router = express.Router();
const groupModel = require("../models/Group");
const { authenticate, isAuthorized } = require("../middlewares/auth");

module.exports = router;

router.get("/", async (req, res) => {
  try {
    const groups = await groupModel.getAll();
    res.render("groups", { groups });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving groups from database");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    res.render("groups/detail", { group });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving group from database");
  }
});

router.get("/:userid", async (req, res) => {
  try {
    const groups = await groupModel.getByUserId(req.params.userid);
    res.render("groups", { groups });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving groups from database");
  }
});

router.get("/:name", async (req, res) => {
  try {
    const groups = await groupModel.getByName(req.params.name);
    res.render("groups", { groups });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving groups from database");
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    if (await groupModel.getByName(req.body.name)) {
      return res.status(409).json({ message: "Group already exists" });
    }
    const newGroup = new groupModel(
      null,
      req.body.name,
      req.body.description,
      req.body.picture_path,
      req.body.visibility,
    );
    const newGroupID = await newGroup.save();
    res.redirect(`/groups/${newGroupID}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating group");
  }
});

router.put("/:id", authenticate, isAuthorized("group"), async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    group.name = req.body.name;
    group.description = req.body.description;
    group.picture_path = req.body.picture_path;
    group.visibility = req.body.visibility;
    await group.update();
    res.redirect(`/groups/${req.params.id}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating group");
  }
});

router.delete("/:id", authenticate, isAuthorized("group"), async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    await group.delete();
    res.redirect("/groups");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting group");
  }
});
