Passport Session-Based Authentication App

##Overview

This is a simple web application implementing session-based authentication using Passport.js. The application allows users to register, log in, and access a main page after successful authentication. User data is stored in a PostgreSQL database.

##Features

User Registration: Create a new account by providing a username and password.

User Login: Authenticate with your credentials to access protected content.

Session Management: Maintain user sessions using Passport.js and session cookies.

Protected Route: Ensure only authenticated users can access the main page.

Logout: End the user session securely.

##Technologies Used

Backend: Node.js, Express.js

Authentication: Passport.js with session-based strategy

Database: PostgreSQL

Session Management: express-session

##Prerequisites

Node.js (v18 or later)

PostgreSQL

npm
