const router = require("express").Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const utils = require("../../utils/utils.js");
const { log } = console;
const keys = require("../../config/keys");
// Validation
const registerValidation = require("../../validation/register");
const loginValidation = require("../../validation/login");

//User model
const User = require("../../models/User");

// router POST api/users/register
//Register users
router.post("/register", (req, res) => {
  const { errors, isValid } = registerValidation(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const { username, password } = req.body;
  User.findOne({ username }, (err, user) => {
    if (err)
      res.status(500).json({ error: "Error has occured", success: false });
    if (user)
      res
        .status(400)
        .json({ error: "Username is already taken", success: false });
    else {
      const newUser = new User({ username, password });
      newUser.save((err) => {
        if (err)
          res.status(500).json({ error: "Error has occured", success: false });
        else res.status(201).json({ user: newUser, success: true });
      });
    }
  });
});

//router POST api/users/login
//Login users
router.post("/login", (req, res) => {
  // Form validation

  const { errors, isValid } = loginValidation(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const username = req.body.username;
  const password = req.body.password;

  // Find user by email
  User.findOne({ username }).then((user) => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ usernamenotfound: "Username not found" });
    }

    // Check password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          username: user.username,
          //favorites: user.favorites,
        };

        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 3600, // 1 h in seconds
          },
          (err, token) => {
            res.json({
              user: payload,
              isAuthenticated: true,
              token: token,
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

const TokenCheckMiddleware = async (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["x-access-token"];
  if (token) {
    try {
      const decoded = await utils.verifyJwtToken(token, keys.secretOrKey);
      req.decoded = decoded;
      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({
        message: "Unauthorized access.",
      });
    }
  } else {
    console.log("null");
    return res.status(403).send({
      message: "No token provided.",
    });
  }
};

router.use(TokenCheckMiddleware);

router.post("/checkToken", (req, res) => {
  return res.json(req.decoded);
});

// Favourites list of user
router.post("/user", (req, res, next) => {
  User.findById(req.decoded.id)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ usernotfound: "User not found" });
      } else {
        return res
          .status(200)
          .json({ favorites: user.favorites, success: true });
      }
    })
    .catch(next);
});

// Add favourite to user favourites list
router.post("/user/add", (req, res, next) => {
  User.findById(req.decoded.id)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ usernotfound: "User not found" });
      }
      let favorites = user.favorites || [];
      if (favorites.includes(req.body.favorite)) {
        return res.json({
          success: false,
          message: "Đã có trong danh sách yêu thích của bạn!",
        });
      }
      // only update fields
      if (typeof req.body.favorite !== "undefined") {
        favorites = [...favorites, req.body.favorite];
        user.favorites = favorites;
      }
      return user.save().then(function () {
        return res.json({ success: true, favorites: user.favorites });
      });
    })
    .catch(next);
});

// // Delete favorite from user favorite list
router.post("/user/delete", (req, res, next) => {
  User.findById(req.decoded.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }

      let favorites = user.favorites;

      if (!favorites.includes(req.body.favorite)) {
        return res.json({
          success: false,
          message: "Bạn chưa thích Giphy này!!!",
        });
      }
      // only update fields
      if (typeof req.body.favorite !== "undefined") {
        const new_favorites = favorites.filter(
          (item) => item !== req.body.favorite
        );
        user.favorites = new_favorites;
      }
      return user.save().then(function () {
        return res.json({ success: true, favorites: user.favorites });
      });
    })
    .catch(next);
});

module.exports = router;
