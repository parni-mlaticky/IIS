const db = require("../database");

class Thread {
  constructor(id, group_id, content_id) {
    this.id = id;
    this.group_id = group_id;
    this.content_id = content_id;
  }

  async save() {
    try {
      const [rows] = await db.query(
        "INSERT INTO Thread (id, group_id, content_id) VALUES (?, ?, ?)",
        [this.name, this.description, this.picture_path, this.visibility],
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
        "UPDATE Thread SET group_id = ?, content_id = ? WHERE id = ?",
        [this.group_id, this.content_id, this.id],
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
