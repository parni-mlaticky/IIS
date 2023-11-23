const express = require("express");

// TODO change after folder is created for profile pictures
const DEFAULT_PROFILE_AVATAR_PATH = "public/default_profile_pic.png";
const Visibility = {
  PRIVATE: 0,
  REGISTERED: 1,
  PUBLIC: 2,
};

const GroupRole = {
  MEMBER: 0,
  MODERATOR: 1,
  OWNER: 2,
};

const NotificationType = {
  PRIVATE_INVITE: 0,
  MODERATION_REQUEST: 1,
  ADMINISTRATION_REQUEST: 2,
  INVITE: 3,
};

module.exports = {
  DEFAULT_PROFILE_AVATAR_PATH,
  Visibility,
  GroupRole,
  NotificationType,
};
