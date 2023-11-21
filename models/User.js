const db = require("../database");

class User {
  constructor(id, username, picture_path, password, role, visibility) {
    this.id = id;
    this.username = username;
    this.picture_path = picture_path;
    this.password = password;
    this.role = role;
    this.visibility = visibility;
  }

  async save() {
    try {
      const result = await db.execute(
        "INSERT INTO Registered_user (username, picture_path, password, role, visibility) VALUES (?, ?, ?, ?, ?)",
        [
          this.username,
          this.picture_path,
          this.password,
          this.role,
          this.visibility,
        ],
      );
      this.id = result[0].insertId;
      return this.id;
    } catch (err) {
      console.log(err);
    }
  }

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

  async update() {
    try {
      const [rows] = await db.execute(
        "UPDATE Registered_user SET username = ?, picture_path = ?, password = ?, role = ?, visibility = ? WHERE id = ?",
        [
          this.username,
          this.picture_path,
          this.password,
          this.role,
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