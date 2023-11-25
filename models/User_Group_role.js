const db = require("../database");

class User_Group_role {
  constructor(id, user_id, group_id, role) {
    (this.id = id), (this.user_id = user_id);
    this.group_id = group_id;
    this.role = role;
  }

  async save() {
    try {
      if (this.id) {
        return this.update();
      }
      const [rows] = await db.execute(
        "INSERT INTO User_Group_role (user_id, group_id, role) VALUES (?, ?, ?)",
        [this.user_id, this.group_id, this.role],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getByUserId(user_id) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM User_Group_role WHERE user_id = ?",
        [user_id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getGroupMembers(group_id) {
    try {
      const query = `
      SELECT ugr.user_id, ugr.group_id, ugr.role, ru.username, ru.path_to_avatar, ru.visibility, ru.is_admin
      FROM User_Group_role ugr
      INNER JOIN Registered_user ru ON ugr.user_id = ru.id
      WHERE ugr.group_id = ?
      ORDER BY ugr.role ASC
    `;
      const [rows] = await db.execute(query, [group_id]);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async isUserGroupOwner(user_id, group_id) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM User_Group_role WHERE user_id = ? and group_id = ? and role = 2",
        [user_id, group_id],
      );
      return rows.length == 1 ? rows[0] : null;
    } catch (err) {
      console.log(err);
    }
  }

  static async isUserGroupMember(user_id, group_id) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM User_Group_role WHERE user_id = ? and group_id = ?",
        [user_id, group_id],
      );
      return rows.length == 1 ? rows[0] : null;
    } catch (err) {
      console.log(err);
    }
  }

  static async getGroupOwner(group_id) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM User_Group_role WHERE group_id = ? and role = 2",
        [group_id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getByUserIdAndGroupId(user_id, group_id) {
    if(!user_id || !group_id) return null;
    try {
      const [rows] = await db.execute(
        "SELECT * FROM User_Group_role WHERE user_id = ? and group_id = ?",
        [user_id, group_id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async hand_over_ownership(user_id, group_id) {
    try {
      const current_owner = await this.getGroupOwner(group_id);
      db.execute("UPDATE User_Group_role SET role = 1 WHERE id = ?", [
        current_owner[0].id,
      ]);
      db.execute(
        "UPDATE User_Group_role SET role = 2 WHERE user_id = ? and group_id = ?",
        [user_id, group_id],
      );
    } catch (err) {
      console.log(err);
    }
  }

  static async getNonMembers(user_name, group_id) {
    try {
      const query = `
      SELECT ru.id, ru.username, ru.path_to_avatar, ru.visibility, ru.is_admin
      FROM Registered_user ru
      WHERE ru.username LIKE ? AND ru.id NOT IN (SELECT user_id FROM User_Group_role WHERE group_id = ?)
    `;
      const [rows] = await db.execute(query, [`%${user_name}%`, group_id]);
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
      const [rows] = await db.execute(
        "SELECT * FROM User_Group_role WHERE id = ?",
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
        "UPDATE User_Group_role SET user_id = ?, group_id = ?, role = ? WHERE id = ?",
        [this.user_id, this.group_id, this.role, this.id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  async delete() {
    try {
      const [rows] = await db.execute(
        "DELETE FROM User_Group_role WHERE id = ?",
        [this.id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = User_Group_role;
