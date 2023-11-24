const express = require("express");
const router = express.Router();
const NotificationModel = require("../models/Notification");
const UserGroupRoleModel = require("../models/User_Group_role");
const { NotificationType } = require("../constants");
const { authenticate } = require("../middlewares/auth");

module.exports = router;

router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await NotificationModel.getByRecipientId(
      req.userData.id,
    );
    res.render("notifications", { notifications, title: "Notifications" });
  } catch (err) {
    console.log(err);
    const message = "Error retrieving notifications from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.post("/:id/accept_moderator", authenticate, async (req, res) => {
  try {
    let details = await NotificationModel.getById(req.params.id);
    let userGroupRole = await UserGroupRoleModel.getByUserIdAndGroupId(
      details[0].applicant_id,
      details[0].group_id,
    );
    userGroupRole = userGroupRole[0];
    userGroupRole = new UserGroupRoleModel(
      userGroupRole.id,
      userGroupRole.user_id,
      userGroupRole.group_id,
      userGroupRole.role,
    );
    userGroupRole.role = 1;
    await userGroupRole.save();

    details = new NotificationModel(
      details[0].id,
      details[0].group_id,
      details[0].applicant_id,
      details[0].recipient_id,
      NotificationType.MODERATOR_REQUEST,
      details[0].message,
    );
    await details.delete();
    res.redirect("/notifications");
  } catch (err) {
    console.log(err);
    const message = "Error retrieving notifications from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.post("/:id/reject_moderator", authenticate, async (req, res) => {
  try {
    await NotificationModel.delete(req.params.id);
    res.redirect("/notifications");
  } catch (err) {
    console.log(err);
    const message = "Error retrieving notifications from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.post("/:id/accept_invite", authenticate, async (req, res) => {
  try {
    const details = await NotificationModel.getById(req.params.id);
    const userGroupRole = await UserGroupRoleModel.getByUserIdAndGroupId(
      details[0].applicant_id,
      details[0].group_id,
    );
    userGroupRole.role = 0;
    await userGroupRole.update();
    await NotificationModel.delete(req.params.id);
    res.redirect("/notifications");
  } catch (err) {
    console.log(err);
    const message = "Error retrieving notifications from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.post("/:id/reject_invite", authenticate, async (req, res) => {
  try {
    await NotificationModel.delete(req.params.id);
    res.redirect("/notifications");
  } catch (err) {
    console.log(err);
    const message = "Error retrieving notifications from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});
