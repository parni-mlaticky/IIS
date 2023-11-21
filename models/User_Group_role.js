const db = require("../database");

class User_Group_role {
  constructor(id, user_id, group_id, role) {
    this.id = id;
    this.user_id = user_id;
    this.group_id = group_id;
    this.role = role;
  }

  async save() {
    try {
      const [rows] = await db.execute(
        "INSERT INTO User_Group_role (user_id, group_id, role) VALUES (?, ?, ?)",
        [
          this.user_id,
          this.group_id,
          this.role
        ],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getAll() {
    try {
      const [rows] = await db.execute("SELECT * FROM User_Group_role");
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.execute("SELECT * FROM User_Group_role WHERE id = ?", [id]);
      return rows[0];
    } catch (err) {
      console.log(err);
    }
  }

  async update() {
    try {
      const [rows] = await db.execute(
        "UPDATE User_Group_role SET user_id = ?, groupd_id = ?, role = ?, WHERE id = ?",
        [
          this.user_id,
          this.group_id,
          this.role,
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
      const [rows] = await db.execute("DELETE FROM User_Group_role WHERE id = ?", [
        this.id,
      ]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = User_Group_role;
