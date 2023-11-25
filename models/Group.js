const db = require("../database");

class Group {
  constructor(id, name, description, picture_path, visibility) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.picture_path = picture_path;
    this.visibility = visibility;
  }
  async save() {
    try {
      if(this.id) {
        return this.update();
      }
      const [rows] = await db.query(
        "INSERT INTO `Group` (name, description, path_to_avatar, visibility) VALUES (?, ?, ?, ?)",
        [this.name, this.description, this.picture_path, this.visibility],
      );
      this.id = rows.insertId;
      return this.id;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.query("SELECT * FROM `Group`");
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAllWithVisibility(visibility) {
    try {
      const [rows] = await db.query(
        "SELECT * FROM `Group` WHERE visibility = ?",
        [visibility],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getByName(name) {
    try {
      const [rows] = await db.query("SELECT * FROM `Group` WHERE name = ?", 
      [
        name,
      ]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.query("SELECT * FROM `Group` WHERE id = ?", [id]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getRegisteredUserDisplayedGroups(user_id) {
    try {
      const [rows] = await db.query(
        "SELECT * FROM `Group` WHERE id IN (SELECT DISTINCT group_id FROM `User_Group_role` WHERE user_id = ? OR visibility >= 1)",
        [user_id],
      );
      console.log("ROWS", rows);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }



  static async getGroupByCommentId(comment_id) {
    try {
      const [rows] = await db.query(
        "SELECT * FROM `Group` WHERE id IN (SELECT group_id FROM `Thread` WHERE id IN (SELECT thread_id FROM `Comment` WHERE id = ?));",
        [comment_id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }


  async update() {
    try {
      const [rows] = await db.query(
        "UPDATE `Group` SET name = ?, description = ?, path_to_avatar = ?, visibility = ? WHERE id = ?",
        [
          this.name,
          this.description,
          this.picture_path,
          this.visibility,
          this.id,
        ],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  async delete() {
    try {
      const [rows] = await db.query("DELETE FROM `Group` WHERE id = ?", [
        this.id,
      ]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = Group; 
