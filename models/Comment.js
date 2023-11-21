const db = require("../database");

class Comment {
  constructor(id, thread_id, author_id, content, post_time, edited) {
    this.id = id;
    this.thread_id = thread_id;
    this.author_id = author_id;
    this.content = content;
    this.post_time = post_time;
    this.edited = edited;
  }
  async save() {
    try {
      const [rows] = await db.query(
        "INSERT INTO Comment (thread_id, author_id, content, post_time, edited) VALUES (?, ?, ?, ?, ?)",
        [
          this.thread_id,
          this.author_id,
          this.content,
          this.post_time,
          this.edited,
        ],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAllByThreadId(thread_id) {
    try {
      const [rows] = await db.query(
        "SELECT * FROM Comment WHERE thread_id = ?",
        [thread_id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.query("SELECT * FROM Comment");
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.query("SELECT * FROM Comment WHERE id = ?", [id]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  async update() {
    try {
      const [rows] = await db.query(
        "UPDATE Comment SET thread_id = ?, author_id = ?, content = ?, post_time = ?, edited = ? WHERE id = ?",
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
      const [rows] = await db.query("DELETE FROM Comment WHERE id = ?", [
        this.id,
      ]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = Comment;
