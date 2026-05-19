// Firebase Config
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
let currentUID = null;

let accessCounter = 1;
let rfidCounter = 1;
let registeredCounter = 1;

// Auth check
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    loadDashboard();
    hideSpinner();
  } else {
    window.location.href = "login.html";
  }
});

// Format timestamp
function formatTimestamp(date) {
  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

// Load dashboard data
function loadDashboard() {
  const accessBody = document.getElementById("accessBody");
  const rfidBody = document.getElementById("rfidBody");
  const registeredBody = document.getElementById("registeredBody");

  accessCounter = 1;
  rfidCounter = 1;
  registeredCounter = 1;
  accessBody.innerHTML = "";
  rfidBody.innerHTML = "";
  registeredBody.innerHTML = "";

 // Registered users
database.ref("users").on("value", function(snapshot) {
  registeredBody.innerHTML = "";
  registeredCounter = 1;
  snapshot.forEach(function(child) {
    const uid = child.key;
    const name = child.val();

    const row = document.createElement("tr");

    const tdNum = document.createElement("td");
    tdNum.textContent = registeredCounter++;
    row.appendChild(tdNum);

    const tdUID = document.createElement("td");
    tdUID.textContent = uid;
    row.appendChild(tdUID);

    const tdName = document.createElement("td");
    tdName.textContent = name;
    row.appendChild(tdName);

    const tdAction = document.createElement("td");
    tdAction.className = "action-column";

    const btnRemove = document.createElement("button");
    btnRemove.textContent = "Remove Access";
    btnRemove.className = "removeBtn";
    btnRemove.onclick = function() {
      // open confirmation modal instead of direct remove
      openRemoveAccessModal(uid);
    };

    tdAction.appendChild(btnRemove);
    row.appendChild(tdAction);

    row.oncontextmenu = function(e) {
      e.preventDefault();
      openHistoryModal(uid);
    };

    registeredBody.appendChild(row);
  });

  document.getElementById("totalRegistered").textContent = snapshot.numChildren();
});


  // Unregistered attempts count
  database.ref("rfid_logs").on("value", function(snapshot) {
    document.getElementById("totalUnregistered").textContent = snapshot.numChildren();
  });

  // Access logs
  database.ref("access_logs").on("child_added", function(snapshot) {
    var log = snapshot.val();
    var timestamp = formatTimestamp(new Date());

    var row = document.createElement("tr");

    var tdNum = document.createElement("td");
    tdNum.textContent = accessCounter++;
    row.appendChild(tdNum);

    var tdTime = document.createElement("td");
    tdTime.textContent = timestamp;
    row.appendChild(tdTime);

    var tdDetails = document.createElement("td");
    tdDetails.textContent = log;
    row.appendChild(tdDetails);

    accessBody.appendChild(row);
  });

  // RFID logs
  database.ref("rfid_logs").on("child_added", function(snapshot) {
    var uid = snapshot.val();
    var timestamp = formatTimestamp(new Date());

    var row = document.createElement("tr");

    var tdNum = document.createElement("td");
    tdNum.textContent = rfidCounter++;
    row.appendChild(tdNum);

    var tdTime = document.createElement("td");
    tdTime.textContent = timestamp;
    row.appendChild(tdTime);

    var tdUID = document.createElement("td");
    tdUID.textContent = uid;
    row.appendChild(tdUID);

    var tdName = document.createElement("td");
    database.ref("users/" + uid).once("value", function(nameSnap) {
      tdName.textContent = nameSnap.exists() ? nameSnap.val() : "Unregistered";
    });
    row.appendChild(tdName);

    var tdAction = document.createElement("td");
    tdAction.className = "action-column";

    var btnRegister = document.createElement("button");
    btnRegister.textContent = "Register";
    btnRegister.className = "registerBtn";
    btnRegister.onclick = function() { 
      currentUID = uid;
      openRegisterModal(uid, snapshot, row);
    };

    var btnDelete = document.createElement("button");
    btnDelete.textContent = "Delete";
    btnDelete.className = "deleteBtn";
    btnDelete.onclick = function() {
      database.ref("users/" + uid).remove().then(() => {
        snapshot.ref.remove().then(() => {
          row.remove();
          showPopup("Card deleted!: " + uid, "success!");
        });
      }).catch((error) => {
        showPopup("Delete failed!: " + error.message, "error!");
      });
    };

    tdAction.appendChild(btnRegister);
    tdAction.appendChild(btnDelete);
    row.appendChild(tdAction);

    rfidBody.appendChild(row);
  });

  // Lock status
  database.ref("lock_status").on("value", function(snapshot) {
    var status = snapshot.val();
    var statusBox = document.getElementById("statusBox");
    statusBox.textContent = status;
    statusBox.className = (status === "LOCKED") ? "locked" : "unlocked";
  });
}

// Hide spinner
function hideSpinner() {
  document.getElementById("loadingSpinner").style.display = "none";
}

// Logout
function logout() {
  firebase.auth().signOut().then(() => {
    showPopup("You have been logged out.", "success");
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
  }).catch((error) => {
    showPopup("Logout failed!: " + error.message, "error!");
  });
}

// Print logs
function printLogs() {
  const registeredSection = document.getElementById("registeredBody").cloneNode(true);
  const accessSection = document.getElementById("accessBody").cloneNode(true);
  const rfidSection = document.getElementById("rfidBody").cloneNode(true);

  const printContents = registeredSection.innerHTML + "<br><br>" +
                        accessSection.innerHTML + "<br><br>" +
                        rfidSection.innerHTML;
  const originalContents = document.body.innerHTML;

  document.body.innerHTML = printContents;
  window.print();
  document.body.innerHTML = originalContents;
  window.location.reload();
}

// Popup
function showPopup(message, type="success") {
  const container = document.getElementById("popupContainer");
  const popup = document.createElement("div");
  popup.className = "popup " + type;
  popup.innerHTML = message;
  container.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 3000);
}

// Register modal
function openRegisterModal(uid, snapshot, row) {
  const modal = document.getElementById("registerModal");
  const msg = document.getElementById("modalMessage");
  const input = document.getElementById("cardNameInput");
  const okBtn = document.getElementById("modalOk");
  const cancelBtn = document.getElementById("modalCancel");

  modal.style.display = "flex";
  msg.textContent = "Enter name for card " + uid + ":";
  input.value = "";

  okBtn.onclick = function() {
    let newName = input.value.trim();
    if (newName) {
      database.ref("users/" + uid).set(newName).then(() => {
        database.ref("rfid_logs").orderByValue().equalTo(uid).once("value", function(snap) {
          snap.forEach(function(child) {
            child.ref.remove();
          });
        });

        if (row) row.remove();
        showPopup("Card registered!: " + uid + " → " + newName, "success");
      }).catch((error) => {
        showPopup("Registration failed!: " + error.message, "error");
      });
          closeRegisterModal();
    } else {
      showPopup("Please enter a name!", "warning!");
    }
  };

  cancelBtn.onclick = function() {
    closeRegisterModal();
  };
}

// Close register modal
function closeRegisterModal() {
  const modal = document.getElementById("registerModal");
  modal.style.display = "none";
}

// Placeholder for history modal (right-click on row)
function openHistoryModal(uid) {
  showPopup("History modal for card: " + uid, "info");
}

// Dark mode toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("change", () => {
      if (toggle.checked) {
        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
      }
    });
  }
});
// --- ACCESS LOGS ---
// Open/close modals
function openClearLogsModal() {
  document.getElementById("clearLogsModal").style.display = "flex";
}
function closeClearLogsModal() {
  document.getElementById("clearLogsModal").style.display = "none";
}

function openDeleteLogsModal() {
  document.getElementById("deleteLogsModal").style.display = "flex";
}
function closeDeleteLogsModal() {
  document.getElementById("deleteLogsModal").style.display = "none";
}

// Toggle multi-select mode
let accessMultiEnabled = false;
let unregMultiEnabled = false;

function enableMultiSelect(type) {
  if (type === "access") {
    if (!accessMultiEnabled) {
      // enable mode
      document.getElementById("accessHeaderCheck").style.display = "table-cell";
      document.getElementById("selectAllLogs").disabled = false;
      document.querySelectorAll("#accessBody tr").forEach(row => {
        if (!row.querySelector(".logCheckbox")) {
          const tdCheck = document.createElement("td");
          tdCheck.innerHTML = '<input type="checkbox" class="logCheckbox">';
          row.insertBefore(tdCheck, row.firstChild);
        }
      });
      accessMultiEnabled = true;
      showPopup("✅ Multi-select enabled for Access Logs", "success");
    } else {
      // disable mode
      document.getElementById("accessHeaderCheck").style.display = "none";
      document.getElementById("selectAllLogs").disabled = true;
      document.getElementById("selectAllLogs").checked = false;
      document.querySelectorAll("#accessBody .logCheckbox").forEach(cb => {
        cb.closest("td").remove();
      });
      accessMultiEnabled = false;
      showPopup("↩️ Multi-select disabled for Access Logs", "info");
    }
  } else if (type === "unreg") {
    if (!unregMultiEnabled) {
      document.getElementById("unregHeaderCheck").style.display = "table-cell";
      document.getElementById("selectAllUnreg").disabled = false;
      document.querySelectorAll("#rfidBody tr").forEach(row => {
        if (!row.querySelector(".unregCheckbox")) {
          const tdCheck = document.createElement("td");
          tdCheck.innerHTML = '<input type="checkbox" class="unregCheckbox">';
          row.insertBefore(tdCheck, row.firstChild);
        }
      });
      unregMultiEnabled = true;
      showPopup("✅ Multi-select enabled for Unregistered Attempts", "success");
    } else {
      document.getElementById("unregHeaderCheck").style.display = "none";
      document.getElementById("selectAllUnreg").disabled = true;
      document.getElementById("selectAllUnreg").checked = false;
      document.querySelectorAll("#rfidBody .unregCheckbox").forEach(cb => {
        cb.closest("td").remove();
      });
      unregMultiEnabled = false;
      showPopup("↩️ Multi-select disabled for Unregistered Attempts", "info");
    }
  }
}

// Delete Multiple Checked Rows (Access Logs)
function deleteMultipleCheckedAccess() {
  const selected = document.querySelectorAll(".logCheckbox:checked");
  if (selected.length === 0) {
    showPopup("⚠️ No logs selected", "warning");
    return;
  }

  selected.forEach(cb => {
    const row = cb.closest("tr");
    const key = row.getAttribute("data-key");
    if (key) database.ref("access_logs/" + key).remove();
    row.remove();
  });

  // re‑number rows
  const rows = document.querySelectorAll("#accessBody tr");
  rows.forEach((row, index) => {
    const numCell = row.querySelector("td:nth-child(2)");
    if (numCell) numCell.textContent = index + 1;
  });

  showPopup("✅ Selected logs deleted", "success");
}

document.addEventListener("DOMContentLoaded", () => {
  // Clear All Logs
  document.getElementById("clearLogsOk").onclick = function() {
    database.ref("access_logs").remove().then(() => {
      document.getElementById("accessBody").innerHTML = "";
      showPopup("✅ All Access Logs cleared", "success");
      closeClearLogsModal();
    }).catch(err => {
      showPopup("❌ Clear failed: " + err.message, "error");
      closeClearLogsModal();
    });
  };
  document.getElementById("clearLogsCancel").onclick = closeClearLogsModal;

  // Delete Selected Logs (modal confirm)
  document.getElementById("deleteLogsOk").onclick = function() {
    deleteMultipleCheckedAccess();
    closeDeleteLogsModal();
  };
  document.getElementById("deleteLogsCancel").onclick = closeDeleteLogsModal;

  // Select All checkbox
  const selectAllLogs = document.getElementById("selectAllLogs");
  if (selectAllLogs) {
    selectAllLogs.addEventListener("change", () => {
      document.querySelectorAll(".logCheckbox")
        .forEach(cb => cb.checked = selectAllLogs.checked);
    });
  }
});


// --- UNREGISTERED ATTEMPTS ---
// Open/close modals
function openClearUnregModal() {
  document.getElementById("clearUnregModal").style.display = "flex";
}
function closeClearUnregModal() {
  document.getElementById("clearUnregModal").style.display = "none";
}

function openDeleteUnregModal() {
  document.getElementById("deleteUnregModal").style.display = "flex";
}
function closeDeleteUnregModal() {
  document.getElementById("deleteUnregModal").style.display = "none";
}

// Delete Multiple Checked Rows (Unregistered Attempts)
function deleteMultipleCheckedUnreg() {
  const selected = document.querySelectorAll(".unregCheckbox:checked");
  if (selected.length === 0) {
    showPopup("⚠️ No attempts selected", "warning");
    return;
  }

  selected.forEach(cb => {
    const row = cb.closest("tr");
    const key = row.getAttribute("data-key");
    if (key) database.ref("rfid_logs/" + key).remove(); // fixed path
    row.remove();
  });

  // re‑number rows
  const rows = document.querySelectorAll("#rfidBody tr");
  rows.forEach((row, index) => {
    const numCell = row.querySelector("td:nth-child(2)");
    if (numCell) numCell.textContent = index + 1;
  });

  showPopup("✅ Selected attempts deleted", "success");
}

document.addEventListener("DOMContentLoaded", () => {
  // Clear All Unregistered Attempts
  document.getElementById("clearUnregOk").onclick = function() {
    database.ref("rfid_logs").remove().then(() => {
      document.getElementById("rfidBody").innerHTML = "";
      showPopup("✅ All Unregistered Attempts cleared", "success");
      closeClearUnregModal();
    }).catch(err => {
      showPopup("❌ Clear failed: " + err.message, "error");
      closeClearUnregModal();
    });
  };
  document.getElementById("clearUnregCancel").onclick = closeClearUnregModal;

  // Delete Selected Unregistered Attempts (modal confirm)
  document.getElementById("deleteUnregOk").onclick = function() {
    deleteMultipleCheckedUnreg();
    closeDeleteUnregModal();
  };
  document.getElementById("deleteUnregCancel").onclick = closeDeleteUnregModal;

  // Select All checkbox
  const selectAllUnreg = document.getElementById("selectAllUnreg");
  if (selectAllUnreg) {
    selectAllUnreg.addEventListener("change", () => {
      document.querySelectorAll(".unregCheckbox")
        .forEach(cb => cb.checked = selectAllUnreg.checked);
    });
  }
});
let pendingRemoveUID = null;

function openRemoveAccessModal(uid) {
  pendingRemoveUID = uid;
  document.getElementById("removeAccessModal").style.display = "flex";
}

function closeRemoveAccessModal() {
  document.getElementById("removeAccessModal").style.display = "none";
  pendingRemoveUID = null;
}

document.addEventListener("DOMContentLoaded", () => {
  const okBtn = document.getElementById("removeAccessOk");
  const cancelBtn = document.getElementById("removeAccessCancel");

  if (okBtn) {
    okBtn.onclick = function() {
      if (pendingRemoveUID) {
        const timestamp = formatTimestamp(new Date());
        database.ref("users/" + pendingRemoveUID).remove().then(() => {
          database.ref("removed_history/" + pendingRemoveUID).push({
            date: timestamp,
            action: "Access removed!"
          });
          showPopup("Access removed for card: " + pendingRemoveUID, "success");
          closeRemoveAccessModal();
        }).catch((error) => {
          showPopup("Remove failed: " + error.message, "error");
          closeRemoveAccessModal();
        });
      }
    };
  }

  if (cancelBtn) {
    cancelBtn.onclick = closeRemoveAccessModal;
  }
});
