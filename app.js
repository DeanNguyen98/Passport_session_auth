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

function validPassword(password, hash, salt) {
    let hashVerify = crypto
        .pbkdf2Sync(password, salt, 10000, 64, "sha512")
        .toString("hex");
    return hash === hashVerify;
}


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

app.post("/login", (req, res) => {});

app.get("/register", (req, res) => {
    res.send("<h1>Register page </h1>")
});

app.post("register", (req, res) => {})


app.listen(3000);
