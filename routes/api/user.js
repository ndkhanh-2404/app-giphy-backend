const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt =  require('bcryptjs');
const passport = require('passport');
const auth = require("../auth");
const { log } = console;
// Validation
const registerValidation = require('../../validation/register');
const loginValidation = require('../../validation/login');

//User model
const User = require('../../models/User');
const keys = require('../../config/keys');

// router POST api/users/register
//Register users
router.post("/register",async (req,res) =>{
    // lets validate the data before we a user
    const { errors, isValid } = registerValidation(req.body);
    if(!isValid){
        return res.status(400).json(errors);
    }

    //Checking if the user is already in the database
    const userExist = await User.findOne({username: req.body.username});
    if(userExist){
        return res.status(400).json({ username: "Username already exists" });
    }

    User.findOne({ username: req.body.username }).then(user => {
        if (user) {
          return res.status(400).json({ username: "Username already exists" });
        } else {
          const newUser = new User({
            username: req.body.username,
            password: req.body.password
          });
    
          // Hash password before saving in database
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser
                .save()
                .then(user => res.json(user))
                .catch(err => console.log(err));
            });
          });
        }
    });
});

router.post('/login',(req,res)=>{
    // Login Validation
    const { errors, isValid } = loginValidation(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }

    User.findOne({username:req.body.username}).then(user =>{
        if(!user){
            return res.status(404).json({ usernotfound: "User not found."});
        }

        const password = req.body.password;
        //Check password
        bcrypt.compare(password,user.password).then(isMatch =>{
            if(isMatch){
                //User matched
                //Create JWT Payload
                const payload = {
                    id: user._id,
                    username: user.username
                };

                //Sign token
                jwt.sign(
                    payload,
                    keys.secretOrKey,
                    {
                        expiresIn: 3600
                    },
                    (err,token) =>{
                        res.json({
                            username: user.username,
                            isAuthenticated: true,
                            token: "Bearer " + token
                        });
                    }
                );
            }
            else{
                return res
                    .status(400)
                    .json({ passwordincorrect: "Password incorrect" });
            }
        });
        //res.send(res.json(user));
    });
});

router.get('/user', auth.required, function (req, res, next) {
    User.findById(req.payload.id)
        .then(function (user) {
            if (!user) { 
                return res.sendStatus(401); 
            }
            return res.json({ success: true, user });
    }).catch(next);
});
  
router.put('/user', auth.required, function (req, res, next) {
    User.findById(req.payload.id)
        .then(function (user) {
            if (!user) { 
                return res.sendStatus(401); 
            }
            log(user);
            let favorites = user.favorites || [];
            if (favorites.includes(req.body.favorite)) {
                return res.json({ 
                    success: false, 
                    message: "Đã có trong danh sách yêu thích của bạn!" 
                });
            }
            // only update fields 
            if (typeof req.body.favorite !== 'undefined') {
                favorites = [...favorites, req.body.favorite];
                user.favorites = favorites;
            }
                return user.save().then(function () {
                    return res.json({ success: true, user });
            });
        }).catch(next);
});

router.delete('/user', auth.required, function (req, res, next) {
    User.findById(req.payload.id)
        .then(function (user) {
            if (!user) { 
                return res.sendStatus(401); 
            }
            log(user);

            let favorites = user.favorites;
            
            if (favorites.includes(req.body.favorite)) {
                return res.json({ 
                    success: false, 
                    message: "Đã có trong danh sách yêu thích của bạn!" 
                });
            }
            // only update fields 
            if (typeof req.body.favorite !== 'undefined') {
                favorites = [...favorites, req.body.favorite];
                user.favorites = favorites;
            }
                return user.save().then(function () {
                    return res.json({ success: true, user });
            });
        }).catch(next);
});


module.exports = router;
