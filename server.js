// -------------------------------------------------------------------------------------------------------------------------------
// SERVER SETUP //

// Loading environment variables from the .env file
require("dotenv").config();  

// Importing required packages
const express = require("express");                                       // Express builds the web server (allows you to create routes, handle requests/responses, server webpages)
const bcrypt = require("bcrypt");                                         // Bcrypt securely hash passwords
const nodemailer = require("nodemailer");                                 // Nodemailer allows you to send emails from your server
const open = (...args) => import("open").then((m) => m.default(...args)); // Open automatically opens the browser when the server starts
const path = require("path");                                             // Node's path module builds file paths accross the os
const multer = require("multer");                                         // Multer handles file uploads
const fs = require("fs");                                                 // File system helper
const { Op } = require("sequelize");                                      // Sequelize operators for advanced filters

// Variables
const app = express();                                                    // Creates the express server instance
const PORT = process.env.PORT || 3000;                                    // The port the server runs on
const uploadsDir = path.join(__dirname, "uploads");                       // Directory to store uploaded files

// Create uploads directory if it does not exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuring middleware
app.use(express.urlencoded({ extended: true }));                          // Allows express to read HTML form data (EX: req.body.username)
app.use(express.static(path.join(__dirname, "public")));                  // Allows express to serve frontend files (html, css, js)
app.use(express.json());                                                  // Allows express to read JSON request bodies (EX: fetching /api/login)
app.use("/uploads", express.static(uploadsDir));                          // Allows express to serve uploaded files

// Sequelize database connection and models
const { sequelize, User, PasswordResetCode, Document, DocumentRequest, CareTeamRequest } = require("./models"); // Importing the Sequelize instance from the models folder (already configured using config.js and .env)

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

// Sending SoftCare verification emails
async function sendVerificationEmail({ to, firstname, code, subject, heading, intro, securityNote }) {
  await transporter.sendMail({
    from: `"SoftCare" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text: `Hi ${firstname}, ${intro} Your verification code is: ${code}. This code expires in 10 minutes. ${securityNote} Best regards, SoftCare.`,
    html: `
      <div style="margin:0; padding:32px 16px; background:#F5F5FF; font-family:'Poppins','Open Sans',Arial,sans-serif;">
        <div style="max-width:520px; width:100%; margin:0 auto; background:#ffffff; border:1px solid #DDDDF4; border-radius:16px; overflow:hidden; box-shadow:0 4px 8px rgba(80,80,193,0.12),0 2px 4px rgba(0,0,0,0.08);">
          
          <div style="background:#5050C1; color:#F5F5FF; padding:18px 24px; font-size:20px; font-weight:700; letter-spacing:0;">
            SoftCare
          </div>

          <div style="padding:28px 24px 24px; color:#6B6A80; font-size:15px; line-height:1.6;">
            <h1 style="margin:0 0 12px; color:#19182A; font-size:22px; line-height:1.3; font-weight:700;">
              ${heading}
            </h1>

            <p style="margin:0 0 14px;">Hi ${firstname},</p>
            <p style="margin:0 0 18px;">${intro}</p>
            <p style="margin:0 0 10px; color:#19182A; font-weight:600;">Your verification code is:</p>

            <p style="margin:0 0 20px; padding:18px 20px; border:1px solid #DDDDF4; border-radius:12px; background:#F5F5FF; color:#5050C1; text-align:center; font-size:30px; line-height:1; font-weight:700; letter-spacing:6px;">
              ${code}
            </p>

            <p style="margin:0 0 14px; color:#9A99B2; font-size:14px;">
              This code expires in 10 minutes.
            </p>

            <p style="margin:0 0 20px;">${securityNote}</p>

            <p style="margin:0; color:#19182A;">
              Best regards,<br>
              SoftCare
            </p>
          </div>

        </div>
      </div>
    `,
  });
}

// Allowed upload file types
const allowedUploadTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const allowedUploadExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".dcm", ".dicom"];

function isAllowedUploadFile(file) {
  const extension = path.extname(file.originalname).toLowerCase();

  return allowedUploadTypes.includes(file.mimetype) || allowedUploadExtensions.includes(extension);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (req, file, cb) => {
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueName = `${Date.now()}-${safeOriginalName}`;

    cb(null, uniqueName);
  },
});

// Setting file size limit to 50MB
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedUploadFile(file)) {
      return cb(new Error("Document must be a PDF, JPG, PNG, or DICOM file."));
    }

    cb(null, true);
  },
});



// -------------------------------------------------------------------------------------------------------------------------------
// CREATE ACCOUNT //

app.post("/api/create-account", async (req, res) => {

  try {
    
    // Pulling the submitted form data from the request body
    const { firstname, lastname, email, password, accountType } = req.body;

    // Checking if all required fields are present, else send missing error
    if (!firstname || !lastname || !email || !password || !accountType) {
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
      accountType,
      emailVerified: false,
    });

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

    // Sending account verification email
    await sendVerificationEmail({
      to: email,
      firstname: user.firstname,
      code,
      subject: "Verify your SoftCare account",
      heading: "Verify your account",
      intro: "Welcome to SoftCare. Please verify your email address to finish creating your account.",
      securityNote: "If you did not create a SoftCare account, you can safely ignore this email.",
    });

    // Sending a success response
    return res.json({ ok: true });

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
      attributes: ["id", "firstname", "lastname", "email", "password_hash", "accountType", "emailVerified"],
    });

    // If user does not exist, then send invalid login error
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    // If account email has not been verified, then block login
    if (!user.emailVerified) {
      return res.status(403).json({
        ok: false,
        message: "Please verify your email before logging in.",
      });
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
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        accountType: user.accountType,
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
      await sendVerificationEmail({
        to: email,
        firstname: user.firstname,
        code,
        subject: "Your SoftCare password reset code",
        heading: "Password reset code",
        intro: "We received a request to reset the password for your SoftCare account.",
        securityNote: "If you did not request a password reset, you can safely ignore this email.",
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

    // Pulling the submitted code, email, and verification purpose from the request body
    const { code, email, purpose } = req.body;

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

    // If verifying account creation, mark user as verified and return user data
    if (purpose === "create-account") {
      const user = await User.findOne({
        where: { email },
        attributes: ["id", "firstname", "lastname", "email", "accountType", "emailVerified"],
      });

      if (!user) {
        return res.status(400).json({ ok: false, message: "System error, please try again" });
      }

      await user.update({ emailVerified: true });

      await PasswordResetCode.destroy({
        where: { email },
      });

      return res.json({
        ok: true,
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          accountType: user.accountType,
        },
      });
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
// PROFILE //

function parseMedicalInfo(value) {
  if (!value) return {};

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function buildProfileUser(user) {
  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    accountType: user.accountType,
    medicalInfo: parseMedicalInfo(user.medicalInfo),
  };
}

app.get("/api/profile", async (req, res) => {

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ ok: false, message: "Missing user" });
    }

    const user = await User.findByPk(userId, {
      attributes: ["id", "firstname", "lastname", "email", "accountType", "medicalInfo"],
    });

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    return res.json({ ok: true, user: buildProfileUser(user) });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not load profile" });

  }

});

app.patch("/api/profile", async (req, res) => {

  try {
    const { userId, firstname, lastname, email, medicalInfo = {} } = req.body;

    if (!userId || !firstname || !lastname || !email) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser && existingUser.id !== user.id) {
      return res.status(409).json({ ok: false, message: "This email is already taken." });
    }

    await user.update({
      firstname,
      lastname,
      email,
      medicalInfo: JSON.stringify(medicalInfo),
    });

    return res.json({ ok: true, user: buildProfileUser(user) });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not update profile" });

  }

});

app.post("/api/profile/password-code", async (req, res) => {

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ ok: false, message: "Missing user" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const code_hash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordResetCode.destroy({
      where: { email: user.email },
    });

    await PasswordResetCode.create({
      email: user.email,
      code_hash,
      expires_at: expiresAt,
    });

    await sendVerificationEmail({
      to: user.email,
      firstname: user.firstname,
      code,
      subject: "Your SoftCare profile password code",
      heading: "Confirm password change",
      intro: "Use this verification code to continue changing your SoftCare password.",
      securityNote: "If you did not request this change, please ignore this email.",
    });

    return res.json({ ok: true });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not send verification code" });

  }

});

app.post("/api/profile/password-verify", async (req, res) => {

  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const resetRow = await PasswordResetCode.findOne({
      where: { email: user.email },
      attributes: ["email", "code_hash", "expires_at"],
    });

    if (!resetRow) {
      return res.status(401).json({ ok: false, message: "Invalid code. Try again." });
    }

    if (new Date(resetRow.expires_at) < new Date()) {
      return res.status(401).json({ ok: false, message: "Your code has expired. Please request a new one." });
    }

    const isCodeMatch = await bcrypt.compare(code, resetRow.code_hash);

    if (!isCodeMatch) {
      return res.status(401).json({ ok: false, message: "Invalid code. Try again." });
    }

    return res.json({ ok: true });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not verify code" });

  }

});

app.post("/api/profile/password", async (req, res) => {

  try {
    const { userId, code, newPassword, confirmPassword } = req.body;

    if (!userId || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ ok: false, message: "New password and confirm password do not match" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const resetRow = await PasswordResetCode.findOne({
      where: { email: user.email },
      attributes: ["email", "code_hash", "expires_at"],
    });

    if (!resetRow) {
      return res.status(401).json({ ok: false, message: "Invalid code. Try again." });
    }

    if (new Date(resetRow.expires_at) < new Date()) {
      return res.status(401).json({ ok: false, message: "Your code has expired. Please request a new one." });
    }

    const isCodeMatch = await bcrypt.compare(code, resetRow.code_hash);

    if (!isCodeMatch) {
      return res.status(401).json({ ok: false, message: "Invalid code. Try again." });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);

    if (isSamePassword) {
      return res.status(400).json({ ok: false, message: "Please choose a password you haven't used before" });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await user.update({ password_hash });

    await PasswordResetCode.destroy({
      where: { email: user.email },
    });

    return res.json({ ok: true });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not update password" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// GET PATIENTS //

app.get("/api/patients", async (req, res) => {

  try {
    const { providerId } = req.query;

    if (!providerId) {
      return res.status(400).json({ ok: false, message: "Missing provider" });
    }

    const provider = await User.findByPk(providerId);

    if (!provider || provider.accountType !== "Healthcare Provider") {
      return res.status(403).json({ ok: false, message: "Provider access required" });
    }

    const relationships = await CareTeamRequest.findAll({
      where: {
        providerId,
        status: "approved",
      },
      include: [{
        model: User,
        as: "patient",
        attributes: ["id", "firstname", "lastname", "email", "medicalInfo", "createdAt"],
      }],
      order: [[{ model: User, as: "patient" }, "lastname", "ASC"], [{ model: User, as: "patient" }, "firstname", "ASC"]],
    });

    const patients = relationships.map((relationship) => ({
      ...buildProfileUser(relationship.patient),
      relationshipId: relationship.id,
      createdAt: relationship.patient.createdAt,
    }));

    return res.json({ ok: true, patients });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not load patients" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// GET DOCTORS //

app.get("/api/doctors", async (req, res) => {

  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({ ok: false, message: "Missing patient" });
    }

    const patient = await User.findByPk(patientId);

    if (!patient || patient.accountType !== "Patient") {
      return res.status(403).json({ ok: false, message: "Patient access required" });
    }

    const relationships = await CareTeamRequest.findAll({
      where: {
        patientId,
        status: "approved",
      },
      include: [{
        model: User,
        as: "provider",
        attributes: ["id", "firstname", "lastname", "email", "medicalInfo", "createdAt"],
      }],
      order: [[{ model: User, as: "provider" }, "lastname", "ASC"], [{ model: User, as: "provider" }, "firstname", "ASC"]],
    });

    const doctors = relationships.map((relationship) => ({
      ...buildProfileUser(relationship.provider),
      relationshipId: relationship.id,
      createdAt: relationship.provider.createdAt,
    }));

    return res.json({ ok: true, doctors });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not load doctors" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// SEARCH USERS FOR CARE TEAM //

app.get("/api/care-team-candidates", async (req, res) => {

  try {
    const { requesterId } = req.query;

    if (!requesterId) {
      return res.status(400).json({ ok: false, message: "Missing user" });
    }

    const requester = await User.findByPk(requesterId);

    if (!requester || !["Patient", "Healthcare Provider"].includes(requester.accountType)) {
      return res.status(403).json({ ok: false, message: "Invalid account type" });
    }

    const targetAccountType = requester.accountType === "Patient" ? "Healthcare Provider" : "Patient";

    const users = await User.findAll({
      where: {
        accountType: targetAccountType,
        emailVerified: true,
      },
      attributes: ["id", "firstname", "lastname", "email", "medicalInfo", "createdAt"],
      order: [["lastname", "ASC"], ["firstname", "ASC"]],
    });

    const relationshipRows = await CareTeamRequest.findAll({
      where: requester.accountType === "Patient"
        ? { patientId: requester.id }
        : { providerId: requester.id },
      order: [["updatedAt", "DESC"]],
    });

    const relationshipByUserId = new Map();

    relationshipRows.forEach((relationship) => {
      const targetId = requester.accountType === "Patient" ? relationship.providerId : relationship.patientId;

      if (!relationshipByUserId.has(targetId)) {
        relationshipByUserId.set(targetId, relationship);
      }
    });

    const candidates = users.map((user) => {
      const relationship = relationshipByUserId.get(user.id);

      return {
        ...buildProfileUser(user),
        createdAt: user.createdAt,
        relationshipStatus: relationship?.status || "",
      };
    });

    return res.json({ ok: true, users: candidates });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not load users" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// CARE TEAM REQUESTS //

app.get("/api/care-team-requests", async (req, res) => {

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ ok: false, message: "Missing user" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const where = {
      status: "pending",
      requestedByUserId: { [Op.ne]: user.id },
    };

    if (user.accountType === "Patient") {
      where.patientId = user.id;
    } else if (user.accountType === "Healthcare Provider") {
      where.providerId = user.id;
    } else {
      return res.json({ ok: true, requests: [] });
    }

    const requests = await CareTeamRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: "patient",
          attributes: ["id", "firstname", "lastname", "email"],
        },
        {
          model: User,
          as: "provider",
          attributes: ["id", "firstname", "lastname", "email"],
        },
        {
          model: User,
          as: "requester",
          attributes: ["id", "firstname", "lastname", "email", "accountType"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ ok: true, requests });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not load care team requests" });

  }

});

app.post("/api/care-team-requests", async (req, res) => {

  try {
    const { requesterId, targetUserId } = req.body;

    if (!requesterId || !targetUserId) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const requester = await User.findByPk(requesterId);
    const targetUser = await User.findByPk(targetUserId);

    if (!requester || !targetUser) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    if (requester.accountType === targetUser.accountType || !["Patient", "Healthcare Provider"].includes(requester.accountType) || !["Patient", "Healthcare Provider"].includes(targetUser.accountType)) {
      return res.status(400).json({ ok: false, message: "Select a patient and a healthcare provider" });
    }

    const patientId = requester.accountType === "Patient" ? requester.id : targetUser.id;
    const providerId = requester.accountType === "Healthcare Provider" ? requester.id : targetUser.id;

    const existingRequest = await CareTeamRequest.findOne({
      where: {
        patientId,
        providerId,
        status: { [Op.in]: ["pending", "approved"] },
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        ok: false,
        message: existingRequest.status === "approved"
          ? "This connection already exists."
          : "A request is already pending.",
      });
    }

    const request = await CareTeamRequest.create({
      patientId,
      providerId,
      requestedByUserId: requester.id,
      status: "pending",
    });

    return res.json({ ok: true, request });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not send request" });

  }

});

app.patch("/api/care-team-requests/:id", async (req, res) => {

  try {
    const { userId, action } = req.body;

    if (!userId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const request = await CareTeamRequest.findOne({
      where: {
        id: req.params.id,
        status: "pending",
      },
    });

    if (!request) {
      return res.status(404).json({ ok: false, message: "Request not found" });
    }

    const isRecipient =
      request.requestedByUserId !== user.id &&
      ((user.accountType === "Patient" && request.patientId === user.id) ||
       (user.accountType === "Healthcare Provider" && request.providerId === user.id));

    if (!isRecipient) {
      return res.status(403).json({ ok: false, message: "You cannot update this request" });
    }

    await request.update({ status: action === "approve" ? "approved" : "rejected" });

    return res.json({ ok: true, request });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not update request" });

  }

});

app.delete("/api/care-team-requests/:id", async (req, res) => {

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ ok: false, message: "Missing user" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const request = await CareTeamRequest.findOne({
      where: {
        id: req.params.id,
        status: "approved",
      },
    });

    if (!request) {
      return res.status(404).json({ ok: false, message: "Relationship not found" });
    }

    const canDelete =
      (user.accountType === "Patient" && request.patientId === user.id) ||
      (user.accountType === "Healthcare Provider" && request.providerId === user.id);

    if (!canDelete) {
      return res.status(403).json({ ok: false, message: "You cannot delete this relationship" });
    }

    await request.destroy();

    return res.json({ ok: true });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not delete relationship" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// GET DOCUMENTS //

app.get("/api/documents", async (req, res) => {

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ ok: false, message: "Missing user" });
    }

    const documents = await Document.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    return res.json({ ok: true, documents });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not load documents" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// DOCUMENT REQUESTS //

app.get("/api/document-requests", async (req, res) => {

  try {
    const { patientId, status = "pending" } = req.query;

    if (!patientId) {
      return res.status(400).json({ ok: false, message: "Missing patient" });
    }

    const requests = await DocumentRequest.findAll({
      where: { patientId, status },
      order: [["createdAt", "DESC"]],
    });

    return res.json({ ok: true, requests });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not load requests" });

  }

});

app.post("/api/document-requests", upload.single("file"), async (req, res) => {

  try {
    const file = req.file;
    const { providerId, patientId, documentName, documentType, provider, documentDate } = req.body;

    if (!file) {
      return res.status(400).json({ ok: false, message: "No file uploaded" });
    }

    if (!providerId || !patientId || !documentName || !documentType || !provider || !documentDate) {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Could not remove incomplete request upload:", err);
      });

      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const providerUser = await User.findByPk(providerId);
    const patient = await User.findByPk(patientId);

    if (!providerUser || providerUser.accountType !== "Healthcare Provider" || !patient || patient.accountType !== "Patient") {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Could not remove unauthorized request upload:", err);
      });

      return res.status(403).json({ ok: false, message: "Invalid provider or patient" });
    }

    const request = await DocumentRequest.create({
      patientId,
      providerId,
      documentName,
      documentType,
      provider,
      documentDate,
      originalName: file.originalname,
      fileName: file.filename,
      filePath: `/uploads/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
      status: "pending",
    });

    return res.json({ ok: true, request });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Request failed" });

  }

});

app.patch("/api/document-requests/:id", async (req, res) => {

  try {
    const { patientId, action } = req.body;

    if (!patientId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const request = await DocumentRequest.findOne({
      where: {
        id: req.params.id,
        patientId,
        status: "pending",
      },
    });

    if (!request) {
      return res.status(404).json({ ok: false, message: "Request not found" });
    }

    if (action === "reject") {
      const storedFilePath = path.join(__dirname, request.filePath.replace(/^\/+/, ""));

      await request.update({ status: "rejected" });

      fs.unlink(storedFilePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Could not remove rejected requested file:", err);
        }
      });

      return res.json({ ok: true });
    }

    const document = await Document.create({
      userId: request.patientId,
      documentName: request.documentName,
      documentType: request.documentType,
      provider: request.provider,
      documentDate: request.documentDate,
      originalName: request.originalName,
      fileName: request.fileName,
      filePath: request.filePath,
      size: request.size,
      mimeType: request.mimeType,
    });

    await request.update({ status: "approved" });

    return res.json({ ok: true, document });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not update request" });

  }

});



// -------------------------------------------------------------------------------------------------------------------------------
// FILE UPLOAD //

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { userId, documentName, documentType, provider, documentDate } = req.body;

    if (!file) {
      return res.status(400).json({ ok: false, message: "No file uploaded" });
    }

    if (!userId || !documentName || !documentType || !provider || !documentDate) {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Could not remove incomplete upload:", err);
      });

      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const document = await Document.create({
      userId,
      documentName,
      documentType,
      provider,
      documentDate,
      originalName: file.originalname,
      fileName: file.filename,
      filePath: `/uploads/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
    });

    return res.json({
      ok: true,
      document,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Upload failed" });
  }
});



// -------------------------------------------------------------------------------------------------------------------------------
// DELETE DOCUMENT //

app.delete("/api/documents/:id", async (req, res) => {

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ ok: false, message: "Missing user" });
    }

    const document = await Document.findOne({
      where: {
        id: req.params.id,
        userId,
      },
    });

    if (!document) {
      return res.status(404).json({ ok: false, message: "Document not found" });
    }

    const storedFilePath = path.join(__dirname, document.filePath.replace(/^\/+/, ""));

    await document.destroy();

    fs.unlink(storedFilePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Could not remove uploaded file:", err);
      }
    });

    return res.json({ ok: true });

  } catch (err) {

    console.error(err);
    return res.status(500).json({ ok: false, message: "Could not delete document" });

  }

});

// Returning upload errors as JSON responses
app.use((err, req, res, next) => {

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ ok: false, message: "Document must be 50MB or smaller." });
  }

  if (err) {
    return res.status(400).json({ ok: false, message: err.message || "Upload failed" });
  }

  next();

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

if (require.main === module) {
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
}

module.exports = app;
