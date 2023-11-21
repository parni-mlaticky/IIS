const db = require("../database");

class Group {
  constructor(name, description, picture_path, visibility) {
    this.name = name;
    this.description = description;
    this.picture_path = picture_path;
    this.visibility = visibility;
  }
  async save() {
    try {
      const [rows] = await db.query(
        "INSERT INTO `Group` (name, description, picture_path, visibility) VALUES (?, ?, ?, ?)",
        [this.name, this.description, this.picture_path, this.visibility],
      );
      return rows;
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

  async update() {
    try {
      const [rows] = await db.query(
        "UPDATE `Group` SET name = ?, description = ?, picture_path = ?, visibility = ? WHERE id = ?",
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
