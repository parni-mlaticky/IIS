const express = require("express");
const router = express.Router();
const threadModel = require("../models/Thread");
const commentModel = require("../models/Comment");
const userCommentVoteModel = require("../models/User_Comment_vote");
const { authenticate, isAuthorized } = require("../middlewares/auth");

module.exports = router;

router.get("/:groupid", async (req, res) => {
  try {
    const threads = await threadModel.getAllByGroupId(req.params.groupid);
    if (!threads) {
      return res
        .status(404)
        .render("404", { message: "Threads not found", url: req.url });
    }
    res.render("threads", { threads });
  } catch (err) {
    console.log(err);
    res.status(500).render("error", {
      message: "Error retrieving threads from database",
      status: 500,
    });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    if (await threadModel.getByName(req.body.title)) {
      return res
        .status(409)
        .render("error", { message: "Thread already exists", status: 409 });
    }
    const newThread = new threadModel(
      null,
      req.body.title,
      req.body.content,
      req.body.picture_path,
      req.body.group_id,
      req.userData.id,
    );
    const newThreadId = await newThread.save();
    res.redirect(`/threads/${newThreadId}`);
  } catch (err) {
    console.log(err);
    res.status(500).render("error", {
      message: "Error creating thread",
      status: 500,
    });
  }
});

router.put("/:id", authenticate, isAuthorized("thread"), async (req, res) => {
  try {
    const thread = await threadModel.getById(req.params.id);
    if (!thread) {
      return res
        .status(404)
        .render("404", { message: "Thread not found", url: req.url });
    }
    thread.title = req.body.title;
    thread.content = req.body.content;
    thread.picture_path = req.body.picture_path;
    thread.group_id = req.body.group_id;
    await thread.save();
    res.redirect(`/threads/${req.params.id}`);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .render("error", { message: "Error updating thread", status: 500 });
  }
});

router.delete(
  "/:id",
  authenticate,
  isAuthorized("thread"),
  async (req, res) => {
    try {
      const thread = await threadModel.getById(req.params.id);
      if (!thread) {
        return res
          .status(404)
          .render("404", { message: "Thread not found", url: req.url });
      }
      await thread.delete();
      res.redirect(`/groups/${thread.group_id}`);
    } catch (err) {
      console.log(err);
      res.status(500).render("error", {
        message: "Error deleting thread",
        status: 500,
      });
    }
  },
);

router.post("/:id/comments", authenticate, async (req, res) => {
  try {
    const newComment = new commentModel(
      null,
      req.params.id,
      req.userData.id,
      req.body.content,
      new Date(),
      new Date(),
    );
    await newComment.save();
    res.redirect(`/threads/${req.params.id}`);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .render("error", { message: "Error creating comment", status: 500 });
  }
});

router.put(
  "/:id/comments/:commentsid",
  authenticate,
  isAuthorized("comment"),
  async (req, res) => {
    try {
      const comment = await commentModel.getById(req.params.commentsid);
      if (!comment) {
        return res
          .status(404)
          .render("404", { message: "Comment not found", url: req.url });
      }
      comment.content = req.body.content;
      await comment.save();
      res.redirect(`/threads/${req.params.id}`);
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .render("error", { message: "Error updating comment", status: 500 });
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
      if (!comment) {
        return res
          .status(404)
          .render("404", { message: "Comment not found", url: req.url });
      }
      await comment.delete();
      res.redirect(`/threads/${req.params.id}`);
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .render("error", { message: "Error deleting comment", status: 500 });
    }
  },
);

router.post(
  "/:id/comments/:commentsid/vote",
  authenticate,
  async (req, res) => {
    try {
      const newVote = new userCommentVoteModel(
        null,
        req.userData.id,
        req.params.commentsid,
        req.body.vote,
      );
      await newVote.save();
      res.redirect(`/threads/${req.params.id}`);
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .render("error", { message: "Error creating vote", status: 500 });
    }
  },
);

router.put(
  "/:id/comments/:commentsid/vote",
  authenticate,
  isAuthorized("userCommentVote"),
  async (req, res) => {
    try {
      const vote = await userCommentVoteModel.getById(req.params.commentsid);
      if (!vote) {
        return res
          .status(404)
          .render("404", { message: "Vote not found", url: req.url });
      }
      vote.vote = req.body.vote;
      await vote.save();
      res.redirect(`/threads/${req.params.id}`);
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .render("error", { message: "Error updating vote", status: 500 });
    }
  },
);
