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
      if (this.id) {
        return this.update();
      }
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
      this.id = rows.insertId;
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

  static async getCommentThreadGroup(comment_id) {
    try {
      const [rows] = await db.query(
        "SELECT *, g.path_to_avatar AS group_avatar, c.id AS comment_id FROM Comment c JOIN Thread t JOIN `Group` g JOIN Registered_user u ON c.thread_id = t.id AND t.group_id = g.id AND c.author_id = u.id WHERE c.id = ?",
        [comment_id]
      );
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
          this.thread_id,
          this.author_id,
          this.content,
          this.post_time,
          this.edited,
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
