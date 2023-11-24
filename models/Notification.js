const db = require("../database");
const { NotificationType } = require("../constants");

class Notification {
  constructor(
    id,
    group_id,
    applicant_id,
    recipient_id,
    notification_type,
    message,
  ) {
    this.id = id;
    this.group_id = group_id;
    this.applicant_id = applicant_id;
    this.recipient_id = recipient_id;
    this.notification_type = notification_type;
    this.message = message;
  }

  async save() {
    try {
      const [rows] = await db.execute(
        "INSERT INTO Notification(group_id, applicant_id, recipient_id, notification_type, message) VALUES (?, ?, ?, ?, ?)",
        [
          this.group_id,
          this.applicant_id,
          this.recipient_id,
          this.notification_type,
          this.message,
        ],
      );
      return rows.insertId;
    } catch (err) {
      console.log(err);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM Notification WHERE id = ?",
        [id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getByUserIdAndGroupId(user_id, group_id) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM Notification WHERE applicant_id = ? AND group_id = ?",
        [user_id, group_id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  static async getByRecipientId(recipient_id) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM Notification WHERE recipient_id = ?",
        [recipient_id],
      );
      return rows;
    } catch (err) {
      console.log(err);
    }
  }

  async delete() {
    try {
      await db.execute("DELETE FROM Notification WHERE id = ?", [this.id]);
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = Notification;
