const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Sequelize = require('sequelize');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = new Sequelize('test','root','',{
    host: 'localhost',
    dialect: 'mysql'
});

const COOKIE_SECRET = 'cookie secret';

const User = db.define('user', {
    firstname : { type: Sequelize.STRING } ,
    lastname : { type: Sequelize.STRING } ,
    email : { type: Sequelize.STRING } ,
    password : { type: Sequelize.STRING }
});

const Article = db.define('article', {
    title: { type: Sequelize.STRING },
    content: { type: Sequelize.STRING },

});

db.sync().then(r => {
    console.log("DB SYNCED");
}).catch(e => {
    console.error(e);
});

const Vote = db.define('vote', {
    action: {
        type: Sequelize.ENUM('up', 'down')
    }
});

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded());

passport.use(new LocalStrategy((email, password, done) => {
    User
        .findOne({
            where: {email, password}
        }).then(function (user) {
            if (user) {
                return done(null, user)
            } else {
                return done(null, false, {
                    message: 'Invalid credentials'
                });
            }
    })
    // If an error occured, report it
        .catch(done);
}));

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


app.use(cookieParser(COOKIE_SECRET));

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

app.get('/',(req,res) => {
    Article
        .sync()
        .then(() => {
            Article
                .findAll({include:[Vote ]})
                .then((articles) => {
                    res.render( 'truc', { articles, user : req.user});
                })
    })

});

app.get('/article',(req,res) => {
    res.render('article');
});

app.post('/article', (req, res) => {
    const { title, content } = req.body;
    Article
        .sync()
        .then(() => Article.create({ title, content }))
        .then(() => res.redirect('/'));
});

app.post('/article/:articleId/upvote', (req, res) => {
    Vote
        .sync()
        .then(() => Vote.create({ action: 'up', articleId: req.params.articleId }))
        .then(()=> res.redirect('/'));
});

app.post('/article/:articleId/downvote', (req, res) => {
    Vote
        .sync()
        .then(() => Vote.create({ action: 'down', articleId: req.params.articleId }))
        .then(()=> res.redirect('/'));
});

app.get('/', (req, res) => {
    // Render the home page by providing the logged-in user, if any
    res.render('truc', { user: req.user });
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

app.get('/auth',(req,res) => {
    res.render('in');
});

app.post('/auth', (req, res) => {
    const { firstname, lastname, email, password } = req.body;
    User
        .sync()
        .then(() => User.create({ firstname, lastname, email, password  }))
        .then(() => res.redirect('/'));
});

Article.hasMany(Vote);
Vote.belongsTo(Article);

app.listen(3000);