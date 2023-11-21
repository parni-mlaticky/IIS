const db = require("../database");

class User_Comment_vote {
  constructor(id, user_id, comment_id, score) {
    this.id = id;
    this.user_id = user_id;
    this.comment_id = comment_id;
    this.score = score;
  }

  async save() {
    try {
      const [rows] = await db.execute(
        "INSERT INTO User_Comment_vote (user_id, comment_id, score) VALUES (?, ?, ?)",
        [
          this.user_id,
          this.comment_id,
          this.score
        ],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute("SELECT * FROM User_Comment_vote");
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.execute("SELECT * FROM User_Comment_vote WHERE id = ?", [id]);
      return rows[0];
    } catch (err) {
      console.log(err);
    }
  }

  async update() {
    try {
      const [rows] = await db.execute(
        "UPDATE User_Comment_vote SET used_id = ?, comment_id = ?, score = ? WHERE id = ?",
        [
          this.user_id,
          this.comment_id,
          this.score,
          this.id
        ],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  async delete() {
    try {
      const [rows] = await db.execute("DELETE FROM User_Comment_vote WHERE id = ?", [
        this.id,
      ]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = User_Comment_vote;
