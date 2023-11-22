const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "iis",
  password: process.env.DB_PASS || "negr",
  database: process.env.DB_NAME || "iis",
  waitForConnections: true,
});

console.log(process.env.DB_HOST);

module.exports = pool;
