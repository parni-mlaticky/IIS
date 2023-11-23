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
      return res.status(404).render("404", {
        message: "Threads not found",
        url: req.url,
        title: "404",
      });
    }
    res.render("threads", { threads });
  } catch (err) {
    console.log(err);
    const message = "Error retrieving threads from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    if (await threadModel.getByName(req.body.title)) {
      const message = "Thread already exists";
      return res.status(409).render("error", {
        message: message,
        status: 409,
        title: `${409} ${message}`,
      });
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
    const message = "Error creating thread";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.put("/:id", authenticate, isAuthorized("thread"), async (req, res) => {
  try {
    const thread = await threadModel.getById(req.params.id);
    if (!thread) {
      return res.status(404).render("404", {
        message: "Thread not found",
        url: req.url,
        title: "404",
      });
    }
    thread.title = req.body.title;
    thread.content = req.body.content;
    thread.picture_path = req.body.picture_path;
    thread.group_id = req.body.group_id;
    await thread.save();
    res.redirect(`/threads/${req.params.id}`);
  } catch (err) {
    console.log(err);
    message = "Error updating thread";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
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
        return res.status(404).render("404", {
          message: "Thread not found",
          url: req.url,
          title: "404",
        });
      }
      await thread.delete();
      res.redirect(`/groups/${thread.group_id}`);
    } catch (err) {
      console.log(err);
      const message = "Error deleting thread";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
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
    const message = "Error creating comment";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
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
        return res.status(404).render("404", {
          message: "Comment not found",
          url: req.url,
          title: "404",
        });
      }
      comment.content = req.body.content;
      await comment.save();
      res.redirect(`/threads/${req.params.id}`);
    } catch (err) {
      console.log(err);
      const message = "Error updating comment";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
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
        return res.status(404).render("404", {
          message: "Comment not found",
          url: req.url,
          title: "404",
        });
      }
      await comment.delete();
      res.redirect(`/threads/${req.params.id}`);
    } catch (err) {
      console.log(err);
      const message = "Error deleting comment";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
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
      const message = "Error creating vote";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
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
        return res.status(404).render("404", {
          message: "Vote not found",
          url: req.url,
          title: "404",
        });
      }
      vote.vote = req.body.vote;
      await vote.save();
      res.redirect(`/threads/${req.params.id}`);
    } catch (err) {
      console.log(err);
      const message = "Error updating vote";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }
  },
);
