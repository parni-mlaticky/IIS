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
    res.render("groups", { groups, user: req.userData, title: "Groups" });
  } catch (err) {
    console.log(err);
    const message = "Error retrieving groups from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    console.log(group);

    if (group.length == 0) {
      res.status(404).render("404", {
        message: "Group not found",
        url: req.url,
        title: "404",
      });
      return;
    }

    res.render("groups/detail", {
      group,
      userDataCookie: req.userData,
      title: group[0].name,
    });
  } catch (err) {
    console.log(err);
    const message = "Error retrieving group from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.get("/:userid", async (req, res) => {
  try {
    const groups = await groupModel.getByUserId(req.params.userid);
    if (!groups) {
      const message = "Groups not found";
      return res.status(404).render("404", {
        message: message,
        url: req.url,
        title: `404`,
      });
    }
    res.render("groups", { groups });
  } catch (err) {
    console.log(err);
    const message = "Error retrieving groups from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.get("/:name", async (req, res) => {
  try {
    const groups = await groupModel.getByName(req.params.name);
    if (!groups) {
      const message = "Groups not found";
      return res.status(404).render("404", {
        message: message,
        url: req.url,
        title: `${404} ${message}`,
      });
    }
    res.render("groups", { groups });
  } catch (err) {
    console.log(err);
    const message = "Error retrieving groups from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.post("/", authenticate, upload.single("avatar"), async (req, res) => {
  try {
    const existing = await groupModel.getByName(req.body.name);
    console.log(existing);
    if (existing.length != 0) {
      const message = "Group already exists";
      return res.status(409).render({
        message: message,
        status: 409,
        title: `${409} ${message}`,
      });
    }

    if (
      !req.body.name ||
      !req.body.description ||
      !req.body.visibility ||
      !req.file.path
    ) {
      const message = "All form fileds must be filled";
      return res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
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
    const message = "Error creating group";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.put("/:id", authenticate, isAuthorized("group"), async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    if (!group) {
      const message = "Group not found";
      return res.status(404).render("404", {
        message: message,
        url: req.url,
        title: `${404} ${message}`,
      });
    }
    group.name = req.body.name;
    group.description = req.body.description;
    group.picture_path = req.body.picture_path;
    group.visibility = req.body.visibility;
    await group.update();
    res.redirect(`/groups/${req.params.id}`);
  } catch (err) {
    console.log(err);
    const message = "Error updating group";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.delete("/:id", authenticate, isAuthorized("group"), async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    if (!group) {
      const message = "Group not found";
      return res.status(404).render("404", {
        message: message,
        url: req.url,
        title: `${404} ${message}`,
      });
    }
    await group.delete();
    res.redirect("/groups");
  } catch (err) {
    console.log(err);
    const message = "Error deleting group";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});
