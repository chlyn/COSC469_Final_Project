// -------------------------------------------------------------------------------------------------------------------------------
// SERVER SETUP //

// Importing required packages
const express = require("express");                                       // Express builds the web server (allows you to create routes, handle requests/responses, server webpages)
const bcrypt = require("bcrypt");                                         // Bcrypt securely hash passwords
const nodemailer = require("nodemailer");                                 // Nodemailer allows you to send emails from your server
const open = (...args) => import("open").then((m) => m.default(...args)); // Open automatically opens the browser when the server starts
const path = require("path");                                             // Node's path module builds file paths accross the os

// Loading environment variables from the .env file
require("dotenv").config();                                            

// Variables
const app = express();                                                    // Creates the express server instance
const PORT = process.env.PORT || 3000;                                    // The port the server runs on

// Configuring middleware
app.use(express.urlencoded({ extended: true }));                          // Allows express to read HTML form data (EX: req.body.username)
app.use(express.static(path.join(__dirname, "public")));                  // Allows express to serve frontend files (html, css, js)
app.use(express.json());                                                  // Allows express to read JSON request bodies (EX: fetching /api/login)

// Sequelize database connection and models
const { sequelize, User, PasswordResetCode } = require("./models");       // Importing the Sequelize instance from the models folder (already configured using config.js and .env)

// Testing the connection to the MySQL database
sequelize.authenticate()
  .then(() => console.log("Database connected"))
  .catch(err => console.error("DB Error:", err));

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});



// -------------------------------------------------------------------------------------------------------------------------------
// CREATE ACCOUNT //

app.post("/api/create-account", async (req, res) => {

  try {
    
    // Pulling the submitted form data from the request body
    const { firstname, lastname, email, password, major, minor } = req.body;

    // Checking if all required fields are present, else send missing error
    if (!firstname || !lastname || !email || !password || !major) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    // Checking if the email already exists in the database
    const existingUser = await User.findOne({ where: { email } });

    // If email already exists, then send duplicate error
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: "This email is already taken. Please try another one.",
      });
    }

    // Hashing the password
    const password_hash = await bcrypt.hash(password, 10);

    // Creating the user in the database
    const user = await User.create({
      firstname,
      lastname,
      email,
      password_hash,
      major,
      minor: minor || null,
    });

    // Sending a success response
    return res.json({
      ok: true,
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
      },
    });

  } catch (err) {

    // If unknown error happens, then send default system error
    console.error(err);
    return res.status(500).json({ ok: false, message: "System error, please try again" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// LOGIN //

app.post("/api/login", async (req, res) => {

  try {

    // Pulling the submitted login credentials from the request body
    const { email, password } = req.body;

    // Checking if all required fields are present
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    // Querying the database to check if user exists
    const user = await User.findOne({
      where: { email },
      attributes: ["id", "firstname", "lastname", "email", "password_hash"],
    });

    // If user does not exist, then send invalid login error
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    // Comparing if password matches stored hashed password
    const ok = await bcrypt.compare(password, user.password_hash);

    // If password does not match, then send invalid login error
    if (!ok) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    // Sending a success response
    return res.json({
      ok: true,
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
      },
    });

  } catch (err) {

    // If unknown error happens, then send default system error
    console.error(err);
    return res.status(500).json({ ok: false, message: "System error, please try again" });
    
  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// FORGOT PASSWORD //

app.post("/api/forgot-password", async (req, res) => {

  try {

    // Pulling the submitted email from the request body
    const { email } = req.body;

    // Checking if email is present, else send missing error
    if (!email) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    // Checking if email is valid, else send invalid email error
    if (!email.includes("@")) {
      return res.status(400).json({
        ok: false,
        message: "Invalid email. Please include an '@' in your email address",
      });
    }

    // Querying the database to check if email exists
    const user = await User.findOne({
      where: { email },
      attributes: ["id", "firstname", "lastname", "email"],
    });

    // If email exists, then do the following...
    if (user) {

      // Creating a 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Hashing the code
      const code_hash = await bcrypt.hash(code, 10);

      // Setting the code expiration time to 10 minutes
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Deleting old codes from the database
      await PasswordResetCode.destroy({
        where: { email },
      });

      // Saving the new code into the database
      await PasswordResetCode.create({
        email,
        code_hash,
        expires_at: expiresAt,
      });

      // Sending the email with verification code to the user
      await transporter.sendMail({
        from: `"Account Form Team" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Your password verification code",
        text: `Hi ${user.firstname}, we received a request to reset the password for the account associated with this email address. Your verification code is: ${code}. This code expires in 10 minutes. If you did not request a password reset, you can safely ignore this email. Best regards, the Account Form Team.`,
        html: `
          <div style="font-family:'Open Sans',Arial,sans-serif;">
            <div style="max-width:520px; width:100%; background:#ffffff; border:1px solid #e6dbf9; border-radius:12px; overflow:hidden;">
              
              <div style="background:#874fce; color:#ffffff; text-align:center; padding:16px; font-size:20px; font-weight:700;">
                Password Reset Verification Code
              </div>

              <div style="padding:24px; color:#6b7280; font-size:16px; line-height:1.6;">
                <p>Hi ${user.firstname},</p>
                <p>We received a request to reset the password for the account associated with this email address.</p>
                <p>Your verification code is:</p>

                <p style="font-weight:700; text-align:center; font-size:28px; letter-spacing:4px; color:#1f1d2b; margin:24px 0;">
                  ${code}
                </p>

                <p><i>This code expires in 10 minutes.</i></p>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
                <p>Best regards,<br>
                Account Form Team</p>
              </div>

            </div>
          </div>
        `,
      });

    }

    // Do not reveal whether the email exists or not
    return res.json({ ok: true });

  } catch (err) {

    // If unknown error happens, then send default system error
    console.error(err);
    return res.status(500).json({ ok: false, message: "System error, please try again" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// VERIFICATION //

app.post("/api/verification", async (req, res) => {

  try {

    // Pulling the submitted code and email from the request body
    const { code, email } = req.body;

    // Checking if all required fields are present, else send missing error
    if (!code || !email) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    // Checking if code only contains numbers, else send numbers only error
    if (!/^\d+$/.test(code)) {
      return res.status(400).json({ ok: false, message: "Code must contain numbers only" });
    }

    // Querying the database to check if code exists
    const resetRow = await PasswordResetCode.findOne({
      where: { email },
      attributes: ["email", "code_hash", "expires_at"],
    });

    // If code does not exist, then send invalid code error
    if (!resetRow) {
      return res.status(401).json({ ok: false, message: "Invalid code. Try again." });
    }

    // Checking if code expired, else send expired error
    if (new Date(resetRow.expires_at) < new Date()) {
      return res.status(401).json({
        ok: false,
        message: "Your code has expired. Please request a new one.",
      });
    }

    // Comparing submitted code with the hashed version
    const isMatch = await bcrypt.compare(code, resetRow.code_hash);

    // If code does not match, then send invalid code error
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: "Invalid code. Try again." });
    }

    // If code is correct, then proceed to password reset process
    return res.json({ ok: true });

  } catch (err) {

    // If unknown error happens, then send default system error
    console.error(err);
    return res.status(500).json({ ok: false, message: "System error, please try again" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// NEW PASSWORD //

app.post("/api/new-password", async (req, res) => {

  try {

    // Pulling the submitted email, new password, and confirm password from the request body
    const { email, newPassword, confirmPassword } = req.body;

    // Checking if all required fields are present, else send missing error
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    // Checking if new and confirm passwords match, else send mismatch error
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        ok: false,
        message: "New password and confirm password do not match",
      });
    }

    // Querying the database to check if user exists
    const user = await User.findOne({
      where: { email },
      attributes: ["id", "password_hash"],
    });

    // If user does not exist, then send default system error
    if (!user) {
      return res.status(400).json({ ok: false, message: "System error, please try again" });
    }

    // Checking if new password is the same previously used password
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);

    // If same old password, then send same old password error
    if (isSamePassword) {
      return res.status(400).json({
        ok: false,
        message: "Please choose a password you haven't used before",
      });
    }

    // Hashing the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Updating the user's password in the database
    await User.update(
      { password_hash: newPasswordHash },
      { where: { email } }
    );

    // Deleting verification code from the database
    await PasswordResetCode.destroy({
      where: { email },
    });

    // Sending success response
    return res.json({ ok: true });

  } catch (err) {

    // If unknown error happens, then send default system error
    console.error(err);
    return res.status(500).json({ ok: false, message: "System error, please try again" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// PAGE ROUTES //

// Root route "/" redirects users to login route
app.get("/", (req, res) => {
  return res.redirect("/login");
});

// Login route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Create account route
app.get("/create-account", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Homepage route
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Forgot password route
app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Verification route
app.get("/verification", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// New password route
app.get("/new-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});



// -------------------------------------------------------------------------------------------------------------------------------
// START SERVER //

app.listen(PORT, async () => {

  const url = `http://localhost:${PORT}`;     // Creating server URL
  console.log(`Server running on ${url}`);    // Confirming when the server starts in to terminal
  
  // Preventing the server to open browser multiple times
  // Opening browser only when environment variables does not exist
  if (!process.env.__BROWSER_OPENED) {
    process.env.__BROWSER_OPENED = "true";
    await open(url);
  }

});