const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "iis",
  password: process.env.DB_PASS || "secret",
  database: process.env.DB_NAME || "iis",
  waitForConnections: true,
  charset: "utf8_general_ci",
});

console.log(process.env.DB_HOST);

module.exports = pool;
