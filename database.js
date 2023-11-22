const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "iis",
  password: process.env.DB_PASS || "secret",
  database: process.env.DB_NAME || "iis",
  waitForConnections: true,
});

module.exports = pool;
