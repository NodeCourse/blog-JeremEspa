const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// This secret will be used to sign and encrypt cookies
const COOKIE_SECRET = 'cookie secret';

// In a real-world application users would be fetched
// from a database but for the sake of simplicity,
// this example considers only a single user.
const User = db.define('user', {
    firstname : { type: sequelize.STRING } ,
    lastname : { type: sequelize.STRING } ,
    email : { type: sequelize.STRING } ,
    password : { type: sequelize.STRING }
});

passport.use(new LocalStrategy((email, password, done) => {
    User
        .findOne({
            where: {email}
        }).then(function (user) {
        bcrypt.compare(password, user.password).then(r => {
            if (r) {
                return done(null, user)
            } else {
                return done(null, false, {
                    message: 'Invalid credentials'
                });
            }
        });
    })
    // If an error occured, report it
        .catch(done);
}));
    // Compare the passwords


// Save the user's email address in the cookie
passport.serializeUser((user, cookieBuilder) => {
    cookieBuilder(null, user.email);
});

passport.deserializeUser((email, cb) => {
    console.log("AUTH ATTEMPT",email);
    // Fetch the user record corresponding to the provided email address
    User.findOne({
        where : { email }
    }).then(r => {
        if(r) return cb(null, r);
        else return cb(new Error("No user corresponding to the cookie's email address"));
    });
});



// Create an Express application
const app = express();

// Use Pug for the views
app.set('view engine', 'pug');

// Parse cookies so they're attached to the request as
// request.cookies
app.use(cookieParser(COOKIE_SECRET));

// Parse form data content so it's available as an object through
// request.body
app.use(bodyParser.urlencoded({ extended: true }));

// Keep track of user sessions
app.use(session({
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Initialize passport, it must come after Express' session() middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    // Render the home page by providing the logged-in user, if any
    res.render('home', { user: req.user });
});

app.get('/login', (req, res) => {
    // Render the login page
    res.render('login');
});

app.post('/login',
    // Authenticate user when the login form is submitted
    passport.authenticate('local', {
        // If authentication succeeded, redirect to the home page
        successRedirect: '/',
        // If authentication failed, redirect to the login page
        failureRedirect: '/login'
    })
);

app.listen(3000);