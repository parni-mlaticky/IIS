const express = require("express");
const router = express.Router();
const threadModel = require("../models/Thread");
const groupModel = require("../models/Group");
const commentModel = require("../models/Comment");
const userCommentVoteModel = require("../models/User_Comment_vote");
const { authenticate, isAuthorized, checkLogin } = require("../middlewares/auth");
const { getThreadWithContentUser } = require("../models/Thread");
const { Visibility } = require("../constants")

module.exports = router;

router.get("/:groupid", checkLogin, async (req, res) => {
  try {
    const thread_with_content = await threadModel.getThreadWithContentUser(req.params.groupid);
    if (thread_with_content.length != 1) {
      return res.status(404).render("error", {
        message: "Thread not found",
        status: 404,
        title: `${404} Thread not found`
      });
    }
    const group = await groupModel.getById(thread_with_content[0].group_id);

    if (!req.userData && thread_with_content.visibility != Visibility.PUBLIC) {
      return res.status(404).render("error", {
        message: "Thread not found",
        status: 404,
        title: `${404} Thread not found`
      });
    }

    return res.status(200).render("threads/details", {
      title: `${group[0].name}: ${thread_with_content[0].title}`,
      thread: thread_with_content[0],
      group: group[0],
      user: req.userData
    });

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

router.post("/:groupid", authenticate, async (req, res) => {
  try {
    if (!req.body.content || !req.body.title) {
      return res.status(500).send("Thread all fields must be filled.");
    }

    // TODO CHECK membership permissions
    const newComment = new commentModel(
      null,
      null,
      req.userData.id,
      req.body.content,
      new Date(),
      false,
    );
    const createdComment = await newComment.save();
    const commentId = createdComment.insertId;
    const newThread = new threadModel(
      null,
      req.params.groupid,
      req.body.title,
      commentId,
    );
    const createdThread = await newThread.save();

    res.redirect(`/groups/${req.params.groupid}`);
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
    const thread_with_content = await getThreadWithContentUser(req.params.id);
    if (thread_with_content.length != 1) {
      const message = "Thread not found"
      return res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }

    if (!req.userData && thread_with_content.visibility != Visibility.PUBLIC) {
      return res.status(404).render("error", {
        message: "Thread not found",
        status: 404,
        title: `${404} Thread not found`
      });
    }

    if (!req.body.content && !req.body.title) {
      const message = "Specify at least one change"
      return res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }

    const newComment = new commentModel(
      thread_with_content[0].content_id,
      thread_with_content[0].thread_id,
      thread_with_content[0].author_id,
      req.body.content || thread_with_content[0].content,
      thread_with_content[0].post_time,
      true
    );
    newComment.save();

    const newThread = new threadModel(
      thread_with_content[0].parent_id,
      thread_with_content[0].group_id,
      req.body.title || thread_with_content[0].title,
      thread_with_content[0].content_id
    );
    newThread.save();

    const createdComment = await newComment.save();
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





