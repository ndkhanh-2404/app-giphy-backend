const express = require("express");
const mongoose = require("mongoose");
const body_parser = require("body-parser");
const cookieParser = require("cookie-parser");
const users = require("./routes/api/user");
const { log } = console;
const Cors = require("cors");
const passport = require("passport");

// App Config
const port = process.env.PORT || 8001;
const app = express();
const db_url = require("./config/keys").databaseURL;
app.use(Cors({ credentials: true }));
app.use(cookieParser());

// Bodyparser middleware
app.use(
  body_parser.urlencoded({
    extended: false,
  })
);
app.use(body_parser.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type, Authorization"
  );
  next();
});

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

// Database Config
mongoose
  .connect(db_url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => log("Successfully connected to Database!"))
  .catch((err) => {
    console.log(err);
    console.log("Connect failed");
  });

//API Endpoints
app.get("/", (req, res) => res.status(200).send("Welcome to GIPHY API!!!"));
app.use("/api/users", users);

// Listener
app.listen(port, () =>
  console.log(`Server up and running on localhost: ${port}.`)
);
