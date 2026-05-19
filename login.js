// =======================
// Firebase Config
// =======================
var firebaseConfig = {
  apiKey: "AIzaSyDLm2WWJprd7rYjeJQVNWUUe7_dLfBKfdI",
  authDomain: "smart-door-4dba5.firebaseapp.com",
  databaseURL: "https://smart-door-4dba5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-door-4dba5",
  storageBucket: "smart-door-4dba5.firebasestorage.app",
  messagingSenderId: "1021276978624",
  appId: "1:1021276978624:web:9c034b71ec91627ea95c25"
};
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

// =======================
// Message Modal Functions
// =======================
function showModal(title, message) {
  document.getElementById("modalTitle").innerHTML = title;
  document.getElementById("modalText").innerHTML = message;
  document.getElementById("messageModal").classList.add("show");
}
function closeModal() {
  document.getElementById("messageModal").classList.remove("show");
}

// =======================
// Login
// =======================
function login() {
  var email = document.getElementById("loginEmail").value;
  var password = document.getElementById("loginPassword").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      showModal("Success!", "Login successful!");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);
    })
    .catch((error) => {
      if (error.code === "auth/wrong-password") {
        showModal("Error!", "Password is incorrect.");
      } else if (error.code === "auth/user-not-found") {
        showModal("Error!", "No account found with that email.");
      } else if (error.code === "auth/invalid-email") {
        showModal("Error!", "Invalid email format.");
      } else {
        showModal("Error!", "Login failed. Please try again.");
      }
    });
}

// =======================
// Register (via modal)
// =======================
function registerUser() {
  var email = document.getElementById("registerEmail").value;
  var password = document.getElementById("registerPassword").value;

  if (email && password) {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        var user = userCredential.user;

        database.ref("admins/" + user.uid).set({
          email: email,
          role: "admin"
        });

        showModal("Success!", "New admin registered successfully!");
        setTimeout(() => {
          closeRegisterModal();
          document.getElementById("registerEmail").value = "";
          document.getElementById("registerPassword").value = "";
        }, 2000);
      })
      .catch((error) => {
        showModal("Error!", "Registration failed: " + error.message);
      });
  } else {
    showModal("Warning!", "Please enter email and password!");
  }
}

// =======================
// Forgot Password (via modal)
// =======================
function sendResetEmail() {
  var email = document.getElementById("forgotEmail").value;
  if (!email) {
    showModal("Warning!", "Enter your email!");
    return;
  }

  showModal("Sending...", "<div class='spinner'></div><p>Please wait...</p>");

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      showModal("Email Sent", 
        "<div class='success-check'>✔</div>" +
        "<p>Password reset email sent to <b>" + email + "</b>.</p>" +
        "<p><small>Tip: Check your Gmail inbox. If you don’t see it, look in the <b>Spam folder</b>.</small></p>"
      );

      setTimeout(() => {
        closeModal();
        closeForgotModal();
      }, 3000);
    })
    .catch((error) => {
      showModal("Error!", "Failed to send reset email: " + error.message);
    });
}

// =======================
// Forgot Modal Controls
// =======================
function toggleForgot() {
  document.getElementById("forgotModal").classList.add("show");
}
function closeForgotModal() {
  document.getElementById("forgotModal").classList.remove("show");
}

// =======================
// Register Modal Controls
// =======================
function toggleRegister() {
  document.getElementById("registerModal").classList.add("show");
}
function closeRegisterModal() {
  document.getElementById("registerModal").classList.remove("show");
}
const toggle = document.getElementById("themeToggle");

toggle.addEventListener("change", () => {
  if (toggle.checked) {
    document.body.classList.remove("light-mode");
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
  }
});
