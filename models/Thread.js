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
