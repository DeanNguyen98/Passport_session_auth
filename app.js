const express = require('express');
const Pool = require("pg");
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

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
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

pool.connect((err) => {
    if (err) {
        console.error("Failed to connect to the database:", err);
    } else {
        console.log("Connected to the PostgreSQL database");
    }
});

/** 
 *  --------------SESSION SETUP
 */

app.use(
    session({
        store: new pgSession({
            pool,
            tableName: "session",
        }),
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    }),
);