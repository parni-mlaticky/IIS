const express = require("express");

// TODO change after folder is created for profile pictures
const DEFAULT_PROFILE_AVATAR_PATH = "public/default_profile_pic.png";
const Visibility = {
  PRIVATE : 0,
  REGISTERED : 1,
  PUBLIC : 2
};

const GroupRole = {
  MEMBER : 0,
  MODERATOR : 1,
  OWNER : 2
}

module.exports = {
  DEFAULT_PROFILE_AVATAR_PATH,
  Visibility,
  GroupRole,
};

