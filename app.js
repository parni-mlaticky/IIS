const express = require("express");
const app = express();
const routes = require("./routes");
const methodOverride = require("method-override");
require("dotenv").config();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));

app.use("/", routes);

app.use((req, res, next) => {
  next(new Error("Page not found"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
