const express = require("express");
const router = express.Router();
const threadModel = require("../models/Thread");
const commentModel = require("../models/Comment");
const groupModel = require("../models/Group");
const { authenticate, isAuthorized } = require("../middlewares/auth");

module.exports = router;

router.get("/:groupid", async (req, res) => {
  try {
    const threads = await threadModel.getAllByGroupId(req.params.groupid);
    res.render("threads", { threads });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving threads from database");
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const newThread = new threadModel(
      null,
      req.body.title,
      req.body.content,
      req.body.picture_path,
      req.body.group_id,
      req.userData.userId,
    );
    const newThreadId = await newThread.save();
    res.redirect(`/threads/${newThreadId}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating thread");
  }
});

router.put("/:id", authenticate, isAuthorized("thread"), async (req, res) => {
  try {
    const thread = await threadModel.getById(req.params.id);
    thread.title = req.body.title;
    thread.content = req.body.content;
    thread.picture_path = req.body.picture_path;
    thread.group_id = req.body.group_id;
    await thread.save();
    res.redirect(`/threads/${req.params.id}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating thread");
  }
});

router.delete(
  "/:id",
  authenticate,
  isAuthorized("thread"),
  async (req, res) => {
    try {
      const thread = await threadModel.getById(req.params.id);
      await thread.delete();
      res.redirect(`/groups/${thread.group_id}`);
    } catch (err) {
      console.log(err);
      res.status(500).send("Error deleting thread");
    }
  },
);

router.post("/:id/comments", authenticate, async (req, res) => {
  try {
    const newComment = new commentModel(
      null,
      req.params.id,
      req.userData.userId,
      req.body.content,
      new Date(),
      new Date(),
    );
    await newComment.save();
    res.redirect(`/threads/${req.params.id}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating comment");
  }
});

router.put(
  "/:id/comments/:commentsid",
  authenticate,
  isAuthorized("comment"),
  async (req, res) => {
    try {
      const comment = await commentModel.getById(req.params.commentsid);
      comment.content = req.body.content;
      await comment.save();
      res.redirect(`/threads/${req.params.id}`);
    } catch (err) {
      console.log(err);
      res.status(500).send("Error updating comment");
    }
  },
);

router.delete(
  "/:id/comments/:commentsid",
  authenticate,
  isAuthorized("comment"),
  async (req, res) => {
    try {
      const comment = await commentModel.getById(req.params.commentsid);
      await comment.delete();
      res.redirect(`/threads/${req.params.id}`);
    } catch (err) {
      console.log(err);
      res.status(500).send("Error deleting comment");
    }
  },
);

router.post("/:id/vote", (req, res) => {
  res.send("Vote");
});

router.put("/:id/vote", (req, res) => {
  res.send("Edit Vote");
});

router.post("/:id/comments/:commentsid/vote", (req, res) => {
  res.send("Vote");
});

router.put("/:id/comments/:commentsid/vote", (req, res) => {
  res.send("Edit Vote");
});
