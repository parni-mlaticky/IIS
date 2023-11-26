const express = require("express");
const router = express.Router();
const threadModel = require("../models/Thread");
const groupModel = require("../models/Group");
const commentModel = require("../models/Comment");
const userGroupModel = require("../models/User_Group_role");
const { authenticate, isAuthorized, checkLogin } = require("../middlewares/auth");
const { getThreadWithContentUser } = require("../models/Thread");
const { Visibility } = require("../constants");
const voteModel = require("../models/User_Comment_vote");

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
    
    if (!req.userData && group[0].visibility != Visibility.PUBLIC) {
      return res.status(404).render("error", {
        message: "Thread not found",
        status: 404,
        title: `${404} Thread not found`
      });
    }

    let isMember = false;
    if (req.userData) {
      isMember = await userGroupModel.isUserGroupMember(req.userData.id, thread_with_content[0].group_id);
      isMember = isMember || req.userData.isAdmin;
    }

    let user_id = req.userData ? req.userData.id : null;
    const threadComments = await threadModel.getCommentsUserVote(req.params.groupid, user_id);
    const user_role = !req.userData ? -1 : (await (userGroupModel.getByUserIdAndGroupId(req.userData?.id, group[0].id)))[0];

    return res.status(200).render("threads/details", {
      title: `${group[0].name}: ${thread_with_content[0].title}`,
      thread: thread_with_content[0],
      group: group[0],
      user: req.userData,
      moderator_or_higher: user_role?.role >= 1 || req.userData?.isAdmin, 
      comments: threadComments,
      isMember,
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

router.post("/:groupid", authenticate, checkLogin, async (req, res) => {
  try {
    if (!req.body.content || !req.body.title) {
      return res.redirect(`/groups/${req.params.groupid}?error_message=To create a thread, please fill out the title and the content`);
    }

    const user_group_role = await userGroupModel.getByUserIdAndGroupId(req.userData?.id, req.params.groupid);
    let isMember = user_group_role.length > 0;

    if (!isMember && !req.userData?.isAdmin) {
      return res.redirect(`/groups/${req.params.groupid}?error_message=You are not a member of this group so you are not allowed to post a thread`);
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

    res.redirect(`/groups/${req.params.groupid}?success_message=Thread created successfully`);

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

router.get("/:threadid/comments/:id", authenticate, checkLogin, isAuthorized("comment"), async (req, res) => {
  const commentGroup = await commentModel.getCommentThreadGroup(req.params.id);
  if (commentGroup.length != 1) {
      const message = "Error editing comment";
      return res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
  }

  res.status(200).render("comments", {
    title: "xd",
    commentGroup: commentGroup[0],
  });
});

router.post("/:id/comments", authenticate, checkLogin, async (req, res) => {
  try {
    // Verify that the comment is not empty
    if (!req.body.content) {
      const message = "Cannot post empty comment";
      return res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }

    // Get thread informaction
    const thread_with_content = await threadModel.getThreadWithContentUser(req.params.id);
    if (thread_with_content.length != 1) {
      return res.status(404).render("error", {
        message: "Thread not found",
        status: 404,
        title: `${404} Thread not found`
      });
    }

    // Verify membership
    let isMember = false;
    if (req.userData) {
      isMember = await userGroupModel.isUserGroupMember(req.userData.id, thread_with_content[0].group_id);
    }

    if (!req.userData) {
      res.redirect(`/login`);
    }

    const comment = new commentModel(
      null,
      req.params.id,
      req.userData.id,
      req.body.content,
      new Date(),
      false
    );
    await comment.save();

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
  "/:threadid/comments/:id/",
  authenticate,
  isAuthorized("comment"),
  async (req, res) => {
    try {
      const comment = await commentModel.getById(req.params.id);
      if (comment.length != 1) {
        return res.status(404).render("404", {
          message: "Comment not found",
          url: req.url,
          title: "404",
        });
      }
      const newComment = new commentModel(
        comment[0].id,
        comment[0].thread_id,
        comment[0].author_id,
        req.body.content,
        comment[0].post_time,
        true
      );
      await newComment.save();
      res.redirect(`/threads/${req.params.threadid}`);
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
  "/:threadid/comments/:id",
  authenticate,
  async (req, res) => {
    try {
      const comment = await commentModel.getById(req.params.id);
      if (comment.length != 1) {
        return res.status(404).render("404", {
          message: "Comment not found",
          url: req.url,
          title: "404",
        });
      }
      
      const group = await groupModel.getGroupByCommentId(comment[0].id);
      const user_role = (await userGroupModel.getByUserIdAndGroupId(req.userData.id, group[0].id))[0].role;
      const user_is_moderator_or_higher = user_role >= 1 || req.userData.is_admin; 

      if((comment[0].author_id != req.userData.id) && !user_is_moderator_or_higher) {
        return res.redirect(`/threads/${req.params.threadid}?error_message=You cannot delete this comment`);
      }
      const newComment = new commentModel(
        comment[0].id
      );
      await newComment.delete();
      res.redirect(`/threads/${req.params.threadid}?success_message=Comment deleted successfully`);
    } catch (err) {
      console.log(err);
      const message = "Error deleting comment";
      return res.status(500).render("error", {
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
  checkLogin,
  async (req, res) => {
    try {
      // Check that user is logged in
      if (!req.userData) {
        const message = "You have to log in before you can vote";
        return res.status(500).render("error", {
          message: message,
          status: 500,
          title: `${500} ${message}`,
        });
      }
      
      // Check that the user doesn't own the comment
      const threadComments = await threadModel.getCommentsUserVote(req.params.groupid, req.userData.id);
      if (req.userData.id == threadComments.author_id) {
        const message = "You cannot rate your own comment";
        return res.status(500).render("error", {
          message: message,
          status: 500,
          title: `${500} ${message}`,
        });
      }

      // Try to find existing vote
      // If not, instantiate new one
      // In the end I am left with one vote object
      let vote = await voteModel.getByUserCommentId(req.userData.id, req.params.commentsid);
      let newVote;
      if (vote) {
        const score = vote.score == req.body.score ? 0 : req.body.score;
        newVote = new voteModel (
          vote.id,
          req.userData.id,
          req.params.commentsid,
          score,
        );
      }
      else {
        newVote = new voteModel (
          null,
          req.userData.id,
          req.params.commentsid,
          req.body.score
        );
      }
      newVote.save();

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




