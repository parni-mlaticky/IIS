const express = require("express");
const router = express.Router();
const NotificationModel = require("../models/Notification");
const UserGroupRoleModel = require("../models/User_Group_role");
const { NotificationType, GroupRole } = require("../constants");
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
    if(userGroupRole.length == 0){
      const eror_message = "Notification no longer valid. Probably because user is no longer a member of the group."
      const notif = new NotificationModel(details[0].id, null, null, null, null, null);
      await notif.delete();
      return res.redirect("/notifications?error_message=" + eror_message);
    }

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
    res.redirect("/notifications?success_message=Successfully accepted moderator request");
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
    let noitification = await NotificationModel.getById(req.params.id);
    noitification = new NotificationModel(
      noitification[0].id,
      noitification[0].group_id,
      noitification[0].applicant_id,
      noitification[0].recipient_id,
      NotificationType.MODERATOR_REQUEST,
      noitification[0].message,
    );
    await noitification.delete();
    res.redirect("/notifications?success_message=Successfully rejected moderator request");
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

    const userGroupRole = new UserGroupRoleModel(
      null,
      details[0].recipient_id,
      details[0].group_id,
      GroupRole.MEMBER,
    );

    const notification = new NotificationModel(
      details[0].id,
      details[0].group_id,
      details[0].applicant_id,
      details[0].recipient_id,
      NotificationType.INVITE,
      details[0].message,
    );

    await userGroupRole.save();
    await notification.delete();
    res.redirect("/notifications?success_message=Successfully accepted invite");
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
    let notification = await NotificationModel.getById(req.params.id);
    notification = new NotificationModel(
      notification[0].id,
      notification[0].group_id,
      notification[0].applicant_id,
      notification[0].recipient_id,
      notification[0].notification_type,
      notification[0].message,
    );
    await notification.delete();
    res.redirect("/notifications?success_message=Successfully rejected invite");
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
