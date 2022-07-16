const express = require('express'); // import express module
const ejs = require('ejs'); // import ejs module
const path = require('path'); // import path module
const bodyparser = require('body-parser'); // import bodyparser module
const mongoose = require('mongoose'); // import mongoose module
const content = require('./models/blog'); // import models and schema
const user = require('./models/users'); // import user model and schema
const bcrypt = require('bcrypt'); // import bcrypt module
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
const app = express(); // create variable app


// database connection
function dbConnect() {
    const username = 'amuinharniel';
    const password = 'KL99x7CbbTRzmmV'
    const dbConnection = `mongodb+srv://${username}:${password}@blog.vi6xnkk.mongodb.net/blog-post?retryWrites=true&w=majority`;
    return dbConnection;
}

// connect to database
mongoose.connect(dbConnect())
.then(result => console.log())
.catch(err => console.log(err))

app.use(bodyparser.urlencoded({ extended: true })); // use bodyparser
app.set('views', path.join(__dirname, 'views')); // expose views folder
app.set('view engine', 'ejs'); // set engine
app.use(express.static(path.join(__dirname, 'dist'))); //expose dist folder
app.use(express.urlencoded({ extended: true })); // used to get form contents

// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(sessions({
    secret: "thisismysecrctekey",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

// cookie parser middleware
app.use(cookieParser());

// a variable to save a session
var session;

// redirect to homepage
app.get('/', (req, res) => {
    res.redirect('/all-blogs');
})

// all blogs
app.get('/all-blogs', (req, res) => {
    // find all content and render to header.ejs
    content.find().sort({ createdAt: -1 })
    .then(persons => {
        res.render('header', { persons, empty: 'No blogs to show!',  } );
    })
    .catch(err => {
        console.log(err);
    })
})

//user login 
app.get('/user/login', (req, res) => {
    session = req.session;
    res.render('login');
})

// action login post from login form
app.post('/login', (req, res) => {
    class credentials {
        constructor(username, password) {
            this.username = username;
            this.password = password;
        }
    }
    const credLoginAccount = new credentials(req.body.username, req.body.password)// get all post content from login form

    // this function will check if given password match the hash password
    function checkIfValid(plainPass, hashPass) {
        const check = bcrypt.compareSync(plainPass, hashPass); // compare sent password to DB password
        return check; // return if true or false
    }

    user.find({}, credentials.username) // find username on the database
    .then(result => {
        const user = result; // array result
        const hashPass = user[0].password; // get the object and get the hash password from DB

        if(checkIfValid(credLoginAccount.password, hashPass)) { // true || false
            session = req.session;
            session.userid = credLoginAccount.username;
            const sess = req.session.userid;
            res.redirect('/all-blogs')  
        } else {
            res.redirect('/user/login')
        } 
             // if false
    })
    .catch(err => console.log(err))
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

app.get('/about', (req, res) => {
    res.render('about');
})

app.get('/create', (req, res) => {
    res.render('create')
})

app.post('/add-blog', (req, res) => {
    const newBlog = new content(req.body);
    newBlog.save()
    .then(result => {
        res.redirect('/')
    })
    .catch(err => console.log(err))
})

let requestSession = '';

app.use((req, res, next) => {
    const session = req.session;
    requestSession = session.userid
    next();
})

app.get('/details/:id', (req, res) => {
    const id = req.params.id;
    content.findById(id)
    .then(result => {
        res.render('details', { blog: result, access: requestSession })
    })
    .catch(err => {
        console.log(err)
    })
})

app.delete('/details/:id', (req, res) => {
    const id = req.params.id;
    content.findByIdAndDelete(id)
    .then(result => {
        res.json({redirect: '/'})
    })
    .catch(err => console.error(err))
})

app.use((req, res) => {
    res.render('404')
})

app.listen(process.env.PORT || 3000, () => console.log('Listening...')); // listening port