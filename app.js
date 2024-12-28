const path = require("node:path");
const express = require('express');
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const pool = require("./db/pool")

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));

/** 
 *  --------- DATABASE -------------
 */

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

app.use(passport.session());

app.get("/", (req, res) => {
    res.render("index", {user: req.user});
})

app.get("/login", (req, res) => {
    res.render("Login")
});


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


app.post(
    "/login",
    passport.authenticate("local", {
      failureRedirect: "/login",
      successRedirect: "/",
    }),
    (err, req, res, next) => {
      if (err) next(err);
    }
  );

app.get("/register", (req, res) => {
    res.render("Register")
});

app.post("/register", async (req, res, next) => {
    const saltHash = genPassword(req.body.password);
    const salt = saltHash.salt;
    const hash = saltHash.hash;
    try {
      await pool.query("INSERT INTO users (username, salt, hash) VALUES ($1, $2, $3)", [
        req.body.username,
        salt,
        hash
      ]);
      res.redirect("/login");
    } catch(err) {
        console.error("Error saving user:", err);
        res.status(500).send("Internal Server Error");
    }
  });

  app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });
app.listen(3000);
