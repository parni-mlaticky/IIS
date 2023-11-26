const db = require("../database");

class Thread {
  constructor(id, group_id, title, content_id) {
    this.id = id;
    this.group_id = group_id;
    this.title = title;
    this.content_id = content_id;
  }

  async save() {
    try {
      if (this.id) {
        return this.update();
      }
      const [rows] = await db.query(
        "INSERT INTO Thread (group_id, title, content_id) VALUES (?, ?, ?)",
        [this.group_id, this.title, this.content_id],
      );
      this.id = rows.insertId;
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAllWithContentUser(group_id) {
    try {
      const [rows] = await db.query(
        "select * , t.id AS parent_id from Thread t JOIN Comment c JOIN Registered_user u ON t.content_id=c.id AND c.author_id=u.id WHERE group_id = ?",
        [group_id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getThreadWithContentUser(thread_id) {
    try {
      const [rows] = await db.query(
        "select *, t.id AS parent_id from Thread t JOIN Comment c JOIN Registered_user u ON t.content_id=c.id AND c.author_id=u.id WHERE t.id = ?",
        [thread_id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getCommentsUserVote(thread_id, user_id) {
    try {
      const [rows] = await db.query(
        `
          SELECT
              c.thread_id,
              u.id AS author_id,
              c.content,
              c.post_time,
              c.edited,
              u.id as user_id,
              u.username,
              u.path_to_avatar,
              u.is_admin,
              c.id AS comment_id,
              COALESCE(SUM(v.score), 0) AS score,
              MAX(vv.score) AS user_score
          FROM Comment c
          LEFT JOIN Registered_user u ON c.author_id = u.id
          LEFT JOIN User_Comment_vote v ON c.id = v.comment_id
          LEFT JOIN User_Comment_vote vv ON vv.comment_id = c.id AND vv.user_id = ?
          WHERE c.thread_id = ?
          GROUP BY c.thread_id, u.id, c.content, c.post_time, c.edited, u.username, u.path_to_avatar, u.is_admin, c.id;
        `,
        [user_id, thread_id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.query("SELECT * FROM Thread");
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.query("SELECT * FROM Thread WHERE id = ?", [id]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getByGroupId(group_id) {
    try {
      const [rows] = await db.query("SELECT * FROM Thread WHERE group_id = ?", [
        group_id,
      ]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  async update() {
    try {
      const [rows] = await db.query(
        "UPDATE Thread SET group_id = ?, title = ?, content_id = ? WHERE id = ?",
        [this.group_id, this.title, this.content_id, this.id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  async delete() {
    try {
      const [rows] = await db.query("DELETE FROM Thread WHERE id = ?", [
        this.id,
      ]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = Thread;
