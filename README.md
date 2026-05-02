# COSC469 Final Project

---

## 📖 Project Overview
This is the project description

Built with:
- **Node.js**
- **Express.js**
- **HTML/CSS/JavaScript**
- **Sequelize**
- **MySQL**

---

## 📚 Course & Team Information

### Course Details
- **Course:** COSC 469
- **Instructor:** Dr. Appolo Tankeh
- **Due Date:** May 5, 2026


### Group Members
- Chenilyn Joy Espineda
- Dayana Ferrufino

---

## 🛠 Installation & Setup

### 1. Install Node.js

This project requires Node.js to run. You can install it using the following methods:

#### 🔹 Option 1 - Using NVM

Install Node Version Manager (nvm):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
```

Install the latest LTS version of Node.js:
```bash
nvm install --lts
```
#### 🔹 Option 2 - Direct Install

Download and install Node.js from the official website: https://nodejs.org

### 2. Verify Node.js Installation

Run the following commands:
```bash
node -v
npm -v
```
You should see version numbers for both Node.js and npm.

### 3. Clone Repository

```bash
git clone https://github.com/chlyn/COSC469_Final_Project.git
cd COSC469_Final_Project
```

### 4. Install Project Dependencies

```bash
npm install
```

### 5. Environment Setup (.env)

Create a `.env` file in the root directory and include the following:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=cosc469_final_project_db

MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

PORT=3000
```

#### 📧 Setting Up Email (Gmail)

This project uses Gmail with Nodemailer to send emails (e.g., password reset codes, account verification).
> 
> ##### Step 1: Enable 2-Step Verification
> 
> 1. Go to your Google Account settings: https://myaccount.google.com/security
> 2. Enable **2-Step Verification** for your account.
> 
> ##### Step 2: Generate an App Password
> 
> 1. Go to: https://myaccount.google.com/apppasswords
> 2. Enter **App Name**: `COSC469: Final Project`
> 3. Click **Create**
> 4. Copy the generated 16-character app password
> 
> ##### Step 3: Add to .env
> ```env
> MAIL_USER=your_email@gmail.com
> MAIL_PASS=your_generated_app_password
> ```

### 6. Database Setup (Sequelize)

Create and migrate the database:
```bash
npm run db:create
npm run db:migrate
```

### 7. Run the Application

```bash
npm start
```

Then open:
```
http://localhost:3000
```

---

## ⚙️ Features

- User account creation and login
- Password hashing using bcrypt
- Password reset via email
- Email verification using Nodemailer
- Database management with Sequelize

---

## 🚀 How to Use
1. Create an account
2. Log in with your credentials
3. Use the application features (reset password, profile, etc.)

### Demo:

---
