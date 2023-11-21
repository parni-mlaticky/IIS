const jwt = require("jsonwebtoken");
const commentModel = require("../models/Comment");
const groupModel = require("../models/Group");
const threadModel = require("../models/Thread");
const userModel = require("../models/User");

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded;
    next();
  } catch (err) {
    console.log(err);
    res.redirect("/login").json({ message: "Authentication failed" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.userData && req.userData.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Admin authorization failed" });
  }
};

function isAuthorized(entityType) {
  return async (req, res, next) => {
    try {
      const userId = req.userData.userId;
      const resourceId = req.params.id;
      let ownerUserId;

      switch (entityType) {
        case "comment":
          const comment = await commentModel.getById(resourceId);
          ownerUserId = comment.user_id;
          break;
        case "group":
          const group = await groupModel.getById(resourceId);
          ownerUserId = group.user_id;
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
      if (userId === ownerUserId || req.userData.role === "admin") {
        next();
      } else {
        return res.status(403).json({ message: "Authorization failed" });
      }
    } catch (err) {
      res.status(500).send("Error authorizing user");
    }
  };
}

module.exports = { authenticate, isAdmin, isAuthorized };