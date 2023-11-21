const mysql = require("mysql12/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "fit_social_network",
  waitForConnections: true,
});

module.exports = pool;
