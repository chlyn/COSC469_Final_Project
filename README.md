# COSC469: Final Project - SoftCare

SoftCare is a full-stack health records web application that allows patients and healthcare providers to manage medical documents, account information, care team relationships, and document requests in one organized platform.

### Course Information
**By:** Chenilyn Joy Espineda<br>
**Course:** COSC 469-101<br>
**Instructor:** Dr. Appolo Tankeh<br>
**Due Date:** May 5, 2026

### Additional Links
**GitLab Repository:** [https://gitlab.com/cosc469_group/COSC469_Final_Project](https://gitlab.com/cosc469_group/COSC469_Final_Project)<br>
**Project Report:** [https://www.overleaf.com/read/rpzgpxbdzkxv#bec975](https://www.overleaf.com/read/rpzgpxbdzkxv#bec975)

<br>

---

## 💻 Tech Stack

### Frontend
* HTML
* CSS
* JavaScript

### Backend
* Node.js
* Express.js
* Sequelize
* MySQL
* bcrypt
* Nodemailer
* Multer
* dotenv
* open

### Development and Testing
* nodemon
* Jest
* Supertest
* ESLint
* Sequelize CLI

### DevOps
* GitHub
* GitHub Actions
* GitLab
* GitLab CI/CD
* MySQL Service in GitLab CI

<br>

---

## 🛠️ Setup Steps

### Step 1: Install Node.js

This project requires Node.js and npm.

#### Option 1 - Using NVM

Install Node Version Manager:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
```

Install the latest LTS version of Node.js:

```bash
nvm install --lts
```

#### Option 2 - Direct Install

Download and install Node.js from the official website:

[https://nodejs.org](https://nodejs.org)

<br>

### Step 2: Verify Node.js Installation

Run the following commands:

```bash
node -v
npm -v
```

You should see version numbers for both Node.js and npm.

<br>

### Step 3: Clone the Repository

Run the following command to download the project from GitHub:

```bash
git clone https://github.com/chlyn/COSC469_Final_Project.git
cd COSC469_Final_Project
```

<br>

### Step 4: Install Project Dependencies

Run the following command inside the project folder:

```bash
npm install
```

This installs all required dependencies from `package.json`.

<br>

### Step 5: Environment Variables (.env Setup)

Create a `.env` file in the root of the project.

```bash
touch .env
```

Add the following variables:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cosc469_final_project_db
DB_TEST_NAME=cosc469_final_project_test

MAIL_USER=your_email@gmail.com
MAIL_PASS=your_gmail_app_password

PORT=3000
```

If your MySQL root user does not use a password, you can leave `DB_PASSWORD` blank:

```env
DB_PASSWORD=
```

<br>

### Step 6: Gmail App Password Setup

SoftCare uses Gmail with Nodemailer to send account verification codes and password reset codes.

#### 1. Enable 2-Step Verification
* Go to your Google Account security settings
* Enable **2-Step Verification**

#### 2. Generate an App Password
* Go to Google App Passwords
* Enter an app name such as `COSC469 Final Project`
* Click **Create**
* Copy the generated app password

#### 3. Add the App Password to `.env`

```env
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_generated_app_password
```

Do not include spaces inside the app password.

<br>

### Step 7: Create the Database

Run the following command to create the MySQL database using the Sequelize configuration:

```bash
npm run db:create
```

<br>

### Step 8: Run Database Migrations

Run the following command to create the required database tables:

```bash
npm run db:migrate
```

<br>

### Step 9: Run the Application

Start the development server:

```bash
npm start
```

Then open the application in your browser:

```bash
http://localhost:3000
```

<br>

---

## 🧪 Testing and Linting

### Run Tests

The test suite uses Jest and Supertest to test backend API behavior, including login with valid and invalid credentials.
```bash
npm test
```

### Run Linting

ESLint checks the JavaScript files for code quality and syntax issues.
```bash
npm run lint
```

<br>

---

## 🚀 DevOps Automation

## I. GitHub to GitLab Synchronization

This project is connected between GitHub and GitLab using GitHub Actions. Every push to the `main` branch on GitHub automatically syncs the repository to GitLab.

**Workflow File Location:**

```bash
.github/workflows/sync-to-gitlab.yml
```

### Setup Steps

1. Create a repository in GitHub.
2. Create a project in GitLab to receive the synced repository files.
3. In GitLab, go to **User Settings → Access Tokens**.
4. Create a Personal Access Token.
5. Enable the `write_repository` permission.
6. Copy the generated token.
7. In GitHub, open the repository settings.
8. Go to **Settings → Secrets and variables → Actions**.
9. Click **New repository secret**.
10. Enter the secret name:

```bash
GITLAB_TOKEN
```

11. Paste the GitLab token into the secret value field.
12. Click **Add secret**.
13. Create the workflow file:

```bash
.github/workflows/sync-to-gitlab.yml
```

14. Add the workflow configuration:

### sync-to-gitlab.yml

```yaml
name: Sync to GitLab

on:
  push:
    branches:
      - main

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Push to GitLab
        run: |
          git remote add gitlab https://oauth2:${{ secrets.GITLAB_TOKEN }}@gitlab.com/cosc469_group/COSC469_Final_Project.git
          git push gitlab main --force
```

15. Push changes to the `main` branch.
16. Confirm that GitHub Actions syncs the project to GitLab.

<br>

## II. GitLab CI/CD Pipeline

This project also uses GitLab CI/CD to automatically run a multi-stage pipeline whenever changes are pushed to GitLab.

**Pipeline File Location:**

```bash
.gitlab-ci.yml
```

The pipeline includes the following stages:

* `checks` = installs dependencies, checks JavaScript files, runs ESLint, and runs automated tests
* `build` = creates a project artifact
* `deploy` = includes staging and production deployment placeholders


### GitLab CI/CD Setup Steps

1. Open the synced project in GitLab.
2. Create a file in the root of the repository named:

```bash
.gitlab-ci.yml
```

3. Define the pipeline stages:

```yaml
stages:
  - checks
  - build
  - deploy
```

4. Add test environment variables for the pipeline.
5. Add a MySQL service so the test database can run inside the pipeline.
6. Add a checks job to run syntax checks, linting, and tests.
7. Add a build job to create an artifact.
8. Add staging and production deployment jobs.
9. Save and commit the `.gitlab-ci.yml` file.
10. Push the changes.
11. Open GitLab and go to **Build → Pipelines**.
12. View the pipeline results.
13. If the pipeline fails, open the failed job log, fix the issue, and push again.

### .gitlab-ci.yml

```yaml
stages:
  - checks
  - build
  - deploy

variables:
  NODE_ENV: test
  DB_HOST: mysql
  DB_USER: root
  DB_PASSWORD: root
  DB_TEST_NAME: cosc469_final_project_test
  MAIL_USER: test@example.com
  MAIL_PASS: fake-password
  MYSQL_ROOT_PASSWORD: root
  MYSQL_DATABASE: cosc469_final_project_test

checks:
  stage: checks
  image: node:20
  services:
    - name: mysql:8
      alias: mysql
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - .npm/
  before_script:
    - npm ci --cache .npm --prefer-offline
  script:
    - node --check server.js
    - node --check public/script.js
    - node --check models/index.js
    - node --check models/user.js
    - node --check models/document.js
    - node --check models/passwordresetcode.js
    - node --check migrations/20260406213254-create-user.js
    - node --check migrations/20260406213307-create-password-reset-code.js
    - node --check migrations/20260502202727-rename-major-to-account-type-and-drop-minor.js
    - node --check migrations/20260503000000-create-document.js
    - node --check migrations/20260503000001-add-email-verified-to-user.js
    - node --check migrations/20260503000002-add-user-id-to-document.js
    - npm run lint
    - npm test

build-artifact:
  stage: build
  image: node:20
  needs:
    - checks
  script:
    - mkdir -p artifact
    - cp -r server.js package.json package-lock.json config models migrations public artifact/
  artifacts:
    name: softcare-app
    paths:
      - artifact/
    expire_in: 7 days

deploy-staging:
  stage: deploy
  image: node:20
  needs:
    - build-artifact
  rules:
    - if: '$CI_COMMIT_BRANCH == "staging"'
  environment:
    name: staging
  script:
    - echo "Checks passed."
    - echo "Deployment artifact is ready."
    - echo "This is where staging deployment would happen."

deploy-production:
  stage: deploy
  image: node:20
  needs:
    - build-artifact
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: manual
  environment:
    name: production
  script:
    - echo "Checks passed."
    - echo "Manual production approval was granted in GitLab."
    - echo "This is where production deployment would happen."
```

<br>

---

## ⚙️ Features

### Authentication Features
* Create user accounts
* Select account type during registration
* Log in with email and password
* Password hashing using bcrypt
* Email verification using a 6-digit code
* Verification codes expire after 10 minutes
* Forgot password flow
* New password creation after verification
* Profile password change with email verification

### Patient Features
* Patient dashboard
* Upload medical documents
* View medical records in a table
* Search, sort, and filter documents
* View uploaded document files
* Delete documents
* View notifications
* Approve or reject provider document requests
* Manage care team requests
* View connected doctors
* Update patient profile and medical information

### Healthcare Provider Features
* Healthcare provider dashboard
* View connected patients
* Request to connect with patients
* Request to add documents to a patient's records
* View provider notifications
* Update provider profile information

### Document Management Features
* Upload medical files
* Save uploaded files in the local `uploads` folder
* Save document metadata in MySQL
* Supported file types:
  * PDF
  * DOC
  * DOCX
  * JPG
  * JPEG
  * PNG
  * DCM
  * DICOM
* File upload size limit of 50MB

### Request and Notification Features
* Provider document requests
* Patient approval or rejection of document requests
* Care team requests
* Care team approval or rejection
* Notification badge count
* Notification cards for pending requests

### DevOps Features
* GitHub to GitLab synchronization
* GitLab CI/CD pipeline
* Automated syntax checks
* Automated linting
* Automated tests
* Build artifact creation
* Staging deployment placeholder
* Manual production deployment placeholder

<br>

---