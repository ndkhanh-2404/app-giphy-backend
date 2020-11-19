const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const passportConfig = require("../../config/passport");
// const auth = require("../auth");
const { log } = console;
// Validation
const registerValidation = require("../../validation/register");
const loginValidation = require("../../validation/login");

//User model
const User = require("../../models/User");
const keys = require("../../config/keys");

//create sign token
const signToken = (userID) => {
  return jwt.sign(
    {
      iss: "KeiTCoder",
      sub: userID,
    },
    "KeiTCoder",
    { expiresIn: "1h" }
  );
};

// router POST api/users/register
//Register users
router.post("/register", async (req, res) => {
  // lets validate the data before we a user
  const { errors, isValid } = registerValidation(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  //Checking if the user is already in the database
  const userExist = await User.findOne({ username: req.body.username });
  if (userExist) {
    return res.status(400).json({ username: "Username already exists" });
  }

  User.findOne({ username: req.body.username }).then((user) => {
    if (user) {
      return res.status(400).json({ username: "Username already exists" });
    } else {
      const newUser = new User({
        username: req.body.username,
        password: req.body.password,
      });

      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then((user) => res.json(user))
            .catch((err) => console.log(err));
        });
      });
    }
  });
});

//router POST api/users/login
//Login users
router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  (req, res) => {
    if (req.isAuthenticated()) {
      const { _id, username } = req.user;
      const token = signToken(_id);
      res.cookie("access_token", token, { httpOnly: true, sameSite: true });
      res.status(200).json({
        isAuthenticated: true,
        user: { _id, username },
        token: "Bearer " + token,
      });
    }
  }
);

//router POST api/users/logout
//Logout users
router.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.clearCookie("access_token");
    res.json({ user: { id: "", username: "" }, success: true });
  }
);

// Favourites list of user
router.get(
  "/user",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    User.findById(req.user._id)
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
  }
);

// Add favourite to user favourites list
router.put(
  "/user",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    User.findById(req.user._id)
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
          return res.json({ success: true, user });
        });
      })
      .catch(next);
  }
);

// Delete favorite from user favorite list
router.delete(
  "/user",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    User.findById(req.user._id)
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
          return res.json({ success: true, user });
        });
      })
      .catch(next);
  }
);

// User is authenticated
router.get(
  "/authenticated",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { _id, username } = req.user;
    res.status(200).json({ isAuthenticated: true, user: { _id, username } });
  }
);

module.exports = router;
