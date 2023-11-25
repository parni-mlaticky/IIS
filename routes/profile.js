const express = require("express");
const constants = require("../constants");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const profileModel = require("../models/User");
const bcrypt = require("bcrypt");
const {
  authenticate,
  isAuthorized,
  checkLogin,
  isAdmin,
} = require("../middlewares/auth");
module.exports = router;



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname + "-" + Date.now() + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });

router.get("/", authenticate, async (req, res) => {
  try {
    // If there is a username in params, redirect to the user's profile
    if(req.query.username){
      const profile = await profileModel.getByUsername(req.query.username);
      if (!profile) {
        return res.status(404).render("404", {
          message: "Profile not found",
          url: req.url,
          title: "404",
        });
      }
      return res.redirect("/profile/" + profile.id);
    }

    const profileId = req.userData.id;
    if (!profileId) {
      return res.status(404).render("404", {
        message: "Profile not found",
        url: req.url,
        title: "404",
      });
    }

    url_success_message = req.query.success_message ? "success_message=" + req.query.success_message : "";
    url_error_message = req.query.error_message ? "&error_message=" + req.query.error_message : ""; 
    url_info_message = req.query.info_message ? "&info_message=" + req.query.info_message : "";
    res.redirect(`/profile/${profileId}/?${url_success_message}${url_error_message}${url_info_message}`);

  } catch (err) {
    console.log(err);
    const message = "Error retrieving profile from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res.status(404).render("404", {
        message: "Profile not found",
        url: req.url,
        title: "404",
      });
    }


    if (
      profile.visibility === constants.Visibility.PRIVATE &&
      req.userData?.id !== profile.id &&
      !req.userData?.isAdmin
    ) {
      const message = "Profile is private";
      return res.status(403).render("profile/private_profile", {
        message: "This profile is private",
        status: 403,
        title: `${403} ${"This profile is private"}`,
      });
    }


    const user_object = new profileModel(
      profile.id,
      null,
      null,
      null,
      null,
    );

    const user_number_of_joined_groups = await user_object.getNumberOfJoinedGroups(); 
    const user_number_of_threads = await user_object.getNumberOfThreads();
    const user_number_of_comments = await user_object.getNumberOfComments();

    res.render("profile", {
      user: profile,
      title: "Profile",
      editable: req.userData?.id === profile.id,
      adminAccess: req.isAdmin,
      user_number_of_joined_groups,
      user_number_of_threads,
      user_number_of_comments,
    });

  } catch (err) {
    console.log(err);
    const message = "Error retrieving profile from database";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});

router.get(
  "/:id/edit",
  authenticate,
  isAuthorized("user"),
  async (req, res) => {
    try {
      const profile = await profileModel.getById(req.params.id);
      if (!profile) {
        const message = "Profile not found";
        return res.status(404).render("404", {
          message: message,
          url: req.url,
          title: "404",
        });
      }
      res.render("profile/edit", { user: profile, title: "Edit Profile" });
    } catch (err) {
      console.log(err);
      const message = "Error retrieving profile from database";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }
  },
);

router.get("/:id/admin/edit", authenticate, checkLogin, isAdmin, async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res
        .status(404)
        .render("404", { message: "Profile not found", url: req.url });
    }
    if (profile.id === req.userData.id) {
      return res.status(403).render("error", {
        message: "An administrator cannot admin-edit their own profile",
        status: 403,
        title: `${403} ${"Error"}`,
      });
    }
    const error_message = req.query.error_message || undefined;
    res.render("profile/admin_edit", { user: profile, title: "Edit Profile" });
  } catch (err) {
    console.log(err);
    res.status(500).render("error", {
      message: "Error retrieving profile from database",
      status: 500,
    });
  }
});

const visibility_to_id = (visibility) => {
  switch (visibility) {
    case "public":
      return constants.Visibility.PUBLIC;
    case "registered":
      return constants.Visibility.REGISTERED;
    case "private":
      return constants.Visibility.PRIVATE;
    default:
      throw new Error("Invalid visibility");
  }
};

router.put(
  "/:id",
  authenticate,
  isAuthorized("user"),
  upload.single("picture"),
  async (req, res) => {
    try {
      const profile = await profileModel.getById(req.params.id);
      if (!profile) {
        return res.status(404).render("404", {
          message: "Profile not found",
          url: req.url,
          title: "404",
        });
      }
      const form_old_password = req.body.old_password;
      const old_password_hash = profile.pwd_hash;
      let passwords_match = false;
      if (form_old_password) {
        passwords_match = await bcrypt.compare(
          form_old_password,
          old_password_hash,
        );
      }
      if (form_old_password && !passwords_match) {
        return res.redirect("/profile/" + req.params.id + "/edit" + "?error_message=Old password is incorrect");
      }
      const new_password_hash = passwords_match
        ? await bcrypt.hash(req.body.new_password, 10)
        : profile.pwd_hash;
      new_username = req.body.username || profile.username;
      if(new_username !== profile.username && await profileModel.getByUsername(new_username)){
        return res.redirect("/profile/" + req.params.id + "/edit" + "?error_message=Username already exists");
      };   

      new_picture_path = req.file?.path || profile.path_to_avatar;
      new_visibility = req.body.visibility || profile.visibility;
      const profileObj = new profileModel(
        req.params.id,
        new_username,
        new_picture_path,
        new_password_hash,
        visibility_to_id(new_visibility),
        profile.is_admin,
      );
      await profileObj.save();
      res.redirect(`/profile/${req.params.id}?success_message=Profile updated successfully`);
    } catch (err) {
      console.log(err);
      const message = "Error updating profile";
      res.status(500).render("error", {
        message: message,
        status: 500,
        title: `${500} ${message}`,
      });
    }
  },
);

router.put(
  "/:id/admin",
  authenticate,
  isAdmin,
  upload.single("picture"),
  async (req, res) => {
    try {
      const profile = await profileModel.getById(req.params.id);
      if (!profile) {
        return res
          .status(404)
          .render("404", { message: "Profile not found", url: req.url });
      }
      new_password_hash = req.body.new_password
        ? await bcrypt.hash(req.body.new_password, 10)
        : profile.pwd_hash;
      new_username = req.body.username || profile.username;
      if(new_username !== profile.username && await profileModel.getByUsername(new_username)){
        return res.redirect("/profile/" + req.params.id + "/admin/edit?error_message=" + encodeURIComponent("Username already exists"))
      }

      new_picture_path = req.file?.path || profile.path_to_avatar;
      new_visibility = req.body.visibility || profile.visibility;
      new_is_admin = req.body.is_admin == "true" || false;
      const profileObj = new profileModel(
        req.params.id,
        new_username,
        new_picture_path,
        new_password_hash,
        visibility_to_id(new_visibility),
        new_is_admin,
      );
      
      await profileObj.save();
      res.redirect(`/profile/${profile.id}` + "?success_message=Profile updated successfully");

    } catch (err) {
      console.log(err);
      res.status(500).render("error", {
        message: "Error retrieving profile from database",
        status: 500,
      });
    }
  },
);

router.delete("/:id", authenticate, checkLogin, isAuthorized("user"), async (req, res) => {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) {
      return res.status(404).render("404", {
        message: "Profile not found",
        url: req.url,
        title: "404",
      });
    }
    const profileObject = new profileModel(profile.id, null, null, null, null, null);
    await profileObject.delete();
    res.redirect("/users?success_message=Profile deleted successfully");

  } catch (err) {
    console.log(err);
    const message = "Error deleting profile";
    res.status(500).render("error", {
      message: message,
      status: 500,
      title: `${500} ${message}`,
    });
  }
});
