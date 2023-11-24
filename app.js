const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const routes = require("./routes");
const multer = require("multer");
const path = require("path");
const methodOverride = require("method-override");
const { checkLogin } = require("./middlewares/auth");

require("dotenv").config();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(checkLogin);

app.use("/", routes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
