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
      const [rows] = await db.execute(
        "INSERT INTO users (username, picture_path, password, role, visibility) VALUES (?, ?, ?, ?, ?)",
        [
          this.username,
          this.picture_path,
          this.password,
          this.role,
          this.visibility,
        ],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute("SELECT * FROM users");
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
      return rows[0];
    } catch (err) {
      console.log(err);
    }
  }

  async update() {
    try {
      const [rows] = await db.execute(
        "UPDATE users SET username = ?, picture_path = ?, password = ?, role = ?, visibility = ? WHERE id = ?",
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
      const [rows] = await db.execute("DELETE FROM users WHERE id = ?", [
        this.id,
      ]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = User;
