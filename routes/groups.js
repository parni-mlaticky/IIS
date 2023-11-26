const express = require("express");
const router = express.Router();
const groupModel = require("../models/Group");
const userModel = require("../models/User");
const userGroupModel = require("../models/User_Group_role");
const userCommentVoteModel = require("../models/User_Comment_vote");
const threadModel = require("../models/Thread");
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
    } 
    else if(req.userData.isAdmin == 1){
      groups = await groupModel.getAll();
    }

    else {
      groups = await groupModel.getRegisteredUserDisplayedGroups(req.userData.id);
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

router.post("/:id/kick/:userId", async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    if (!group) {
      const message = "Group not found";
      return res.status(404).render("404", {
        message: message,
        url: req.url,
        title: "404",
      });
    }
    else{
      const userGroup = await User_Group_role.getByUserIdAndGroupId(req.userData.id, group[0].id);
      const kickedUserGroup = await User_Group_role.getByUserIdAndGroupId(req.params.userId, group[0].id);
      const kicked_user = await userModel.getById(req.params.userId);
      const user_get = await userModel.getById(req.params.userId);
      const kicked_user_name = user_get.username 
      if(user_get.id == req.userData.id){
        return res.redirect(`/groups/${group[0].id}?error_message=You cannot kick yourself from a group`);
      }
      else if((userGroup[0].role < GroupRole.MODERATOR || userGroup.length) == 0 && req.userData.isAdmin == 0){
        return res.redirect(`/groups/${group[0].id}?error_message=You cannot kick a user from a group you do not moderate`);
      }
      else{
        const userGroupObject = new User_Group_role(kickedUserGroup[0].id, null, null, null);
        await userGroupObject.delete();
        return res.redirect(`/groups/${group[0].id}?success_message=You have kicked the user ${kicked_user_name} from the group`);
      }
    }
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


router.post("/:id/leave", async (req, res) => {
  try {
    const group = await groupModel.getById(req.params.id);
    if (!group) {
      const message = "Group not found";
      return res.status(404).render("404", {
        message: message,
        url: req.url,
        title: "404",
      });
    }
    else{
      const userGroup = await User_Group_role.getByUserIdAndGroupId(req.userData.id, group[0].id);
      if(userGroup.length == 0){
        return res.redirect(`/groups/${group[0].id}`);
      }
      else if(userGroup[0].role == GroupRole.OWNER){
        return res.redirect(`/groups/${group[0].id}?error_message=You cannot leave a group you own`);
      }
      else{
        const userGroupObject = new User_Group_role(userGroup[0].id, null, null, null);
        await userGroupObject.delete();
        return res.redirect(`/groups/${group[0].id}?success_message=You have left the group`);
      }
    }
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
    if (group.length == 0) {
      res.status(404).render("404", {
        message: "Group not found",
        url: req.url,
        title: "404",
      });
      return;
    }

    if (!req.userData && group[0].visibility != Visibility.PUBLIC) {
      return res.redirect("/groups?error_message=This group is not available for guests");
    }

    const user_role_in_group = await userGroupModel.getByUserIdAndGroupId(
      req.userData?.id,
      group[0].id,
    );

    const notif = await NotificationModel.getByUserIdAndGroupId(
      req.userData?.id || null,
      group[0].id,
    );

    let user_can_edit = user_role_in_group?.length == 1 && user_role_in_group[0].role > GroupRole.MODERATOR || req.userData?.isAdmin;
    let user_can_join = user_role_in_group?.length == 0 && group[0].visibility == Visibility.PUBLIC;
    let user_can_post = user_role_in_group?.length == 1 && user_role_in_group[0].role >= GroupRole.MEMBER || req.userData?.isAdmin;
    let user_can_apply_for_moderator = (!req.userData?.isAdmin) && (user_role_in_group?.length == 1 && user_role_in_group[0].role == GroupRole.MEMBER && notif.length == 0);
    let user_is_moderator_or_higher = user_role_in_group?.length == 1 && user_role_in_group[0].role > GroupRole.MEMBER || req.userData?.isAdmin;
    let user_can_request_join = user_role_in_group?.length == 0 && group[0].visibility == Visibility.REGISTERED;
    let user_can_leave = user_role_in_group?.length == 1 && user_role_in_group[0].role != GroupRole.OWNER;

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

    const threads_with_content = await threadModel.getAllWithContentUser(
      group[0].id,
    );


    res.render("groups/detail", {
      group: group[0],
      user: req.userData,
      title: group[0].name,
      user_can_edit,
      user_can_join,
      user_can_apply_for_moderator,
      user_is_moderator_or_higher,
      user_can_post,
      // TODO make the requests for joining work
      user_can_request_join,
      user_can_leave,
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
    res.redirect(`/groups/${req.params.id}?success_message=You have joined the group`);
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
    if (existing.length != 0) {
      const error_message = "Group with this name already exists";
      return res.redirect(`/groups?error_message=${error_message}`);
    }

    if (!req.body.name || !req.body.description || !req.body.visibility) {
      const error_message = "To create a group, fill in the name, description and visibility fields.";
      return res.redirect(`/groups?error_message=${error_message}`);
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
    await newUserGroupRole.save();
    res.redirect(`/groups/${newGroupID}?success_message=Group successfuly created!`);

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

router.put(
  "/:id",
  authenticate,
  checkLogin,
  isAuthorized("group"),
  upload.single("avatar"),
  async (req, res) => {
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

      const sameName = await groupModel.getByName(req.body.name);
      if (sameName.length != 0) {
        const error_message = "Group with this name already exists";
        return res.redirect(`/groups/${req.params.id}?error_message=${error_message}`);
      }

      group[0].name = req.body.name || group[0].name;
      group[0].description = req.body.description || group[0].description;
      group[0].path_to_avatar = req.file
        ? req.file.path
        : group[0].path_to_avatar;
      group[0].visibility = req.body.visibility || group[0].visibility;

      const updatedGroup = new groupModel(
        req.params.id,
        group[0].name,
        group[0].description,
        group[0].path_to_avatar,
        group[0].visibility,
      );
      await updatedGroup.save();

      res.redirect(`/groups/${req.params.id}?success_message=Group successfuly updated!`);

    } catch (err) {
      console.log(err);
      const message = "Error updating group";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }
  },
);

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
    res.redirect("/groups?success_message=Group successfuly deleted!");

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

    const group_owner = await userGroupModel.getGroupOwner(req.params.id);
    const applicant = await userModel.getById(req.userData.id);
    const newNotification = new NotificationModel(
      null,
      req.params.id,
      req.userData.id,
      group_owner[0].user_id,
      NotificationType.MODERATOR_REQUEST,
      `${applicant.username} requested to be a moderator of ${group[0].name}`,
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
      const user_name = await userModel.getById(req.params.userid).username;
      await userGroupModel.hand_over_ownership(req.params.userid, req.params.id);
      return res.redirect(`/groups/${req.params.id}?success_message=Ownership successfuly handed over to user ${user_name}!`);
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

router.post(
  "/:id/revoke_moderator/:userid",
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
      const user_name = (await userModel.getById(req.params.userid)).username;
      console.log("USER_NAME", user_name);
      const user_group_role = await userGroupModel.getByUserIdAndGroupId(req.params.userid, req.params.id);
      const role = user_group_role[0].role;
      console.log(user_group_role);
      if(role != 1) {
        return res.redirect(`/groups/${req.params.id}?error_message=User ${user_name} is not a moderator!`);
      }

      const userGroupObject = new userGroupModel(user_group_role[0].id, user_group_role[0].user_id, user_group_role[0].group_id,
        GroupRole.MEMBER);

      await userGroupObject.save();

      return res.redirect(`/groups/${req.params.id}?success_message=Moderator rights successfuly revoked from user ${user_name}!`);
    } catch (err) {
      console.log(err);
      const message = "Error revoking moderator rights";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }
  }
)

router.post(
  "/:groupid/delete_thread/:threadid",
  authenticate,
  async (req, res) => {
    try {
      const group = await groupModel.getById(req.params.groupid);
      if (!group) {
        const message = "Group not found";
        return res.status(404).render("404", {
          message: message,
          url: req.url,
          title: `${404} ${message}`,
        });
      }


      const user_role = await userGroupModel.getByUserIdAndGroupId(req.userData.id, req.params.groupid);

      const is_authorized = user_role[0].role >= 1 || req.userData?.isAdmin;
      if(!is_authorized) {
        return res.redirect(`/groups/${req.params.groupid}?error_message=You are not authorized to delete threads!`);
      }

      const thread = await threadModel.getById(req.params.threadid);
      console.log("THREADID", req.params.threadid)
      console.log(thread);
      if (!thread) {
        const message = "Thread not found";
        return res.status(404).render("404", {
          message: message,
          url: req.url,
          title: `${404} ${message}`,
        });
      }
      const threadObject = new threadModel(thread[0].id, thread[0].group_id, thread[0].title, thread[0].content_id);
      await threadObject.delete();

      return res.redirect(`/groups/${req.params.groupid}?success_message=Thread successfuly deleted!`);
    } catch (err) {
      console.log(err);
      const message = "Error deleting thread";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }
  }
);

