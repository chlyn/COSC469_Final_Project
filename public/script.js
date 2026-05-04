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
const formContainer = document.querySelector(".form-container");  // Holds all forms (login, create, forgot-password, verification, reset-password)
const homeContainer = document.querySelector("#home");            // Main homepage 

// Storing profile dropdown menu elements
const profileBtn = document.getElementById("profile-btn");
const profileMenu = document.getElementById("profile-menu");
const userProfile = document.querySelector(".user-profile");
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
  const lastname = user.lastname || "";

  // Creating full name and name initials from user informatiom
  const fullName = `${firstname} ${lastname}`.trim();
  const initials = `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();

  // Getting HTML Elements that will be updated
  const topbarTitle = document.getElementById("topbar-title");
  const profileName = document.querySelector(".profile-name");
  const profileImg = document.querySelector(".profile-img");

  // Updating UI with user's information
  if (topbarTitle) topbarTitle.textContent = `Welcome back, ${firstname}`;
  if (profileName) profileName.textContent = firstname;
  if (profileImg) profileImg.textContent = initials;

}

// Displaying homepage after login or account creation
function showHome(message = "") {

  // Hiding all forms
  hideElement(authContainer);

  // Displaying homepage
  showElement(homeContainer);

  // Inserting users's information from localStorage
  populateHome(getCurrentUser());

  // Loading uploaded documents from the database
  loadDocuments();

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

  // Listening for any clicks on the profile button
  profileBtn?.addEventListener("click", (e) => {

    // Preventing menu from closing immediately after click
    e.stopPropagation();

    // Displaying profile menu by adding the "open" class
    profileMenu?.classList.toggle("open");

  });

  // Listening for any clicks anywhere on the page
  document.addEventListener("click", (e) => {

    // If click was inside the profile area, then do nothing
    if (!userProfile || userProfile.contains(e.target)) return;

    // If click was outside the profile area, then hide profile menu by removing the "open" class
    profileMenu?.classList.remove("open");

  })
  ;
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

    // Hiding profile menu by removing "open" class
    profileMenu?.classList.remove("open");

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
let recordsDocuments = [];
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

function createDocumentRow(document) {
  const badgeClass = getDocumentTypeBadgeClass(document.documentType);
  const filePath = escapeHTML(document.filePath);

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

            <button type="button" class="table-menu-option danger" data-action="delete" data-id="${escapeHTML(document.id)}">
              <span class="material-icons">delete</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderDocuments(documents) {
  if (!recordsTableBody) return;

  recordsTableBody.innerHTML = documents.map(createDocumentRow).join("");
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

async function loadDocuments() {
  if (!recordsTableBody) return;

  const currentUser = getCurrentUser();

  if (!currentUser?.id) {
    recordsDocuments = [];
    renderSortedDocuments();
    return;
  }

  try {
    const res = await fetch(`/api/documents?userId=${encodeURIComponent(currentUser.id)}`);
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
uploadDocBtn?.addEventListener("click", openUploadModal);

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

  formData.append("file", selectedUploadFile);
  formData.append("userId", currentUser.id);
  formData.append("documentName", formValues.documentName);
  formData.append("documentType", formValues.documentType);
  formData.append("provider", formValues.provider);
  formData.append("documentDate", formValues.documentDate);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      showUploadError(data.message || "Upload failed. Please try again.");
      return;
    }

    closeUploadModal();
    showTemporarySuccess("home-success", "Document uploaded successfully!");

    await loadDocuments();

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
  renderSortedDocuments();
});

searchClearBtn?.addEventListener("click", () => {
  recordSearchInput.value = "";
  searchClearBtn.classList.add("hidden");
  recordSearchInput.focus();
  updateRecordsClearButton();
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
  renderSortedDocuments();
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
  renderSortedDocuments();
}

recordsClearBtn?.addEventListener("click", resetRecordsFilters);



/* ------------------------------------------------------------------------------------------ */
/* TABLE SORT BUTTONS */

const tableSortButtons = document.querySelectorAll(".table-sort-btn");

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

    renderSortedDocuments();
  });
});



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
