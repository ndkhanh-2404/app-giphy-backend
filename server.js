const express = require('express');
const mongoose = require('mongoose');
const body_parser = require('body-parser');
const passport =  require('passport');
const users = require("./routes/api/user");
const { use } = require('passport');
const { log } = console;

// App Config
const port = process.env.PORT || 8001;
const app = express();
const db_url = require('./config/keys').databaseURL;

// Bodyparser middleware
app.use(
    body_parser.urlencoded({
        extended: false
    })
);
app.use(body_parser.json());


// Database Config
mongoose.connect(db_url,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true
}).then(() => log('Successfully connected to Database!'))
.catch(err => {
    console.log(err);
    console.log("Connect failed");
});

// Passport config
require("./config/passport")(passport);

// Passport middleware
app.use(passport.initialize());

//API Endpoints
app.get('/',(req,res)=> res.status(200).send("Welcome to GIPHY API!!!"));
app.use('/api/users',users);

// Listener
app.listen(port,() => console.log(`Server up and running on localhost: ${port}.`));