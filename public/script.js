/* ------------------------------------------------------------------------------------------ */
/* SETUP AND VARIABLES */

// Defining the URL paths of the website
const ROUTES = {
  login: "/login",
  "create-account": "/create-account",
  "forgot-password": "/forgot-password",
  verification: "/verification",
  "new-password": "/new-password",
  home: "/home",
};

// Referencing form sections from the HTML
const sections = {
  "create-account": document.querySelector("#create-account"),
  login: document.querySelector("#login"),
  "forgot-password": document.querySelector("#forgot-password"),
  verification: document.querySelector("#verification"),
  "new-password": document.querySelector("#new-password"),
};

// Storing information in local storage for the login and password reset verification process
const STORAGE_KEYS = {
  currentUser: "currentUser",                 // Logged in user information
  resetEmail: "resetEmail",                   // Email used for password reset or account verification
  resetVerified: "resetVerified",             // Whether verification succeeded
  verificationPurpose: "verificationPurpose", // Whether verification is for account creation or password reset
};

// Storing main HTML page containers
const authContainer = document.querySelector(".background-auth"); // Authentication page background and forms
const homeContainer = document.querySelector("#home");            // Main homepage 

// Storing sidebar action elements
const signoutBtn = document.getElementById("signout-btn");

// Storing form references 
const createForm = document.getElementById("create-form");
const loginForm = document.getElementById("login-form");
const forgotPasswordForm = document.getElementById("forgot-password-form");
const verificationForm = document.getElementById("verification-form");
const newPasswordForm = document.getElementById("new-password-form");



/* ------------------------------------------------------------------------------------------ */
/* BASIC HELPERS */

// Shorter way to find HTML elements
function $(selector, scope = document) {
  return scope.querySelector(selector);
}

// Storing submitted form values
function getFormData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

// Changing the page URL without refereshing the page
function navigate(path) {
  history.pushState({}, "", path);
}

// Showing elements by removing hidden class
function showElement(element) {
  element?.classList.remove("hidden");
}

// Hiding elements by adding the hidden class
function hideElement(element) {
  element?.classList.add("hidden");
}



/* ------------------------------------------------------------------------------------------ */
/* USER & VERIFICATION LOCAL STORAGE HELPERS */

// Storing logged in user information into localStorage
function saveCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

// Retrieving stored logged in user from localStorage
function getCurrentUser() {
  const stored = localStorage.getItem(STORAGE_KEYS.currentUser);
  return stored ? JSON.parse(stored) : null;
}

// Removing stored logged in user from localStorage
function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
}

// Storing reset email into localStorage
function saveResetEmail(email) {
  localStorage.setItem(STORAGE_KEYS.resetEmail, email);
}

// Retrieving stored reset email from localStorage
function getResetEmail() {
  return localStorage.getItem(STORAGE_KEYS.resetEmail);
}

// Storing whether the verification code was successful into localStorage
function saveResetVerified(value) {
  localStorage.setItem(STORAGE_KEYS.resetVerified, value);
}

// Retrieving current verification status from localstorage
function getResetVerified() {
  return localStorage.getItem(STORAGE_KEYS.resetVerified);
}

// Storing what the verification code should do after success
function saveVerificationPurpose(purpose) {
  localStorage.setItem(STORAGE_KEYS.verificationPurpose, purpose);
}

// Retrieving what the verification code should do after success
function getVerificationPurpose() {
  return localStorage.getItem(STORAGE_KEYS.verificationPurpose);
}

// Removing stored reset email and verification status from localStorage
function clearResetState() {
  localStorage.removeItem(STORAGE_KEYS.resetEmail);
  localStorage.removeItem(STORAGE_KEYS.resetVerified);
  localStorage.removeItem(STORAGE_KEYS.verificationPurpose);
}



/* ------------------------------------------------------------------------------------------ */
/* ALERT HELPERS */

// Displaying the error alert message on the screen
function showError(boxId, message) {

  // Finding the HTML alert box
  const box = document.getElementById(boxId);

  // If box doesn't exist, then don't do anything
  if (!box) return;

  // If box exists, then make alert visible and insert the error message text
  box.classList.remove("hidden");
  const text = box.querySelector(".msg-error-text");
  if (text) text.textContent = message;
  
}

// Hiding the error alert message from the screen
function hideError(boxId) {

  // Finding the HTML alert box
  const box = document.getElementById(boxId);

  // If box doesn't exist, then don't do anything
  if (!box) return;

  // If box exists, then hide alert and clear the error message text
  box.classList.add("hidden");
  const text = box.querySelector(".msg-error-text");
  if (text) text.textContent = "";

}

// Displaying the success alert message on the screen
function showSuccess(boxId, message) {

  // Finding the HTML alert box
  const box = document.getElementById(boxId);

  // If box doesn't exist, then don't do anything
  if (!box) return;

  // If box exists, then make alert visible and insert the success message text
  box.classList.remove("hidden");
  const text = box.querySelector(".msg-success-text");
  if (text) text.textContent = message;

}

// Hiding the success alert message from the screen
function hideSuccess(boxId) {

  // Finding the HTML alert box
  const box = document.getElementById(boxId);

  // If box doesn't exist, then don't do anything
  if (!box) return;

  // If box exists, then hide alert and clearthe success message text
  box.classList.add("hidden");
  const text = box.querySelector(".msg-success-text");
  if (text) text.textContent = "";

}

let successToastTimer = null;

function showTemporarySuccess(boxId, message, delay = 3000) {
  showSuccess(boxId, message);

  clearTimeout(successToastTimer);

  successToastTimer = setTimeout(() => {
    hideSuccess(boxId);
  }, delay);
}

// Auto-hiding success alert messages from screen after user starts typing into the form inputs
function setupInputListeners() {

  // Hide alert once user start typing the verification code 
  $('#verification-form input[name="code"]')?.addEventListener("input", () => {
    hideSuccess("verification-success");
  });

  // Hide alert once user starts typing the email
  $('#login-form input[name="email"]')?.addEventListener("input", () => {
    hideSuccess("login-success");
  });

  // Hide alert once user starts typing the password
  $('#login-form input[name="password"]')?.addEventListener("input", () => {
    hideSuccess("login-success");
  });
}



/* ------------------------------------------------------------------------------------------ */
/* API HELPER */

// Sending POST requests to the server
async function postJSON(url, body) {

  // Uses fetch to send the POST request 
  // Converting body into JSON text before sending to server
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Getting server response and returning result
  const data = await res.json().catch(() => ({}));
  return { res, data };
}



/* ------------------------------------------------------------------------------------------ */
/* SECTION & ROUTE HANDLING */

// Hiding all form sections (login, create-account, forgot-password, verification, new-password)
function hideAllSections() {

  // Removing active class in all form sections
  Object.values(sections).forEach((section) => {
    section?.classList.remove("active");
  });

}

// Displaying one specified form section
function showSection(sectionName) {
  
  // Displaying form container
  showElement(authContainer);

  // Hiding homepage
  hideElement(homeContainer);

  // Hiding all form sections
  hideAllSections();

  // Displaying specified form section by adding active class
  sections[sectionName]?.classList.add("active");

}

// Inserting user information into the homepage after login or create account
function populateHome(user) {
  
  // If user does not exists, then don't do anything
  if (!user) return;

  // Pulling user information
  const firstname = user.firstname || "";
  // Getting HTML Elements that will be updated
  const topbarTitle = document.getElementById("topbar-title");

  // Updating UI with user's information
  if (topbarTitle) topbarTitle.textContent = `Welcome back, ${firstname}`;

}

// Displaying homepage after login or account creation
function showHome(message = "") {

  // Hiding all forms
  hideElement(authContainer);

  // Displaying homepage
  showElement(homeContainer);

  // Inserting users's information from localStorage
  populateHome(getCurrentUser());

  // Showing the correct dashboard based on account type
  setupDashboardForCurrentUser();

  // If success alert message is empty, then show success alert
  if (!message) return;

  // If message exists, then display success alert message
  showTemporarySuccess("home-success", message);

}

// Displaying correct form section or page based on current URL path 
// Handles navigation when page refreshes, user presses back and forward, and user opens a URL directly
function loadRoute() {

  // Getting current URL path
  const path = window.location.pathname;

  // Displaying form section or page according to URL path
  switch (path) {
    case ROUTES["create-account"]:
      showSection("create-account");
      break;
    case ROUTES["forgot-password"]:
      showSection("forgot-password");
      break;
    case ROUTES.verification:
      showSection("verification");
      break;
    case ROUTES["new-password"]:
      showSection("new-password");
      break;
    case ROUTES.home:
      showHome();
      break;
    case ROUTES.login:
    default:
      showSection("login");
      break;
  }

}

// Displaying correct form section form section or page after user clicks buttons
// Handles navigation when the user clicks button inside the app
function setupRouteSwitching() {

  // Listening for any clicks happening on the page
  document.addEventListener("click", (e) => {

    // Finding the HTML button with the "data-switch" attribute
    const btn = e.target.closest("[data-switch]");

    // If what was clicked was not a navigation button, then don't do anything
    if (!btn) return;

    // Storing the target section from the "data-switch" value
    const target = btn.dataset.switch;

    // Getting specified route according to the target section
    const route = ROUTES[target];

    // If route does not exists, them don't do anything
    if (!route) return;

    // Changing URL without reloading the page
    navigate(route);

    // Displaying form section or page according target section
    showSection(target);

  });

  // Displaying correct form section or page when user presses back and forward buttons using
  window.addEventListener("popstate", loadRoute);

}



/* ------------------------------------------------------------------------------------------ */
/* PROFILE MENU */

// Controlling profile menu interaction according to user's actions
function setupProfileMenu() {
  // Profile is now a normal sidebar page.
}



/* ------------------------------------------------------------------------------------------ */
/* SIGN OUT */

// Setting up sign out behaviour
function setupSignout() {

  // Listening for any clicks on the sign out button
  signoutBtn?.addEventListener("click", () => {

    // Removing stored logged in user from localStorage
    clearCurrentUser();

    // Removing temporary reset email and verification status from localStorage
    clearResetState();

    // Changing URL to login without reloading the page
    navigate(ROUTES.login);

    // Displaying login form section
    showSection("login");

  });

}



/* ------------------------------------------------------------------------------------------ */
/* PASSWORD TOGGLES */

// Setting up password visibility toggle button behavior
function setupPasswordToggles() {

  // Finding the HTML button with the "password-toggle" class
  document.querySelectorAll(".password-toggle").forEach((button) => {

    // Listening for any clicks on all password visibitly toggle buttons
    button.addEventListener("click", () => {

      // Finding the HTML input field and icon
      const input = button.parentElement.querySelector("input");
      const icon = button.querySelector(".material-icons");

      // If input field or icon cannot be found, then don't do anything
      if (!input || !icon) return;

      // Checking if password is currently hidden
      const isHidden = input.type === "password";

      // Switching the input type between text (for visibility) and password (for no visibility)
      input.type = isHidden ? "text" : "password";

      // Updating icon according to toggle status
      icon.textContent = isHidden ? "visibility" : "visibility_off";

      // Updating accessiblity screen reader attribute according to toggle status
      button.setAttribute("aria-pressed", String(isHidden));

    });

  });

}



/* ------------------------------------------------------------------------------------------ */
/* CREATE ACCOUNT */

async function handleCreateAccountSubmit(e) {

  // Stopping the page from refreshing
  e.preventDefault();

  // Hiding any previous error alert messages
  hideError("create-error");

  // Getting the form that was submitted
  const form = e.currentTarget;

  // Pulling all user inputs from form
  const body = getFormData(form);

  try {

    // Sendaing a POST request of  all user information to the server
    const { res, data } = await postJSON("/api/create-account", body);

    // If request fails, then send an error alert message
    if (!res.ok || !data.ok) {
      showError("create-error", data.message || "System error, please try again");
      return;
    }

    // Clearing all form inputs
    form.reset();

    // Storing submitted email and verification purpose
    saveResetEmail(body.email);
    saveVerificationPurpose("create-account");

    // Changing URL to verification form without reloading the page
    navigate(ROUTES.verification);

    // Displaying verification section
    showSection("verification");

    // Displaying success alert message
    showSuccess("verification-success", "We've sent a verification code to your email.");

  } catch {

    // If unknown error happens, then display error alert message
    showError("create-error", "System error, please try again");

  }

}


/* ------------------------------------------------------------------------------------------ */
/* LOGIN */

async function handleLoginSubmit(e) {

  // Stopping the page from refreshing
  e.preventDefault();

  // Hiding any previous error alert messages
  hideError("login-error");

  // Getting the form that was submitted
  const form = e.currentTarget;

  // Pulling all user inputs from form
  const body = getFormData(form);

  try {

    // Sendaing a POST request of all user information to the server
    const { res, data } = await postJSON("/api/login", body);

    // If request fails, then send an error alert message
    if (!res.ok || !data.ok) {
      showError("login-error", data.message || "System error, please try again");
      return;
    }

    // Storing logged in user information into localStorage
    saveCurrentUser(data.user);

    // Clearing all form inputs
    form.reset();

    // Changing URL to homepage without reloading the page
    navigate(ROUTES.home);

    // Displaying success alert message
    showHome("Login successful!");

  } catch {

    // If unknown error happens, then display error alert message
    showError("login-error", "System error, please try again");

  }

}


/* ------------------------------------------------------------------------------------------ */
/* FORGOT PASSWORD */

async function handleForgotPasswordSubmit(e) {

  // Stopping the page from refreshing
  e.preventDefault();

  // Hiding any previous error alert messages
  hideError("forgot-password-error");

  // Getting the form that was submitted
  const form = e.currentTarget;

  // Pulling all user inputs from form
  const body = getFormData(form);

  try {

    // Sendaing a POST request of all user information to the server
    const { res, data } = await postJSON("/api/forgot-password", body);

    // If request fails, then send an error alert message
    if (!res.ok || !data.ok) {
      showError("forgot-password-error", data.message || "System error, please try again");
      return;
    }

    // Storing submitted reset email into localStorage
    saveResetEmail(body.email);
    saveVerificationPurpose("password-reset");

    // Clearing all form inputs
    form.reset();

    // Changing URL to verification form without reloading the page
    navigate(ROUTES.verification);

    // Displaying verification section
    showSection("verification");

    // Displaying success alert message
    showSuccess("verification-success", "We've sent a verification code to your email.");

  } catch {

    // If unknown error happens, then display error alert message
    showError("forgot-password-error", "System error, please try again");

  }

}


/* ------------------------------------------------------------------------------------------ */
/* VERIFICATION */

async function handleVerificationSubmit(e) {

  // Stopping the page from refreshing
  e.preventDefault();

  // Hiding any previous error and success alert messages
  hideError("verification-error");
  hideSuccess("verification-success");

  // Getting the form that was submitted
  const form = e.currentTarget;

  // Pulling all user inputs from form
  const body = getFormData(form);

  // Getting the stored reset email
  const email = getResetEmail();
  const purpose = getVerificationPurpose();

  // Checking if all required fields are present, else send missing error
  if (!body.code || !email) {
    showError("verification-error", "Missing required fields");
    return;
  }

  // Checking if code only contains numbers, else send numbers only error
  if (!/^\d+$/.test(body.code)) {
    showError("verification-error", "Code must contain numbers only");
    return;
  }

  try {

    // Sendaing a POST request of all user information to the server
    const { res, data } = await postJSON("/api/verification", { email, code: body.code, purpose });

    // If request fails, then send an error alert message
    if (!res.ok || !data.ok) {
      showError("verification-error", data.message || "System error, please try again");
      return;
    }

    // Clearing all form inputs
    form.reset();

    if (purpose === "create-account") {
      // Storing logged in user information into localStorage
      saveCurrentUser(data.user);

      // Removing temporary verification state from localStorage
      clearResetState();

      // Changing URL to homepage without reloading the page
      navigate(ROUTES.home);

      // Displaying success alert message
      showHome("Account created successfully!");
      return;
    }

    // Setting varification status as successful
    saveResetVerified("true");

    // Changing URL to new-password form without reloading the page
    navigate(ROUTES["new-password"]);

    // Displaying new-password section
    showSection("new-password");

  } catch {

    // If unknown error happens, then display error alert message
    showError("verification-error", "System error, please try again");

  }

}


/* ------------------------------------------------------------------------------------------ */
/* NEW PASSWORD */

async function handleNewPasswordSubmit(e) {

  // Stopping the page from refreshing
  e.preventDefault();

  // Hiding any previous error alert messages
  hideError("new-password-error");

  // Getting the form that was submitted
  const form = e.currentTarget;

  // Pulling all user inputs from form
  const body = getFormData(form);

  // Getting the stored reset email
  const email = getResetEmail();

  // Getting the stored verfication status 
  const resetVerified = getResetVerified();

  // Checking if verification was completed, else send an error alert message
  if (!email || resetVerified !== "true") {
    showError("new-password-error", "System error, please try again");
    return;
  }

  // Checking if all required fields are present, else send missing error
  if (!body.newPassword || !body.confirmPassword) {
    showError("new-password-error", "Missing required fields");
    return;
  }

  // Checking if new and confirm passwords match, else send mismatch error
  if (body.newPassword !== body.confirmPassword) {
    showError("new-password-error", "New password and confirm password do not match");
    return;
  }

  try {

    // Sendaing a POST request of all user information to the server
    const { res, data } = await postJSON("/api/new-password", {
      email,
      newPassword: body.newPassword,
      confirmPassword: body.confirmPassword,
    });

    // If request fails, then send an error alert message
    if (!res.ok || !data.ok) {
      showError("new-password-error", data.message || "System error, please try again");
      return;
    }

    // Clearing all form inputs
    form.reset();

    // Removing temporary reset email and verification status from localStorage
    clearResetState();

    // Changing URL to login form without reloading the page
    navigate(ROUTES.login);

    // Displaying login section
    showSection("login");

    // Displaying success alert message
    showSuccess("login-success", "Password updated successfully!");

  } catch {

    // If unknown error happens, then display error alert message
    showError("new-password-error", "System error, please try again");

  }

}



/* ------------------------------------------------------------------------------------------ */
/* DOCUMENTS TABLE */

const recordsTableBody = document.getElementById("records-table-body");
const recordsTableHeadRow = document.querySelector(".records-table thead tr");
const pageTitle = document.getElementById("page-title");
const uploadDocBtnText = document.getElementById("upload-doc-btn-text");
const patientBackBtn = document.getElementById("patient-back-btn");
const patientDetails = document.getElementById("patient-details");
const careTeamNavBtn = document.getElementById("care-team-nav-btn");
const notificationsNavBtn = document.getElementById("notifications-nav-btn");
const notificationsCount = document.getElementById("notifications-count");
const notificationsList = document.getElementById("notifications-list");
const recordsTableList = document.querySelector(".records-table-list");
const recordsControls = document.querySelector(".records-controls");
const recordsMainContent = recordsControls?.closest(".main-content");
const profileForm = document.getElementById("profile-form");
const profilePasswordBtn = document.getElementById("profile-password-btn");
const profilePasswordModal = document.getElementById("profile-password-modal");
const profilePasswordClose = document.getElementById("profile-password-close");
const profilePasswordError = document.getElementById("profile-password-error");
const profilePasswordSuccess = document.getElementById("profile-password-success");
const profilePasswordCodeForm = document.getElementById("profile-password-code-form");
const profilePasswordVerifyForm = document.getElementById("profile-password-verify-form");
const profilePasswordChangeForm = document.getElementById("profile-password-change-form");
const patientProfileSection = document.getElementById("patient-profile-section");
const doctorProfileSection = document.getElementById("doctor-profile-section");
const profileSaveBtn = document.getElementById("profile-save-btn");
const relationshipModal = document.getElementById("relationship-modal");
const relationshipModalTitle = document.getElementById("relationship-modal-title");
const relationshipModalClose = document.getElementById("relationship-modal-close");
const relationshipError = document.getElementById("relationship-error");
const relationshipSearchInput = document.getElementById("relationship-search-input");
const relationshipSearchClearBtn = document.getElementById("relationship-search-clear-btn");
const relationshipList = document.getElementById("relationship-list");

let recordsDocuments = [];
let patients = [];
let doctors = [];
let documentRequests = [];
let careTeamRequests = [];
let relationshipCandidates = [];
let selectedPatient = null;
let appView = "records";
let verifiedProfilePasswordCode = "";
let initialProfileSnapshot = "";

let activeRecordsSort = {
  key: "",
  direction: "none",
};

let activeRecordsDateRange = null;

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDocumentTypeBadgeClass(documentType) {
  const type = String(documentType ?? "").toLowerCase();

  if (type.includes("visit")) return "visit-summary";
  if (type.includes("lab")) return "lab-report";
  if (type.includes("prescription")) return "prescription";
  if (type.includes("imaging")) return "imaging";

  return "other";
}

function isProvider(user = getCurrentUser()) {
  return user?.accountType === "Healthcare Provider";
}

function isPatient(user = getCurrentUser()) {
  return user?.accountType === "Patient";
}

function setPageTitle(title) {
  if (pageTitle) pageTitle.textContent = title;
}

function setControlsVisibility({ search = true, type = true, date = true, clear = true } = {}) {
  recordSearchInput?.closest(".record-search")?.classList.toggle("hidden", !search);
  typeFilterBtn?.closest(".record-filter")?.classList.toggle("hidden", !type);
  dateRangeBtn?.closest(".date-range-filter")?.classList.toggle("hidden", !date);
  recordsClearBtn?.classList.toggle("hidden", !clear || !hasActiveFilters());
}

function renderTableHeaders(headers) {
  if (!recordsTableHeadRow) return;

  recordsTableHeadRow.innerHTML = headers.map((header) => {
    if (!header.sort) {
      return `<th class="${header.className || ""}">${escapeHTML(header.label || "")}</th>`;
    }

    return `
      <th>
        <button class="table-sort-btn" type="button" data-sort="${escapeHTML(header.sort)}" data-direction="none">
          <span>${escapeHTML(header.label)}</span>
          <span class="material-icons">unfold_more</span>
        </button>
      </th>
    `;
  }).join("");

  setupTableSortButtons();
}

function showTable() {
  recordsMainContent?.classList.remove("hidden");
  recordsTableList?.classList.remove("hidden");
  notificationsList?.classList.add("hidden");
  profileForm?.classList.add("hidden");
}

function showNotificationsPanel() {
  recordsMainContent?.classList.remove("hidden");
  recordsTableList?.classList.add("hidden");
  notificationsList?.classList.remove("hidden");
  profileForm?.classList.add("hidden");
}

function showProfilePanel() {
  recordsMainContent?.classList.remove("hidden");
  recordsTableList?.classList.add("hidden");
  notificationsList?.classList.add("hidden");
  profileForm?.classList.remove("hidden");
}

function showDetailsOnlyPanel() {
  recordsMainContent?.classList.add("hidden");
  recordsTableList?.classList.add("hidden");
  notificationsList?.classList.add("hidden");
  profileForm?.classList.add("hidden");
}

function showPatientDetails(patient) {
  if (!patientDetails || !patient) return;
  const medicalInfo = patient.medicalInfo || {};
  const details = [
    ["Date of Birth", medicalInfo.dateOfBirth],
    ["Blood Type", medicalInfo.bloodType],
    ["Allergies", medicalInfo.allergies],
    ["Medical Conditions", medicalInfo.conditions],
    ["Medications", medicalInfo.medications],
    ["Emergency Contact", medicalInfo.emergencyContact],
  ].filter(([, value]) => Boolean(String(value || "").trim()));

  patientDetails.innerHTML = `
    <div class="patient-detail-heading">
      <h2>${escapeHTML(patient.firstname)} ${escapeHTML(patient.lastname)}</h2>
      <p>${escapeHTML(patient.email)}</p>
    </div>

    ${details.map(([label, value]) => `
      <div class="patient-detail-item">
        <p class="patient-detail-label">${escapeHTML(label)}</p>
        <p class="patient-detail-value">${escapeHTML(value)}</p>
      </div>
    `).join("")}
  `;

  patientDetails.classList.remove("hidden");
}

function showDoctorDetails(doctor) {
  if (!patientDetails || !doctor) return;
  const info = doctor.medicalInfo || {};
  const details = [
    ["Doctor Type", info.specialty],
    ["Phone", info.phone],
    ["Workplace", info.workplace],
    ["Address", info.address],
  ].filter(([, value]) => Boolean(String(value || "").trim()));

  patientDetails.innerHTML = `
    <div class="patient-detail-heading">
      <h2>${escapeHTML(doctor.firstname)} ${escapeHTML(doctor.lastname)}</h2>
      <p>${escapeHTML(info.contactEmail || doctor.email)}</p>
    </div>

    ${details.map(([label, value]) => `
      <div class="patient-detail-item">
        <p class="patient-detail-label">${escapeHTML(label)}</p>
        <p class="patient-detail-value">${escapeHTML(value)}</p>
      </div>
    `).join("")}
  `;

  patientDetails.classList.remove("hidden");
}

function hidePatientDetails() {
  patientDetails?.classList.add("hidden");
  if (patientDetails) patientDetails.innerHTML = "";
}

function createDocumentRow(document) {
  const badgeClass = getDocumentTypeBadgeClass(document.documentType);
  const filePath = escapeHTML(document.filePath);
  const currentUser = getCurrentUser();
  const canDelete = isPatient(currentUser) && appView === "records";

  return `
    <tr>
      <td>${escapeHTML(document.documentName)}</td>

      <td>
        <span class="document-type-badge ${badgeClass}">
          ${escapeHTML(document.documentType)}
        </span>
      </td>

      <td>${escapeHTML(document.documentDate)}</td>
      <td>${escapeHTML(document.provider)}</td>

      <td class="actions-column">
        <div class="table-menu">
          <button class="table-menu-btn" type="button" aria-label="Document actions">
            <span class="material-icons">more_vert</span>
          </button>

          <div class="table-menu-list hidden">
            <button type="button" class="table-menu-option" data-action="view" data-file-path="${filePath}">
              <span class="material-icons">visibility</span>
              <span>View</span>
            </button>

            <button type="button" class="table-menu-option" data-action="download" data-file-path="${filePath}">
              <span class="material-icons">download</span>
              <span>Download</span>
            </button>

            <button type="button" class="table-menu-option danger ${canDelete ? "" : "hidden"}" data-action="delete" data-id="${escapeHTML(document.id)}">
              <span class="material-icons">delete</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function createPatientRow(patient) {
  const isClickable = appView === "patients";

  return `
    <tr>
      <td>
        <button class="patient-link" type="button" data-patient-id="${escapeHTML(patient.id)}" ${isClickable ? "" : "disabled"}>
          ${escapeHTML(patient.firstname)} ${escapeHTML(patient.lastname)}
        </button>
      </td>
      <td>${escapeHTML(patient.email)}</td>
      <td class="actions-column">
        <button class="icon-action-btn" type="button" data-relationship-delete-id="${escapeHTML(patient.relationshipId)}" aria-label="Remove patient">
          <span class="material-icons">delete</span>
        </button>
      </td>
    </tr>
  `;
}

function createDoctorRow(doctor) {
  const info = doctor.medicalInfo || {};

  return `
    <tr>
      <td>
        <button class="patient-link" type="button" data-doctor-id="${escapeHTML(doctor.id)}">
          ${escapeHTML(doctor.firstname)} ${escapeHTML(doctor.lastname)}
        </button>
      </td>
      <td>${escapeHTML(info.specialty || "Not provided")}</td>
      <td>${escapeHTML(info.workplace || "Not provided")}</td>
      <td class="actions-column">
        <button class="icon-action-btn" type="button" data-relationship-delete-id="${escapeHTML(doctor.relationshipId)}" aria-label="Remove doctor">
          <span class="material-icons">delete</span>
        </button>
      </td>
    </tr>
  `;
}

function renderDocuments(documents) {
  if (!recordsTableBody) return;

  recordsTableBody.innerHTML = documents.length
    ? documents.map(createDocumentRow).join("")
    : `<tr><td colspan="5" class="empty-state">No documents found.</td></tr>`;
}

function renderPatients(list) {
  if (!recordsTableBody) return;

  recordsTableBody.innerHTML = list.length
    ? list.map(createPatientRow).join("")
    : `<tr><td colspan="3" class="empty-state">No patients found.</td></tr>`;
}

function renderDoctors(list) {
  if (!recordsTableBody) return;

  recordsTableBody.innerHTML = list.length
    ? list.map(createDoctorRow).join("")
    : `<tr><td colspan="4" class="empty-state">No doctors found.</td></tr>`;
}

function getFilteredDocuments() {
  const searchValue = recordSearchInput?.value.trim().toLowerCase() || "";
  const selectedType = document.querySelector(".type-filter-option.active")?.dataset.type || "";

  return recordsDocuments.filter((document) => {
    const badgeClass = getDocumentTypeBadgeClass(document.documentType);
    const documentDate = new Date(`${document.documentDate}T00:00:00`);

    const matchesSearch =
      !searchValue ||
      String(document.documentName ?? "").toLowerCase().includes(searchValue) ||
      String(document.documentType ?? "").toLowerCase().includes(searchValue) ||
      String(document.provider ?? "").toLowerCase().includes(searchValue) ||
      String(document.documentDate ?? "").toLowerCase().includes(searchValue);

    const matchesType = !selectedType || badgeClass === selectedType;

    const matchesDate =
      !activeRecordsDateRange ||
      (documentDate >= activeRecordsDateRange.from && documentDate <= activeRecordsDateRange.to);

    return matchesSearch && matchesType && matchesDate;
  });
}

function getFilteredPatients() {
  const searchValue = recordSearchInput?.value.trim().toLowerCase() || "";

  return patients.filter((patient) => {
    const fullName = `${patient.firstname ?? ""} ${patient.lastname ?? ""}`.toLowerCase();

    return (
      !searchValue ||
      fullName.includes(searchValue) ||
      String(patient.email ?? "").toLowerCase().includes(searchValue) ||
      String(patient.id ?? "").includes(searchValue)
    );
  });
}

function getFilteredDoctors() {
  const searchValue = recordSearchInput?.value.trim().toLowerCase() || "";

  return doctors.filter((doctor) => {
    const fullName = `${doctor.firstname ?? ""} ${doctor.lastname ?? ""}`.toLowerCase();

    return (
      !searchValue ||
      fullName.includes(searchValue) ||
      String(doctor.email ?? "").toLowerCase().includes(searchValue) ||
      String(doctor.id ?? "").includes(searchValue)
    );
  });
}

function getSortedDocuments() {
  const filteredDocuments = getFilteredDocuments();

  if (!activeRecordsSort.key || activeRecordsSort.direction === "none") {
    return filteredDocuments;
  }

  const sortKeyMap = {
    "document-name": "documentName",
    "document-type": "documentType",
    "date-added": "documentDate",
    provider: "provider",
  };

  const field = sortKeyMap[activeRecordsSort.key];
  const directionMultiplier = activeRecordsSort.direction === "asc" ? 1 : -1;

  return filteredDocuments.sort((a, b) => {
    const aValue = String(a[field] ?? "").toLowerCase();
    const bValue = String(b[field] ?? "").toLowerCase();

    return aValue.localeCompare(bValue) * directionMultiplier;
  });
}

function renderSortedDocuments() {
  renderDocuments(getSortedDocuments());
}

function renderPatientList() {
  renderPatients(getSortedPeople(getFilteredPatients()));
}

function renderDoctorList() {
  renderDoctors(getSortedPeople(getFilteredDoctors()));
}

function getSortedPeople(list) {
  if (activeRecordsSort.key !== "person-name" || activeRecordsSort.direction === "none") {
    return list;
  }

  const directionMultiplier = activeRecordsSort.direction === "asc" ? 1 : -1;

  return [...list].sort((a, b) => {
    const aName = `${a.lastname ?? ""} ${a.firstname ?? ""}`.toLowerCase();
    const bName = `${b.lastname ?? ""} ${b.firstname ?? ""}`.toLowerCase();

    return aName.localeCompare(bName) * directionMultiplier;
  });
}

async function loadDocuments() {
  if (!recordsTableBody) return;

  const currentUser = getCurrentUser();

  if (!currentUser?.id) {
    recordsDocuments = [];
    renderSortedDocuments();
    return;
  }

  try {
    const targetUserId = selectedPatient?.id || currentUser.id;
    const res = await fetch(`/api/documents?userId=${encodeURIComponent(targetUserId)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      console.error(data.message || "Could not load documents");
      return;
    }

    recordsDocuments = data.documents || [];
    renderSortedDocuments();

  } catch (err) {
    console.error(err);
  }
}

async function loadPatients() {
  const currentUser = getCurrentUser();

  if (!currentUser?.id) return;

  try {
    const res = await fetch(`/api/patients?providerId=${encodeURIComponent(currentUser.id)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      console.error(data.message || "Could not load patients");
      return;
    }

    patients = data.patients || [];
    renderPatientList();

  } catch (err) {
    console.error(err);
  }
}

async function loadDoctors() {
  const currentUser = getCurrentUser();

  if (!currentUser?.id) return;

  try {
    const res = await fetch(`/api/doctors?patientId=${encodeURIComponent(currentUser.id)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      console.error(data.message || "Could not load doctors");
      return;
    }

    doctors = data.doctors || [];
    renderDoctorList();

  } catch (err) {
    console.error(err);
  }
}

async function loadDocumentRequests() {
  const currentUser = getCurrentUser();

  if (!currentUser?.id || !isPatient(currentUser)) {
    documentRequests = [];
    renderNotifications();
    updateNotificationsBadge();
    return;
  }

  try {
    const res = await fetch(`/api/document-requests?patientId=${encodeURIComponent(currentUser.id)}&status=pending`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      console.error(data.message || "Could not load document requests");
      return;
    }

    documentRequests = data.requests || [];
    renderNotifications();
    updateNotificationsBadge();

  } catch (err) {
    console.error(err);
  }
}

function updateNotificationsBadge() {
  if (!notificationsCount) return;

  const total = documentRequests.length + careTeamRequests.length;

  notificationsCount.textContent = String(total);
  notificationsCount.classList.toggle("hidden", total === 0);
}

async function loadCareTeamRequests() {
  const currentUser = getCurrentUser();

  if (!currentUser?.id || (!isPatient(currentUser) && !isProvider(currentUser))) {
    careTeamRequests = [];
    renderNotifications();
    updateNotificationsBadge();
    return;
  }

  try {
    const res = await fetch(`/api/care-team-requests?userId=${encodeURIComponent(currentUser.id)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      console.error(data.message || "Could not load care team requests");
      return;
    }

    careTeamRequests = data.requests || [];
    renderNotifications();
    updateNotificationsBadge();

  } catch (err) {
    console.error(err);
  }
}

function renderNotifications() {
  if (!notificationsList) return;

  const filteredDocumentRequests = getFilteredDocumentRequests();
  const filteredCareTeamRequests = getFilteredCareTeamRequests();

  const documentRequestCards = filteredDocumentRequests.map((request) => `
      <div class="notification-card">
        <div>
          <p class="notification-title">${escapeHTML(request.documentName)}</p>
          <p class="notification-meta">
            ${escapeHTML(request.provider)} requested to add a ${escapeHTML(request.documentType)} dated ${escapeHTML(request.documentDate)}.
            Requested ${escapeHTML(formatNotificationDate(request.createdAt))}.
          </p>
        </div>

        <div class="notification-actions">
          <button class="notification-action-btn" type="button" data-request-action="view" data-file-path="${escapeHTML(request.filePath)}">
            <span class="material-icons">visibility</span>
            View
          </button>

          <button class="notification-action-btn" type="button" data-request-action="reject" data-request-id="${escapeHTML(request.id)}">
            Reject
          </button>

          <button class="notification-action-btn approve" type="button" data-request-action="approve" data-request-id="${escapeHTML(request.id)}">
            Approve
          </button>
        </div>
      </div>
    `);

  const careTeamRequestCards = filteredCareTeamRequests.map((request) => {
    const requester = request.requester || {};
    const requesterLabel = requester.accountType === "Patient" ? "patient" : "doctor";

    return `
      <div class="notification-card">
        <div>
          <p class="notification-title">New ${requesterLabel} request</p>
          <p class="notification-meta">
            ${escapeHTML(requester.firstname)} ${escapeHTML(requester.lastname)} wants to connect with you on SoftCare.
            Requested ${escapeHTML(formatNotificationDate(request.createdAt))}.
          </p>
        </div>

        <div class="notification-actions">
          <button class="notification-action-btn" type="button" data-care-team-action="reject" data-request-id="${escapeHTML(request.id)}">
            Reject
          </button>

          <button class="notification-action-btn approve" type="button" data-care-team-action="approve" data-request-id="${escapeHTML(request.id)}">
            Approve
          </button>
        </div>
      </div>
    `;
  });

  const cards = [...documentRequestCards, ...careTeamRequestCards];

  notificationsList.innerHTML = cards.length
    ? cards.join("")
    : `<div class="empty-state">No pending notifications.</div>`;
}

function formatNotificationDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isWithinActiveNotificationDateRange(value) {
  if (!activeRecordsDateRange || !value) return true;

  const notificationDate = new Date(value);
  notificationDate.setHours(0, 0, 0, 0);

  return notificationDate >= activeRecordsDateRange.from && notificationDate <= activeRecordsDateRange.to;
}

function getFilteredDocumentRequests() {
  const searchValue = recordSearchInput?.value.trim().toLowerCase() || "";

  return documentRequests.filter((request) => {
    const searchText = [
      request.documentName,
      request.documentType,
      request.documentDate,
      request.provider,
      formatNotificationDate(request.createdAt),
    ].join(" ").toLowerCase();

    return (!searchValue || searchText.includes(searchValue)) && isWithinActiveNotificationDateRange(request.createdAt);
  });
}

function getFilteredCareTeamRequests() {
  const searchValue = recordSearchInput?.value.trim().toLowerCase() || "";

  return careTeamRequests.filter((request) => {
    const requester = request.requester || {};
    const requesterLabel = requester.accountType === "Patient" ? "patient" : "doctor";
    const searchText = [
      `new ${requesterLabel} request`,
      requester.firstname,
      requester.lastname,
      requester.email,
      formatNotificationDate(request.createdAt),
    ].join(" ").toLowerCase();

    return (!searchValue || searchText.includes(searchValue)) && isWithinActiveNotificationDateRange(request.createdAt);
  });
}

function fillProfileForm(user) {
  if (!profileForm || !user) return;

  const medicalInfo = user.medicalInfo || {};
  const userIsProvider = user.accountType === "Healthcare Provider";

  patientProfileSection?.classList.toggle("hidden", userIsProvider);
  doctorProfileSection?.classList.toggle("hidden", !userIsProvider);

  profileForm.firstname.value = user.firstname || "";
  profileForm.lastname.value = user.lastname || "";
  profileForm.email.value = user.email || "";
  profileForm.dateOfBirth.value = medicalInfo.dateOfBirth || "";
  profileForm.bloodType.value = medicalInfo.bloodType || "";
  profileForm.allergies.value = medicalInfo.allergies || "";
  profileForm.conditions.value = medicalInfo.conditions || "";
  profileForm.medications.value = medicalInfo.medications || "";
  profileForm.emergencyContact.value = medicalInfo.emergencyContact || "";
  profileForm.specialty.value = medicalInfo.specialty || "";
  profileForm.phone.value = medicalInfo.phone || "";
  profileForm.contactEmail.value = medicalInfo.contactEmail || "";
  profileForm.workplace.value = medicalInfo.workplace || "";
  profileForm.address.value = medicalInfo.address || "";
  initialProfileSnapshot = getProfileSnapshot();
  updateProfileSaveButton();
}

function getProfileSnapshot() {
  if (!profileForm) return "";

  const formValues = getFormData(profileForm);

  return JSON.stringify(formValues);
}

function updateProfileSaveButton() {
  if (!profileSaveBtn) return;

  profileSaveBtn.disabled = getProfileSnapshot() === initialProfileSnapshot;
}

async function loadProfile() {
  const currentUser = getCurrentUser();

  if (!currentUser?.id) return;

  try {
    const res = await fetch(`/api/profile?userId=${encodeURIComponent(currentUser.id)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      console.error(data.message || "Could not load profile");
      return;
    }

    fillProfileForm(data.user);

  } catch (err) {
    console.error(err);
  }
}

function showProfileView() {
  appView = "profile";
  selectedPatient = null;

  setPageTitle("My Profile");
  hidePatientDetails();
  showProfilePanel();
  patientBackBtn?.classList.add("hidden");
  uploadDocBtn?.classList.add("hidden");
  recordsControls?.classList.add("hidden");
  loadProfile();
}

function showPatientRecordsView() {
  appView = "records";
  selectedPatient = null;

  setPageTitle("My Records");
  hidePatientDetails();
  showTable();
  renderTableHeaders([
    { label: "Document Name", sort: "document-name" },
    { label: "Type", sort: "document-type" },
    { label: "Date Added", sort: "date-added" },
    { label: "Provider", sort: "provider" },
    { label: "", className: "actions-column" },
  ]);

  patientBackBtn?.classList.add("hidden");
  uploadDocBtn?.classList.remove("hidden");
  if (uploadDocBtnText) uploadDocBtnText.textContent = "Upload Document";

  recordsControls?.classList.remove("hidden");
  setControlsVisibility({ search: true, type: true, date: true, clear: true });
  loadDocuments();
  loadDocumentRequests();
  loadCareTeamRequests();
}

function showPatientNotificationsView() {
  appView = "notifications";

  setPageTitle("Notifications");
  hidePatientDetails();
  showNotificationsPanel();
  patientBackBtn?.classList.add("hidden");
  uploadDocBtn?.classList.add("hidden");
  recordsControls?.classList.remove("hidden");
  setControlsVisibility({ search: true, type: false, date: true, clear: true });
  resetRecordsFilters();
  loadDocumentRequests();
  loadCareTeamRequests();
}

function showPatientDoctorsView() {
  appView = "doctors";
  selectedPatient = null;

  setPageTitle("My Doctors");
  hidePatientDetails();
  showTable();
  renderTableHeaders([
    { label: "Doctor Name", sort: "person-name" },
    { label: "Doctor Type" },
    { label: "Workplace" },
    { label: "", className: "actions-column" },
  ]);

  patientBackBtn?.classList.add("hidden");
  uploadDocBtn?.classList.remove("hidden");
  if (uploadDocBtnText) uploadDocBtnText.textContent = "Add Doctor";

  recordsControls?.classList.remove("hidden");
  setControlsVisibility({ search: true, type: false, date: false, clear: true });
  resetRecordsFilters();
  loadDoctors();
}

function showProviderPatientsView() {
  appView = "patients";
  selectedPatient = null;

  setPageTitle("My Patients");
  hidePatientDetails();
  showTable();
  renderTableHeaders([
    { label: "Patient Name", sort: "person-name" },
    { label: "Email" },
    { label: "", className: "actions-column" },
  ]);

  patientBackBtn?.classList.add("hidden");
  uploadDocBtn?.classList.remove("hidden");
  if (uploadDocBtnText) uploadDocBtnText.textContent = "Add Patient";
  recordsControls?.classList.remove("hidden");
  setControlsVisibility({ search: true, type: false, date: false, clear: true });
  resetRecordsFilters();
  loadPatients();
  loadCareTeamRequests();
}

async function showProviderPatientRecordsView(patient) {
  appView = "patient-records";
  selectedPatient = patient;

  setPageTitle("Back");
  showPatientDetails(patient);
  showTable();
  renderTableHeaders([
    { label: "Document Name", sort: "document-name" },
    { label: "Type", sort: "document-type" },
    { label: "Date Added", sort: "date-added" },
    { label: "Provider", sort: "provider" },
    { label: "", className: "actions-column" },
  ]);

  patientBackBtn?.classList.remove("hidden");
  uploadDocBtn?.classList.remove("hidden");
  if (uploadDocBtnText) uploadDocBtnText.textContent = "Add Document";

  recordsControls?.classList.remove("hidden");
  setControlsVisibility({ search: true, type: true, date: true, clear: true });
  resetRecordsFilters();
  await loadDocuments();
}

function showPatientDoctorDetailsView(doctor) {
  appView = "doctor-details";

  setPageTitle("Back");
  showDoctorDetails(doctor);
  showDetailsOnlyPanel();

  patientBackBtn?.classList.remove("hidden");
  uploadDocBtn?.classList.add("hidden");
  recordsControls?.classList.add("hidden");
}

function setupDashboardForCurrentUser() {
  const currentUser = getCurrentUser();
  const recordsNavText = document.querySelector('[data-target="my-records"] .nav-text');

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.target === "my-records");
  });

  if (isProvider(currentUser)) {
    if (recordsNavText) recordsNavText.textContent = "My Patients";
    careTeamNavBtn?.classList.add("hidden");
    notificationsNavBtn?.classList.remove("hidden");
    showProviderPatientsView();
    return;
  }

  if (recordsNavText) recordsNavText.textContent = "My Records";
  careTeamNavBtn?.classList.toggle("hidden", !isPatient(currentUser));
  notificationsNavBtn?.classList.toggle("hidden", !isPatient(currentUser));
  showPatientRecordsView();
}



/* ------------------------------------------------------------------------------------------ */
/* UPLOAD DOCUMENT MODAL */

const uploadDocBtn = document.getElementById("upload-doc-btn");
const uploadModal = document.getElementById("upload-modal");
const uploadModalClose = document.getElementById("upload-modal-close");
const uploadDropzone = document.getElementById("upload-dropzone");
const uploadFileInput = document.getElementById("upload-file-input");
const uploadError = document.getElementById("upload-error");
const uploadFileCard = document.getElementById("upload-file-card");
const uploadFileName = document.getElementById("upload-file-name");
const uploadFileSize = document.getElementById("upload-file-size");
const uploadFileRemove = document.getElementById("upload-file-remove");
const uploadDocumentForm = document.getElementById("upload-document-form");

// Variable to store the currently selected file for upload
let selectedUploadFile = null;

const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_UPLOAD_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".dcm", ".dicom"];
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

function showRelationshipError(message) {
  const errorText = relationshipError?.querySelector(".msg-error-text");

  if (errorText) errorText.textContent = message;
  relationshipError?.classList.remove("hidden");
}

function hideRelationshipError() {
  const errorText = relationshipError?.querySelector(".msg-error-text");

  if (errorText) errorText.textContent = "";
  relationshipError?.classList.add("hidden");
}

function getFilteredRelationshipCandidates() {
  const searchValue = relationshipSearchInput?.value.trim().toLowerCase() || "";

  return relationshipCandidates.filter((user) => {
    const fullName = `${user.firstname ?? ""} ${user.lastname ?? ""}`.toLowerCase();
    const info = user.medicalInfo || {};
    const profileText = `${info.specialty ?? ""} ${info.workplace ?? ""}`.toLowerCase();

    return (
      !searchValue ||
      fullName.includes(searchValue) ||
      String(user.email ?? "").toLowerCase().includes(searchValue) ||
      profileText.includes(searchValue)
    );
  });
}

function renderRelationshipCandidates() {
  if (!relationshipList) return;

  const candidates = getFilteredRelationshipCandidates();

  relationshipList.innerHTML = candidates.length
    ? candidates.map((user) => {
      const statusText = user.relationshipStatus === "approved"
        ? isProvider() ? "Already your patient" : "Already your doctor"
        : user.relationshipStatus === "pending"
          ? "Pending approval"
          : "";

      return `
      <div class="relationship-row">
        <div>
          <p class="relationship-name">${escapeHTML(user.firstname)} ${escapeHTML(user.lastname)}</p>
          <p class="relationship-email">${escapeHTML(user.email)}</p>
        </div>

        ${statusText
          ? `<span class="relationship-status">${escapeHTML(statusText)}</span>`
          : `<button class="relationship-add-btn" type="button" data-add-user-id="${escapeHTML(user.id)}">
              <span class="material-icons">person_add</span>
              Add
            </button>`
        }
      </div>
    `;
    }).join("")
    : `<div class="empty-state">No matches found.</div>`;
}

async function openRelationshipModal() {
  const currentUser = getCurrentUser();

  if (!currentUser?.id) return;

  hideRelationshipError();
  if (relationshipSearchInput) relationshipSearchInput.value = "";
  relationshipSearchClearBtn?.classList.add("hidden");
  relationshipCandidates = [];

  if (relationshipModalTitle) {
    relationshipModalTitle.textContent = isProvider(currentUser) ? "Add Patient" : "Add Doctor";
  }

  relationshipModal?.classList.remove("hidden");
  renderRelationshipCandidates();

  try {
    const res = await fetch(`/api/care-team-candidates?requesterId=${encodeURIComponent(currentUser.id)}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      showRelationshipError(data.message || "Could not load users.");
      return;
    }

    relationshipCandidates = data.users || [];
    renderRelationshipCandidates();

  } catch (err) {
    console.error(err);
    showRelationshipError("System error, please try again.");
  }
}

function closeRelationshipModal() {
  relationshipModal?.classList.add("hidden");
  relationshipCandidates = [];
  if (relationshipSearchInput) relationshipSearchInput.value = "";
  relationshipSearchClearBtn?.classList.add("hidden");
  hideRelationshipError();
}

// Opening upload modal
function openUploadModal() {
  uploadModal?.classList.remove("hidden");
}

// Closing upload modal and clearing selected file
function closeUploadModal() {
  uploadModal?.classList.add("hidden");
  clearUploadFile();
}

// Showing upload error alert
function showUploadError(message) {
  const errorText = uploadError?.querySelector(".msg-error-text");

  if (errorText) errorText.textContent = message;
  uploadError?.classList.remove("hidden");
}

// Hiding upload error alert
function hideUploadError() {
  const errorText = uploadError?.querySelector(".msg-error-text");

  if (errorText) errorText.textContent = "";
  uploadError?.classList.add("hidden");
}

// Formatting file size for display
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Checking allowed file type and extension
function isAllowedUploadFile(file) {
  const fileName = file.name.toLowerCase();

  const hasAllowedType = ALLOWED_UPLOAD_TYPES.includes(file.type);
  const hasAllowedExtension = ALLOWED_UPLOAD_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension)
  );

  return hasAllowedType || hasAllowedExtension;
}

// Displaying selected file
function setUploadFile(file) {
  hideUploadError();

  selectedUploadFile = file;

  uploadFileName.textContent = file.name;
  uploadFileSize.textContent = formatFileSize(file.size);

  uploadDropzone.classList.add("hidden");
  uploadFileCard.classList.remove("hidden");
  uploadDocumentForm?.classList.remove("hidden");
}

// Clearing selected file
function clearUploadFile() {
  selectedUploadFile = null;

  uploadFileInput.value = "";
  uploadFileName.textContent = "";
  uploadFileSize.textContent = "";

  uploadFileCard.classList.add("hidden");
  uploadDropzone.classList.remove("hidden");
  uploadDocumentForm?.classList.add("hidden");
  uploadDocumentForm?.reset();

  hideUploadError();
}

// Handling selected or dropped files
function handleUploadFiles(files) {
  if (!files || files.length === 0) return;

  if (files.length > 1) {
    showUploadError("You can only upload 1 document at a time.");
    return;
  }

  const file = files[0];

  if (!isAllowedUploadFile(file)) {
    showUploadError("Document must be a PDF, DOC, DOCX, JPG, PNG, or DICOM file.");
    return;
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    showUploadError("Document must be 50MB or smaller.");
    return;
  }

  setUploadFile(file);
}

// Opening modal when Upload Document button is clicked
uploadDocBtn?.addEventListener("click", () => {
  if (appView === "patients" || appView === "doctors") {
    openRelationshipModal();
    return;
  }

  const modalTitle = document.getElementById("upload-modal-title");

  if (modalTitle) {
    modalTitle.textContent = appView === "patient-records" ? "Add Document" : "Upload Document";
  }

  openUploadModal();
});

relationshipModalClose?.addEventListener("click", closeRelationshipModal);

relationshipModal?.addEventListener("click", (e) => {
  if (e.target === relationshipModal) closeRelationshipModal();
});

relationshipSearchInput?.addEventListener("input", () => {
  relationshipSearchClearBtn?.classList.toggle("hidden", !relationshipSearchInput.value);
  renderRelationshipCandidates();
});

relationshipSearchClearBtn?.addEventListener("click", () => {
  relationshipSearchInput.value = "";
  relationshipSearchClearBtn.classList.add("hidden");
  relationshipSearchInput.focus();
  renderRelationshipCandidates();
});

relationshipList?.addEventListener("click", async (e) => {
  const button = e.target.closest("[data-add-user-id]");

  if (!button) return;

  await sendCareTeamRequest(button.dataset.addUserId);
});

// Closing modal when close button is clicked
uploadModalClose?.addEventListener("click", closeUploadModal);

// Closing modal when overlay background is clicked
uploadModal?.addEventListener("click", (e) => {
  if (e.target === uploadModal) closeUploadModal();
});

// Handling selected file from file browser
uploadFileInput?.addEventListener("change", () => {
  handleUploadFiles(uploadFileInput.files);
});

// Highlighting dropzone when file is dragged over it
uploadDropzone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadDropzone.classList.add("drag-over");
});

// Removing highlight when file leaves dropzone
uploadDropzone?.addEventListener("dragleave", () => {
  uploadDropzone.classList.remove("drag-over");
});

// Handling dropped file
uploadDropzone?.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadDropzone.classList.remove("drag-over");

  handleUploadFiles(e.dataTransfer.files);
});

// Removing selected file
uploadFileRemove?.addEventListener("click", clearUploadFile);

// Handling form submission to upload document
async function handleUploadDocumentSubmit(e) {
  e.preventDefault();

  hideUploadError();

  if (!selectedUploadFile) {
    showUploadError("Please select a document first.");
    return;
  }

  const formValues = getFormData(uploadDocumentForm);
  const currentUser = getCurrentUser();
  const formData = new FormData();

  if (!currentUser?.id) {
    showUploadError("Please log in again before uploading a document.");
    return;
  }

  if (isProvider(currentUser) && !selectedPatient?.id) {
    showUploadError("Select a patient before requesting a document.");
    return;
  }

  formData.append("file", selectedUploadFile);

  if (isProvider(currentUser)) {
    formData.append("providerId", currentUser.id);
    formData.append("patientId", selectedPatient.id);
  } else {
    formData.append("userId", currentUser.id);
  }

  formData.append("documentName", formValues.documentName);
  formData.append("documentType", formValues.documentType);
  formData.append("provider", formValues.provider);
  formData.append("documentDate", formValues.documentDate);

  try {
    const uploadUrl = isProvider(currentUser) ? "/api/document-requests" : "/api/upload";
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      showUploadError(data.message || "Upload failed. Please try again.");
      return;
    }

    closeUploadModal();
    showTemporarySuccess(
      "home-success",
      isProvider(currentUser)
        ? "Document request sent to the patient."
        : "Document uploaded successfully!"
    );

    if (!isProvider(currentUser)) {
      await loadDocuments();
    }

  } catch (err) {
    console.error(err);
    showUploadError("System error, please try again.");
  }
}



/* ------------------------------------------------------------------------------------------ */
/* SEARCH FILTER */

const recordSearchInput = document.getElementById("record-search-input");
const searchClearBtn = document.getElementById("search-clear-btn");

recordSearchInput?.addEventListener("input", () => {
  searchClearBtn?.classList.toggle("hidden", !recordSearchInput.value);
  updateRecordsClearButton();

  if (appView === "patients") {
    renderPatientList();
    return;
  }

  if (appView === "doctors") {
    renderDoctorList();
    return;
  }

  if (appView === "notifications") {
    renderNotifications();
    return;
  }

  renderSortedDocuments();
});

searchClearBtn?.addEventListener("click", () => {
  recordSearchInput.value = "";
  searchClearBtn.classList.add("hidden");
  recordSearchInput.focus();
  updateRecordsClearButton();

  if (appView === "patients") {
    renderPatientList();
    return;
  }

  if (appView === "doctors") {
    renderDoctorList();
    return;
  }

  if (appView === "notifications") {
    renderNotifications();
    return;
  }

  renderSortedDocuments();
});



/* ------------------------------------------------------------------------------------------ */
/* TYPE FILTER */

const typeFilterBtn = document.getElementById("type-filter-btn");
const typeFilterMenu = document.getElementById("type-filter-menu");
const typeFilterLabel = document.getElementById("type-filter-label");
const typeFilterOptions = document.querySelectorAll(".type-filter-option");

typeFilterBtn?.addEventListener("click", (e) => {
  e.stopPropagation();

  dateRangeMenu?.classList.add("hidden");
  typeFilterMenu.classList.toggle("hidden");
});

typeFilterMenu?.addEventListener("click", (e) => {
  e.stopPropagation();
});

typeFilterOptions.forEach((option) => {
  option.addEventListener("click", () => {
    typeFilterOptions.forEach((item) => item.classList.remove("active"));

    option.classList.add("active");
    typeFilterLabel.textContent = option.textContent;
    typeFilterMenu.classList.add("hidden");

    updateRecordsClearButton();
    renderSortedDocuments();
  });
});



/* ------------------------------------------------------------------------------------------ */
/* DATE RANGE FILTER */

/* Elements */
const dateRangeBtn = document.getElementById("date-range-btn");
const dateRangeMenu = document.getElementById("date-range-menu");
const dateRangeLabel = document.getElementById("date-range-label");

const dateFromInput = document.getElementById("date-from");
const dateToInput = document.getElementById("date-to");

const dateApplyBtn = document.getElementById("date-apply-btn");
const dateCancelBtn = document.getElementById("date-cancel-btn");

const calendarDays = document.getElementById("calendar-days");
const calendarMonth = document.getElementById("calendar-month");
const calendarPrev = document.getElementById("calendar-prev");
const calendarNext = document.getElementById("calendar-next");

/* State */
let visibleMonth = new Date(2026, 4, 1);
let selectingRangeStart = true;



/* DATE HELPERS */

// Converts "4/3/26" into a Date object
function parseShortDate(value) {
  const [month, day, year] = value.split("/").map(Number);
  return new Date(2000 + year, month - 1, day);
}

// Converts a Date object into "4/3/26"
function formatShortDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

// Converts a Date object into "Apr 3, 2026"
function formatLongDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Checks whether two dates are the same calendar day
function sameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

// Updates the button label after Apply is clicked
function updateDateRangeLabel() {
  const fromDate = parseShortDate(dateFromInput.value);
  const toDate = parseShortDate(dateToInput.value);

  dateRangeLabel.textContent = `${formatLongDate(fromDate)} - ${formatLongDate(toDate)}`;
}



/* CALENDAR RENDERING */

function renderCalendar() {
  calendarDays.innerHTML = "";

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  calendarMonth.textContent = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1);

  // Makes the calendar start on Monday
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - mondayOffset);

  const fromDate = parseShortDate(dateFromInput.value);
  const toDate = parseShortDate(dateToInput.value);

  // Always render 6 full weeks
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.textContent = date.getDate();

    // Style days outside the current month
    if (date.getMonth() !== month) {
      button.classList.add("muted");
    }

    // Highlight days inside the selected range
    if (date >= fromDate && date <= toDate) {
      button.classList.add("in-range");
    }

    // Highlight range start and end
    if (sameDay(date, fromDate) || sameDay(date, toDate)) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      selectCalendarDate(date);
    });

    calendarDays.appendChild(button);
  }
}



/* DATE SELECTION */

// Handles start date click, then end date click
function selectCalendarDate(date) {
  if (selectingRangeStart) {
    dateFromInput.value = formatShortDate(date);
    dateToInput.value = formatShortDate(date);
    selectingRangeStart = false;
  } else {
    const startDate = parseShortDate(dateFromInput.value);
    const endDate = date;

    if (endDate < startDate) {
      dateFromInput.value = formatShortDate(endDate);
      dateToInput.value = formatShortDate(startDate);
    } else {
      dateToInput.value = formatShortDate(endDate);
    }

    selectingRangeStart = true;
  }

  renderCalendar();
}

// Updates inputs when user clicks Last week / Last month / Last year
function applyPresetRange(range) {
  const today = new Date();
  const from = new Date();

  if (range === "week") from.setDate(today.getDate() - 7);
  if (range === "month") from.setMonth(today.getMonth() - 1);
  if (range === "year") from.setFullYear(today.getFullYear() - 1);
  if (range === "today") from.setTime(today.getTime());

  dateFromInput.value = formatShortDate(from);
  dateToInput.value = formatShortDate(today);
  selectingRangeStart = true;

  renderCalendar();
}



/* EVENT LISTENERS */

// Open and close date range menu
dateRangeBtn?.addEventListener("click", (e) => {
  e.stopPropagation();

  typeFilterMenu?.classList.add("hidden");
  dateRangeMenu.classList.toggle("hidden");
});

// Prevent clicks inside the menu from closing it
dateRangeMenu?.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Preset buttons
document.querySelectorAll("[data-range]").forEach((button) => {
  button.addEventListener("click", () => {
    applyPresetRange(button.dataset.range);
    updateRecordsClearButton();
  });
});

// Apply selected range to button label
dateApplyBtn?.addEventListener("click", () => {
  updateDateRangeLabel();

  const fromDate = parseShortDate(dateFromInput.value);
  const toDate = parseShortDate(dateToInput.value);

  activeRecordsDateRange = {
    from: fromDate <= toDate ? fromDate : toDate,
    to: fromDate <= toDate ? toDate : fromDate,
  };

  updateRecordsClearButton();

  if (appView === "notifications") {
    renderNotifications();
  } else {
    renderSortedDocuments();
  }

  dateRangeMenu.classList.add("hidden");
});

// Close menu without applying
dateCancelBtn?.addEventListener("click", () => {
  dateRangeMenu.classList.add("hidden");
});

// Move calendar month backward
calendarPrev?.addEventListener("click", () => {
  visibleMonth.setMonth(visibleMonth.getMonth() - 1);
  renderCalendar();
});

// Move calendar month forward
calendarNext?.addEventListener("click", () => {
  visibleMonth.setMonth(visibleMonth.getMonth() + 1);
  renderCalendar();
});

// Re-render calendar if user manually edits the date inputs
dateFromInput?.addEventListener("input", () => {
  renderCalendar();
  updateRecordsClearButton();
});

dateToInput?.addEventListener("input", () => {
  renderCalendar();
  updateRecordsClearButton();
});



/* ------------------------------------------------------------------------------------------ */
/* FILTER MENUS */

// Close filter menus when clicking outside or clicking other buttons
document.addEventListener("click", (e) => {
  const clickedInsideTypeFilter =
    typeFilterBtn?.contains(e.target) || typeFilterMenu?.contains(e.target);

  const clickedInsideDateFilter =
    dateRangeBtn?.contains(e.target) || dateRangeMenu?.contains(e.target);

  if (!clickedInsideTypeFilter) {
    typeFilterMenu?.classList.add("hidden");
  }

  if (!clickedInsideDateFilter) {
    dateRangeMenu?.classList.add("hidden");
  }
});



/* ------------------------------------------------------------------------------------------ */
/* RECORDS CLEAR BUTTON */

const recordsClearBtn = document.getElementById("records-clear-btn");

const DEFAULT_TYPE_LABEL = "All types";
const DEFAULT_DATE_LABEL = "Date Range";
const DEFAULT_DATE_FROM = "04/03/26";
const DEFAULT_DATE_TO = "05/03/26";

function hasActiveFilters() {
  const hasSearch = Boolean(recordSearchInput?.value);
  const hasType = typeFilterLabel?.textContent !== DEFAULT_TYPE_LABEL;
  const hasDate = activeRecordsDateRange !== null;

  return hasSearch || hasType || hasDate;
}

function updateRecordsClearButton() {
  recordsClearBtn?.classList.toggle("hidden", !hasActiveFilters());
}

function resetRecordsFilters() {
  recordSearchInput.value = "";
  searchClearBtn?.classList.add("hidden");

  typeFilterLabel.textContent = DEFAULT_TYPE_LABEL;
  typeFilterOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.type === "");
  });

  dateFromInput.value = DEFAULT_DATE_FROM;
  dateToInput.value = DEFAULT_DATE_TO;
  activeRecordsDateRange = null;
  dateRangeLabel.textContent = DEFAULT_DATE_LABEL;
  renderCalendar();

  typeFilterMenu?.classList.add("hidden");
  dateRangeMenu?.classList.add("hidden");

  updateRecordsClearButton();

  if (appView === "patients") {
    renderPatientList();
    return;
  }

  if (appView === "doctors") {
    renderDoctorList();
    return;
  }

  if (appView === "notifications") {
    renderNotifications();
    return;
  }

  renderSortedDocuments();
}

recordsClearBtn?.addEventListener("click", resetRecordsFilters);



/* ------------------------------------------------------------------------------------------ */
/* TABLE SORT BUTTONS */

let tableSortButtons = [];

function getNextSortDirection(currentDirection) {
  if (currentDirection === "none") return "asc";
  if (currentDirection === "asc") return "desc";
  return "none";
}

function getSortIcon(direction) {
  if (direction === "asc") return "keyboard_arrow_up";
  if (direction === "desc") return "keyboard_arrow_down";
  return "unfold_more";
}

function setupTableSortButtons() {
  tableSortButtons = document.querySelectorAll(".table-sort-btn");

  tableSortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextDirection = getNextSortDirection(button.dataset.direction);
      const sortKey = button.dataset.sort;

      tableSortButtons.forEach((otherButton) => {
        otherButton.dataset.direction = "none";
        otherButton.classList.remove("active");
        otherButton.querySelector(".material-icons").textContent = "unfold_more";
      });

      button.dataset.direction = nextDirection;
      button.querySelector(".material-icons").textContent = getSortIcon(nextDirection);

      if (nextDirection !== "none") {
        button.classList.add("active");
      }

      activeRecordsSort = {
        key: nextDirection === "none" ? "" : sortKey,
        direction: nextDirection,
      };

      if (appView === "patients") {
        renderPatientList();
        return;
      }

      if (appView === "doctors" || appView === "doctor-details") {
        renderDoctorList();
        return;
      }

      renderSortedDocuments();
    });
  });
}



/* ------------------------------------------------------------------------------------------ */
/* TABLE ACTION MENUS */

function closeTableMenus() {
  document.querySelectorAll(".table-menu").forEach((menu) => {
    menu.querySelector(".table-menu-list")?.classList.add("hidden");
    menu.classList.remove("open-up");
  });
}

document.addEventListener("click", (e) => {
  const button = e.target.closest(".table-menu-btn");

  if (!button) return;

  e.stopPropagation();

  const menu = button.closest(".table-menu");
  const list = menu?.querySelector(".table-menu-list");

  if (!menu || !list) return;

  const wasHidden = list.classList.contains("hidden");

  closeTableMenus();

  if (!wasHidden) return;

  list.classList.remove("hidden");

  const menuRect = list.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  if (menuRect.bottom > viewportHeight - 8) {
    menu.classList.add("open-up");
  }
});

document.addEventListener("click", (e) => {
  const patientButton = e.target.closest(".patient-link");

  if (patientButton?.dataset.patientId) {
    const patient = patients.find((item) => String(item.id) === patientButton.dataset.patientId);

    if (patient) showProviderPatientRecordsView(patient);
    return;
  }

  if (patientButton?.dataset.doctorId) {
    const doctor = doctors.find((item) => String(item.id) === patientButton.dataset.doctorId);

    if (doctor) showPatientDoctorDetailsView(doctor);
    return;
  }

  const relationshipDeleteButton = e.target.closest("[data-relationship-delete-id]");

  if (relationshipDeleteButton) {
    deleteRelationship(relationshipDeleteButton.dataset.relationshipDeleteId);
    return;
  }

  const option = e.target.closest(".table-menu-option");

  if (!option) return;

  e.stopPropagation();

  const action = option.dataset.action;
  const filePath = option.dataset.filePath;
  const id = option.dataset.id;

  closeTableMenus();

  if (action === "view" && filePath) {
    window.open(filePath, "_blank");
  }

  if (action === "download" && filePath) {
    const link = document.createElement("a");
    link.href = filePath;
    link.download = "";
    link.click();

    showTemporarySuccess("home-success", "Document download started.");
  }

  if (action === "delete" && id) {
    deleteDocument(id);
  }
});

document.addEventListener("click", async (e) => {
  const requestButton = e.target.closest("[data-request-action]");

  if (!requestButton) return;

  const action = requestButton.dataset.requestAction;
  const filePath = requestButton.dataset.filePath;
  const requestId = requestButton.dataset.requestId;

  if (action === "view" && filePath) {
    window.open(filePath, "_blank");
    return;
  }

  if ((action === "approve" || action === "reject") && requestId) {
    await updateDocumentRequest(requestId, action);
  }
});

document.addEventListener("click", async (e) => {
  const requestButton = e.target.closest("[data-care-team-action]");

  if (!requestButton) return;

  const action = requestButton.dataset.careTeamAction;
  const requestId = requestButton.dataset.requestId;

  if ((action === "approve" || action === "reject") && requestId) {
    await updateCareTeamRequest(requestId, action);
  }
});

document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;
    const currentUser = getCurrentUser();

    if (target === undefined) return;

    document.querySelectorAll(".nav-btn").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    if (target === "profile") {
      showProfileView();
      return;
    }

    if (target === "notifications" && (isPatient(currentUser) || isProvider(currentUser))) {
      showPatientNotificationsView();
      return;
    }

    if (target === "care-team" && isPatient(currentUser)) {
      showPatientDoctorsView();
      return;
    }

    if (isProvider(currentUser)) {
      showProviderPatientsView();
      return;
    }

    showPatientRecordsView();
  });
});

patientBackBtn?.addEventListener("click", () => {
  if (appView === "doctor-details") {
    showPatientDoctorsView();
    return;
  }

  showProviderPatientsView();
});

document.addEventListener("click", (e) => {
  if (e.target.closest(".table-menu")) return;

  closeTableMenus();
});

async function deleteDocument(id) {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser?.id) return;

    const res = await fetch(`/api/documents/${id}?userId=${encodeURIComponent(currentUser.id)}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      console.error(data.message || "Could not delete document.");
      return;
    }

    showTemporarySuccess("home-success", "Document deleted successfully.");
    await loadDocuments();

  } catch (err) {
    console.error(err);
  }
}

async function deleteRelationship(id) {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser?.id || !id) return;

    const res = await fetch(`/api/care-team-requests/${id}?userId=${encodeURIComponent(currentUser.id)}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      console.error(data.message || "Could not remove connection.");
      return;
    }

    showTemporarySuccess("home-success", "Connection removed.");

    if (appView === "patients") {
      await loadPatients();
    }

    if (appView === "doctors" || appView === "doctor-details") {
      await loadDoctors();
      if (appView === "doctor-details") showPatientDoctorsView();
    }

  } catch (err) {
    console.error(err);
  }
}

async function updateDocumentRequest(id, action) {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser?.id) return;

    const res = await fetch(`/api/document-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: currentUser.id,
        action,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      console.error(data.message || "Could not update request.");
      return;
    }

    showTemporarySuccess(
      "home-success",
      action === "approve" ? "Document approved and added to your records." : "Document request rejected."
    );

    await loadDocumentRequests();

    if (appView === "records") {
      await loadDocuments();
    }

  } catch (err) {
    console.error(err);
  }
}

async function sendCareTeamRequest(targetUserId) {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser?.id) return;

    hideRelationshipError();

    const res = await fetch("/api/care-team-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterId: currentUser.id,
        targetUserId,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      showRelationshipError(data.message || "Could not send request.");
      return;
    }

    closeRelationshipModal();
    showTemporarySuccess(
      "home-success",
      isProvider(currentUser)
        ? "Patient request sent."
        : "Doctor request sent."
    );

  } catch (err) {
    console.error(err);
    showRelationshipError("System error, please try again.");
  }
}

async function updateCareTeamRequest(id, action) {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser?.id) return;

    const res = await fetch(`/api/care-team-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.id,
        action,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      console.error(data.message || "Could not update request.");
      return;
    }

    showTemporarySuccess(
      "home-success",
      action === "approve" ? "Connection approved." : "Connection rejected."
    );

    await loadCareTeamRequests();

    if (appView === "patients" && isProvider(currentUser)) {
      await loadPatients();
    }

    if (appView === "doctors" && isPatient(currentUser)) {
      await loadDoctors();
    }

  } catch (err) {
    console.error(err);
  }
}

async function handleProfileSubmit(e) {
  e.preventDefault();

  const currentUser = getCurrentUser();

  if (!currentUser?.id) return;

  const formValues = getFormData(profileForm);

  try {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.id,
        firstname: formValues.firstname,
        lastname: formValues.lastname,
        email: formValues.email,
      medicalInfo: {
        dateOfBirth: formValues.dateOfBirth,
        bloodType: formValues.bloodType,
        allergies: formValues.allergies,
        conditions: formValues.conditions,
        medications: formValues.medications,
        emergencyContact: formValues.emergencyContact,
        specialty: formValues.specialty,
        phone: formValues.phone,
        contactEmail: formValues.contactEmail,
        workplace: formValues.workplace,
        address: formValues.address,
      },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      showTemporarySuccess("home-success", data.message || "Could not update profile.");
      return;
    }

    saveCurrentUser({
      ...currentUser,
      firstname: data.user.firstname,
      lastname: data.user.lastname,
      email: data.user.email,
    });

    populateHome(getCurrentUser());
    fillProfileForm(data.user);
    initialProfileSnapshot = getProfileSnapshot();
    updateProfileSaveButton();
    showTemporarySuccess("home-success", "Profile updated successfully.");

  } catch (err) {
    console.error(err);
  }
}

function showProfilePasswordError(message) {
  const errorText = profilePasswordError?.querySelector(".msg-error-text");

  if (errorText) errorText.textContent = message;
  profilePasswordError?.classList.remove("hidden");
}

function hideProfilePasswordError() {
  const errorText = profilePasswordError?.querySelector(".msg-error-text");

  if (errorText) errorText.textContent = "";
  profilePasswordError?.classList.add("hidden");
}

function showProfilePasswordSuccess(message) {
  const successText = profilePasswordSuccess?.querySelector(".msg-success-text");

  if (successText) successText.textContent = message;
  profilePasswordSuccess?.classList.remove("hidden");
}

function hideProfilePasswordSuccess() {
  const successText = profilePasswordSuccess?.querySelector(".msg-success-text");

  if (successText) successText.textContent = "";
  profilePasswordSuccess?.classList.add("hidden");
}

function openProfilePasswordModal() {
  verifiedProfilePasswordCode = "";
  hideProfilePasswordError();
  hideProfilePasswordSuccess();
  profilePasswordCodeForm?.classList.remove("hidden");
  profilePasswordVerifyForm?.classList.add("hidden");
  profilePasswordChangeForm?.classList.add("hidden");
  profilePasswordVerifyForm?.reset();
  profilePasswordChangeForm?.reset();
  profilePasswordModal?.classList.remove("hidden");
}

function closeProfilePasswordModal() {
  verifiedProfilePasswordCode = "";
  profilePasswordModal?.classList.add("hidden");
  hideProfilePasswordError();
  hideProfilePasswordSuccess();
  profilePasswordCodeForm?.classList.remove("hidden");
  profilePasswordVerifyForm?.classList.add("hidden");
  profilePasswordChangeForm?.classList.add("hidden");
  profilePasswordVerifyForm?.reset();
  profilePasswordChangeForm?.reset();
}

async function handleProfilePasswordCodeSubmit(e) {
  e.preventDefault();

  const currentUser = getCurrentUser();

  if (!currentUser?.id) return;

  hideProfilePasswordError();
  hideProfilePasswordSuccess();

  try {
    const { res, data } = await postJSON("/api/profile/password-code", {
      userId: currentUser.id,
    });

    if (!res.ok || !data.ok) {
      showProfilePasswordError(data.message || "Could not send verification code.");
      return;
    }

    profilePasswordCodeForm?.classList.add("hidden");
    profilePasswordVerifyForm?.classList.remove("hidden");
    showProfilePasswordSuccess("Verification code sent to your email.");

  } catch (err) {
    console.error(err);
    showProfilePasswordError("System error, please try again.");
  }
}

async function handleProfilePasswordVerifySubmit(e) {
  e.preventDefault();

  const currentUser = getCurrentUser();
  const formValues = getFormData(profilePasswordVerifyForm);

  if (!currentUser?.id) return;

  hideProfilePasswordError();
  hideProfilePasswordSuccess();

  try {
    const { res, data } = await postJSON("/api/profile/password-verify", {
      userId: currentUser.id,
      code: formValues.code,
    });

    if (!res.ok || !data.ok) {
      showProfilePasswordError(data.message || "Could not verify code.");
      return;
    }

    verifiedProfilePasswordCode = formValues.code;
    profilePasswordVerifyForm?.classList.add("hidden");
    profilePasswordChangeForm?.classList.remove("hidden");
    showProfilePasswordSuccess("Code verified. Enter your new password.");

  } catch (err) {
    console.error(err);
    showProfilePasswordError("System error, please try again.");
  }
}

async function handleProfilePasswordChangeSubmit(e) {
  e.preventDefault();

  const currentUser = getCurrentUser();
  const formValues = getFormData(profilePasswordChangeForm);

  if (!currentUser?.id || !verifiedProfilePasswordCode) return;

  hideProfilePasswordError();
  hideProfilePasswordSuccess();

  try {
    const { res, data } = await postJSON("/api/profile/password", {
      userId: currentUser.id,
      code: verifiedProfilePasswordCode,
      newPassword: formValues.newPassword,
      confirmPassword: formValues.confirmPassword,
    });

    if (!res.ok || !data.ok) {
      showProfilePasswordError(data.message || "Could not update password.");
      return;
    }

    closeProfilePasswordModal();
    showTemporarySuccess("home-success", "Password updated successfully.");

  } catch (err) {
    console.error(err);
    showProfilePasswordError("System error, please try again.");
  }
}



/* ------------------------------------------------------------------------------------------ */
/* FORM EVENT BINDINGS */

// Connecting forms to their handler functions, after user submits form then it should perform specified tasks after submission
function setupFormHandlers() {
  createForm?.addEventListener("submit", handleCreateAccountSubmit);
  loginForm?.addEventListener("submit", handleLoginSubmit);
  forgotPasswordForm?.addEventListener("submit", handleForgotPasswordSubmit);
  verificationForm?.addEventListener("submit", handleVerificationSubmit);
  newPasswordForm?.addEventListener("submit", handleNewPasswordSubmit);
  uploadDocumentForm?.addEventListener("submit", handleUploadDocumentSubmit);
  profileForm?.addEventListener("submit", handleProfileSubmit);
  profileForm?.addEventListener("input", updateProfileSaveButton);
  profilePasswordCodeForm?.addEventListener("submit", handleProfilePasswordCodeSubmit);
  profilePasswordVerifyForm?.addEventListener("submit", handleProfilePasswordVerifySubmit);
  profilePasswordChangeForm?.addEventListener("submit", handleProfilePasswordChangeSubmit);
  profilePasswordBtn?.addEventListener("click", openProfilePasswordModal);
  profilePasswordClose?.addEventListener("click", closeProfilePasswordModal);
  profilePasswordModal?.addEventListener("click", (e) => {
    if (e.target === profilePasswordModal) closeProfilePasswordModal();
  });
}


/* ------------------------------------------------------------------------------------------ */
/* INIT */

// Setup to running all functions 
function init() {
  setupRouteSwitching();
  setupProfileMenu();
  setupSignout();
  setupPasswordToggles();
  setupInputListeners();
  setupFormHandlers();
  loadRoute();
  renderCalendar();
}

// Starting the app
init();
