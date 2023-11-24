const jwt = require("jsonwebtoken");
const commentModel = require("../models/Comment");
const userGroupModel = require("../models/User_Group_role");
const threadModel = require("../models/Thread");
const userModel = require("../models/User");
const userCommentVoteModel = require("../models/User_Comment_vote");

const checkLogin = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.isLogged = true;
      req.userData = decoded; 
      req.isAdmin = decoded.isAdmin;
      req.userData.isAdmin = decoded.isAdmin;
    } else {
      req.isLogged = false;
    }
  } catch (err) {
    req.isLogged = false;
  }
  res.locals.isLogged = req.isLogged;
  next();
};

const authenticate = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect("/login");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded;
    next();
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

const isAdmin = async (req, res, next) => {
  if (req.userData?.isAdmin) {
    next();
  } else {
    return res.status(403).json({ message: "Admin authorization failed" });
  }
};

function isAuthorized(entityType) {
  return async (req, res, next) => {
    try {
      const userId = req.userData.id;
      const resourceId = req.params.id;
      let ownerUserId;

      switch (entityType) {
        case "comment":
          const comment = await commentModel.getById(resourceId);
          ownerUserId = comment.user_id;
          break;
        case "group":
          ownerUserId = (await userGroupModel.isUserGroupOwner(
            userId,
            resourceId,
          ))
            ? userId
            : null;
          break;
        case "thread":
          const thread = await threadModel.getById(resourceId);
          ownerUserId = thread.user_id;
          break;
        case "user":
          const user = await userModel.getById(resourceId);
          ownerUserId = user.id;
          break;
      }
      if (userId === ownerUserId || req.isAdmin) {
        next();
      } else {
        return res.status(403).json({ message: "Authorization failed" });
      }
    } catch (err) {
      console.log(err);
      res.status(500).send("Error authorizing user");
    }
  };
}

module.exports = { authenticate, isAdmin, isAuthorized, checkLogin };
