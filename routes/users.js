const express = require("express");
const router = express.Router();
const {
  authenticate,
  isAuthorized,
  checkLogin,
} = require("../middlewares/auth");
const userModel = require("../models/User");
const userGroupModel = require("../models/User_Group_role");

module.exports = router;

router.get("/", checkLogin, async (req, res) => {
  let visibility_level = req.isLogged ? 1 : 2;
  visibility_level = req.isAdmin ? 0 : visibility_level;
  try {
    const users = await userModel.getAllWithVisibilityLevel(visibility_level);
    for(let i = 0; i < users.length; i++) {
      let user = new userModel(users[i].id, users[i].username, users[i].picture_path, users[i].pwd_hash, users[i].visibility, users[i].is_admin)
      console.log(user);
      let number_of_groups = await user.getNumberOfJoinedGroups();
      let number_of_threads = await user.getNumberOfThreads();
      let number_of_comments = await user.getNumberOfComments();
      users[i].number_of_groups = number_of_groups;
      users[i].number_of_threads = number_of_threads;
      users[i].number_of_comments = number_of_comments;
    }

    res.render("users", { users, title: "Users" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving users from database");
  }
});

router.get("/search-non-members", async (req, res) => {
  const searchTerm = req.query.query;
  const groupId = req.query.groupId;
  try {
    const users = await userGroupModel.getNonMembers(searchTerm, groupId);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error searching users");
  }
});
