const db = require("../database");

class User {
  constructor(id, username, picture_path, password, visibility, is_admin) {
    this.id = id;
    this.username = username;
    this.picture_path = picture_path;
    this.password = password;
    this.visibility = visibility;
    this.is_admin = is_admin;
  }

  async save() {
    try {
      if (this.id) {
        return this.update();
      }
      const result = await db.execute(
        "INSERT INTO Registered_user (username, path_to_avatar, pwd_hash, visibility, is_admin) VALUES (?, ?, ?, ?, ?)",
        [
          this.username,
          this.picture_path,
          this.password,
          this.visibility,
          this.is_admin,
        ],
      );
      this.id = result[0].insertId;
      return this.id;
    } catch (err) {
      console.log(err);
    }
  }
  user;

  static async getByUsername(username) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM Registered_user WHERE username = ?",
        [username],
      );
      return rows[0];
    } catch (err) {
      console.log(err);
    }
  }

  static async getByUsernameLike(username) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM Registered_user WHERE username like ?",
        [`%${username}%`],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAllWithVisibilityLevel(level) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM Registered_user WHERE visibility >= ?",
        [level],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute("SELECT * FROM Registered_user");
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM Registered_user WHERE id = ?",
        [id],
      );
      return rows[0];
    } catch (err) {
      console.log(err);
    }
  }

  async getNumberOfJoinedGroups(){
    try {
      const [rows] = await db.execute(
        "SELECT COUNT(*) AS count FROM User_Group_role WHERE user_id = ?",
        [this.id],
      );
      return rows[0].count;
    } catch (err) {
      console.log(err);
    }
  }

  async getNumberOfThreads(){
    try {
      const [rows] = await db.execute(
        "SELECT COUNT(*) AS count FROM Thread t JOIN Comment c ON t.content_id = c.id where author_id = ?",
        [this.id],
      );
      return rows[0].count;
    } catch (err) {
      console.log(err);
    }
  }

  async getNumberOfComments(){
    try {
      const [rows] = await db.execute(
        "SELECT COALESCE(COUNT(*), 0) AS count FROM Comment c LEFT JOIN Thread t on c.id = t.content_id WHERE author_id = ? AND t.content_id IS NULL",  
        [this.id],
      );
      return rows[0].count;
    } catch (err) {
      console.log(err);
    }
  }

  async update() {
    try {
      await db.execute(
        "UPDATE Registered_user SET username = ?, path_to_avatar = ?, pwd_hash = ?, visibility = ?, is_admin = ? WHERE id = ?",
        [
          this.username,
          this.picture_path,
          this.password,
          this.visibility,
          this.is_admin,
          this.id,
        ],
      );
      return this.id;
    } catch (err) {
      console.log(err);
    }
  }

  async delete() {
    try {
      const [rows] = await db.execute(
        "DELETE FROM Registered_user WHERE id = ?",
        [this.id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = User;
