const express = require("express");
const router = express.Router();
const groupModel = require("../models/Group");
const userModel = require("../models/User");
const userGroupModel = require("../models/User_Group_role");
const userCommentVoteModel = require("../models/User_Comment_vote");
const threadModel = require("../models/Thread")
const NotificationModel = require("../models/Notification");
const {
  GroupRole,
  Visibility,
  NotificationType,
  DEFAULT_GROUP_AVATAR_PATH,
} = require("../constants");

const {
  authenticate,
  isAuthorized,
  checkLogin,
} = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");
const User_Group_role = require("../models/User_Group_role");

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

router.get("/", async (req, res) => {
  try {
    let groups;
    if (!req.userData) {
      groups = await groupModel.getAllWithVisibility(Visibility.PUBLIC);
    } else {
      groups = await groupModel.getAll();
    }
    // TDOO show to members only if visibility is 1
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

router.get("/:id", checkLogin, async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    if (group.length == 0) {
      res.status(404).render("404", {
        message: "Group not found",
        url: req.url,
        title: "404",
      });
      return;
    }

    if (!req.userData && group[0].visibility != Visibility.PUBLIC) {
      return res.status(404).send("Group not found");
    }

    let user_can_edit = false;
    if (req.userData) {
        user_can_edit = await userGroupModel.isUserGroupOwner(
        req.userData.id,
        group[0].id,
      );
    }

    let user_can_join = false;
    if (req.userData) {
      const user_group = await userGroupModel.getByUserIdAndGroupId(
        req.userData.id,
        req.params.id,
      );
      user_can_join = user_group.length == 0;
    }

    let ownerUser = null;
    let moderatorUsers = [];
    let members = [];

    const groupMembers = await userGroupModel.getGroupMembers(group[0].id);

    groupMembers.forEach((member) => {
      switch (member.role) {
        case GroupRole.OWNER:
          ownerUser = member;
          break;
        case GroupRole.MODERATOR:
          moderatorUsers.push(member);
          break;
        case GroupRole.MEMBER:
          members.push(member);
          break;
      }
    });

    const threads_with_content = await threadModel.getAllWithContentUser(group[0].id);

    res.render("groups/detail", {
      group: group[0],
      user: req.userData,
      title: group[0].name,
      user_can_edit,
      user_can_join,
      owner: ownerUser,
      moderators: moderatorUsers,
      members: members,
      threads: threads_with_content,
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

router.post("/:id/join", authenticate, async (req, res) => {
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
    const newUserGroupRole = new userGroupModel(
      null,
      `${req.userData.id}`,
      req.params.id,
      GroupRole.MEMBER,
    );
    await newUserGroupRole.save();
    res.redirect(`/groups/${req.params.id}`);
  } catch (err) {
    console.log(err);
    const message = "Error joining group";
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
    res.render("groups", { groups, title: "Groups" });
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
    res.render("groups", { groups, title: "Groups" });
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

    if (!req.body.name || !req.body.description || !req.body.visibility) {
      const message = "All form fields must be filled";
      return res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }

    const newGroup = new groupModel(
      null,
      req.body.name,
      req.body.description,
      req.file?.path || DEFAULT_GROUP_AVATAR_PATH,
      req.body.visibility,
    );

    const newGroupID = await newGroup.save();
    const newUserGroupRole = new userGroupModel(
      null,
      `${req.userData.id}`,
      newGroupID,
      GroupRole.OWNER,
    );
    console.log(await newUserGroupRole.save());
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

router.put("/:id", authenticate, checkLogin, isAuthorized("group"), upload.single("avatar"), async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);

    if (!group) {
      const message = "Group not found";
      return res.status(404).render("404", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }

    // Hide non-public groups from unlogged-in users.
    if (!req.userData && group[0].visibility != Visibility.PUBLIC) {
      return res.status(404).send("Group not found");
    }

    const sameName = await groupModel.getByName(req.body.name);
    if (sameName.length != 0) {
      return res.status(500).send("Group with this name already exists");
    }

    group[0].name = req.body.name || group[0].name;
    group[0].description = req.body.description || group[0].description;
    group[0].path_to_avatar = req.file ? req.file.path : group[0].path_to_avatar;
    group[0].visibility = req.body.visibility || group[0].visibility;

    const updatedGroup = new groupModel(
      req.params.id,
      group[0].name,
      group[0].description,
      group[0].path_to_avatar,
      group[0].visibility,
    );
    await updatedGroup.save();

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

    const groupObject = new groupModel(req.params.id, null, null, null, null);
    await groupObject.delete();

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

router.post("/:id/request_moderator", authenticate, async (req, res) => {
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
    const newNotification = new NotificationModel(
      null,
      req.params.id,
      req.userData.id,
      userGroupModel.getGroupOwner(req.params.id)[0].user_id,
      NotificationType.MODERATOR_REQUEST,
      `${req.userData.username} requested to be a moderator of ${group[0].name}`,
    );
    await newNotification.save();
    res.redirect(`/groups/${req.params.id}`);
  } catch (err) {
    console.log(err);
    const message = "Error requesting moderator";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.post("/:id/invite/:userId", authenticate, async (req, res) => {
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
    const newNotification = new NotificationModel(
      null,
      req.params.id,
      req.userData.id,
      req.params.userId,
      NotificationType.INVITE,
      `${req.userData.username} invited you to ${group[0].name}`,
    );
    await newNotification.save();
    res.redirect(`/groups/${req.params.id}`);
  } catch (err) {
    console.log(err);
    const message = "Error inviting user to group";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.post(
  "/:id/hand_over_ownership/:userid",
  authenticate,
  isAuthorized("group"),
  async (req, res) => {
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
      userGroupModel.hand_over_ownership(req.params.userid, req.params.id);
      res.redirect(`/groups/${req.params.id}`);
    } catch (err) {
      console.log(err);
      const message = "Error handing over ownership of group";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }
  },
);
