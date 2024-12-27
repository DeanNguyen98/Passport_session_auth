const express = require('express');
const {Pool} = require("pg");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

/** 
 *  --------- DATABASE -------------
 */

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
});

pool.connect((err) => {
    if (err) {
        console.error("Failed to connect to the database:", err);
    } else {
        console.log("Connected to the PostgreSQL database:", process.env.DB_DATABASE);
    }
});


/** 
 *  --------------SESSION SETUP ----------------------
 */

const sessionStore = new pgSession({
    pool: pool,
    tableName: "session",
    createTableIfMissing: true,
});


app.use(
    session({
        store: sessionStore,
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    }),
);

// PASSPORT JS SETUP

//validate user password on Login
function validPassword(password, hash, salt) {
    let hashVerify = crypto
        .pbkdf2Sync(password, salt, 10000, 64, "sha512")
        .toString("hex");
    return hash === hashVerify;
}

//


// Generate password salt and hash when registered
function genPassword(password) {
    let salt = crypto.randomBytes(32).toString("hex");
    let genHash = crypto
        .pbkdf2Sync(password, salt, 10000, 64, "sha512")
        .toString("hex");
    return {
        salt: salt,
        hash: genHash
    }
}

//

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const {rows} = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
            const user = rows[0];
            if (!user) {
                return done(null, false, {message: "Incorrect username"})
            }
            const isValid = validPassword(password, user.hash, user.salt);
            if (isValid) {
                return done(null, user);
            } else {
                return done(null, false, {message: "Incorrect password"});
            }
        } catch (err) {
            done(err)
        }
    })
)

passport.serializeUser(function (user, done) {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      const user = rows[0];
  
      done(null, user);
    } catch(err) {
      done(err);
    }
  });

//

/** 
 *  ------------ ROUTES ----------
 */

app.get("/", (req, res) => {
    res.send("<h1>Hello, world </h1>")
})

app.get("/login", (req, res) => {
    res.send("<h1>Login page</h1>")
});

app.post(
    "/login",
    passport.authenticate("local", {failureRedirect: "/login"}),
    (err, req, res, next) => {
        if (err) next(err);
        console.log("You are logged in");
    }
)

app.get("/register", (req, res) => {
    res.send("<h1>Register page </h1>")
});

app.post("register", (req, res) => {})


app.listen(3000);
