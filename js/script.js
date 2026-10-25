"use strict";

// ==========================================
// 1. GET HTML ELEMENTS
// ==========================================

const sessionForm = document.getElementById("sessionForm");
const sessionFormCard = document.getElementById("sessionFormCard");
const showFormButton = document.getElementById("showFormButton");
const closeFormButton = document.getElementById("closeFormButton");
const cancelButton = document.getElementById("cancelButton");

const sessionIdInput = document.getElementById("sessionId");
const sessionTitleInput = document.getElementById("sessionTitle");
const subjectInput = document.getElementById("subject");
const sessionDateInput = document.getElementById("sessionDate");
const sessionTimeInput = document.getElementById("sessionTime");
const durationInput = document.getElementById("duration");
const priorityInput = document.getElementById("priority");
const sessionNotesInput = document.getElementById("sessionNotes");

const sessionsList = document.getElementById("sessionsList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");

const totalSessionsElement = document.getElementById("totalSessions");
const completedSessionsElement = document.getElementById("completedSessions");
const pendingSessionsElement = document.getElementById("pendingSessions");
const progressPercentageElement = document.getElementById("progressPercentage");
const progressBar = document.getElementById("progressBar");

const subjectsGrid = document.getElementById("subjectsGrid");
const todayDateElement = document.getElementById("todayDate");
const greetingElement = document.getElementById("greeting");

const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");


// ==========================================
// 2. APPLICATION DATA
// ==========================================

const STORAGE_KEY = "studyFlowSessions";

let sessions = loadSessions();


// ==========================================
// 3. LOAD AND SAVE DATA
// ==========================================

function loadSessions() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
            return [];
        }

        return parsedData.filter(function (session) {
            return (
                session &&
                typeof session.id === "string" &&
                typeof session.title === "string" &&
                typeof session.subject === "string" &&
                typeof session.date === "string" &&
                typeof session.time === "string" &&
                typeof session.duration === "number" &&
                typeof session.priority === "string" &&
                typeof session.completed === "boolean"
            );
        });
    } catch (error) {
        console.error("Could not load saved sessions:", error);
        return [];
    }
}


function saveSessions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        return true;
    } catch (error) {
        console.error("Could not save sessions:", error);

        alert(
            "Your browser could not save the changes. " +
            "Check your browser storage settings."
        );

        return false;
    }
}


// ==========================================
// 4. DATE AND TIME DISPLAY
// ==========================================

function displayToday() {
    const today = new Date();

    todayDateElement.textContent = today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const hour = today.getHours();

    if (hour < 12) {
        greetingElement.textContent = "Good morning!";
    } else if (hour < 17) {
        greetingElement.textContent = "Good afternoon!";
    } else {
        greetingElement.textContent = "Good evening!";
    }

    sessionDateInput.min = getLocalDateString(today);
}


function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {
    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function formatTime(timeString) {
    const parts = timeString.split(":");

    if (parts.length !== 2) {
        return timeString;
    }

    let hour = Number(parts[0]);
    const minute = parts[1];

    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
}


// ==========================================
// 5. FORM OPENING AND CLOSING
// ==========================================

function openForm() {
    sessionFormCard.hidden = false;

    sessionFormCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    sessionTitleInput.focus();
}


function closeForm() {
    sessionForm.reset();

    sessionIdInput.value = "";

    formTitle.textContent = "Add a Study Session";
    saveButton.textContent = "Save Session";

    sessionDateInput.min = getLocalDateString(new Date());

    sessionFormCard.hidden = true;
}


showFormButton.addEventListener("click", function () {
    closeForm();
    openForm();
});


closeFormButton.addEventListener("click", closeForm);

cancelButton.addEventListener("click", closeForm);


// ==========================================
// 6. ADD AND EDIT SESSIONS
// ==========================================

sessionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = sessionTitleInput.value.trim();
    const subject = subjectInput.value;
    const date = sessionDateInput.value;
    const time = sessionTimeInput.value;
    const duration = Number(durationInput.value);
    const priority = priorityInput.value;
    const notes = sessionNotesInput.value.trim();

    if (
        !title ||
        !subject ||
        !date ||
        !time ||
        !Number.isFinite(duration) ||
        duration <= 0
    ) {
        alert("Please fill in all required fields correctly.");
        return;
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
        alert("Please select a valid priority.");
        return;
    }

    if (!["30", "45", "60", "90", "120", "180"].includes(durationInput.value)) {
        alert("Please select a valid duration.");
        return;
    }

    const editingId = sessionIdInput.value;

    const previousSession = sessions.find(function (session) {
        return session.id === editingId;
    });

    const sessionData = {
        id: editingId || (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
                ? window.crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`
        ),
        title: title,
        subject: subject,
        date: date,
        time: time,
        duration: duration,
        priority: priority,
        notes: notes,
        completed: previousSession ? previousSession.completed : false
    };

    let updatedSessions;

    if (editingId) {
        const sessionExists = sessions.some(function (session) {
            return session.id === editingId;
        });

        if (!sessionExists) {
            alert("This session no longer exists. Please try again.");
            closeForm();
            return;
        }

        updatedSessions = sessions.map(function (session) {
            return session.id === editingId ? sessionData : session;
        });
    } else {
        updatedSessions = [...sessions, sessionData];
    }

    const previousSessions = sessions;
    sessions = updatedSessions;

    if (!saveSessions()) {
        sessions = previousSessions;
        return;
    }

    closeForm();
    renderApp();

    alert(editingId ? "Study session updated!" : "Study session added!");
});


// ==========================================
// 7. EDIT A SESSION
// ==========================================

function editSession(id) {
    const session = sessions.find(function (item) {
        return item.id === id;
    });

    if (!session) {
        return;
    }

    sessionIdInput.value = session.id;

    sessionTitleInput.value = session.title;
    subjectInput.value = session.subject;
    sessionDateInput.value = session.date;
    sessionTimeInput.value = session.time;
    durationInput.value = String(session.duration);
    priorityInput.value = session.priority;
    sessionNotesInput.value = session.notes || "";

    // Existing sessions can be scheduled for past dates.
    sessionDateInput.min = "";

    formTitle.textContent = "Edit Study Session";
    saveButton.textContent = "Update Session";

    openForm();
}


// ==========================================
// 8. DELETE A SESSION
// ==========================================

function deleteSession(id) {
    const session = sessions.find(function (item) {
        return item.id === id;
    });

    if (!session) {
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${session.title}"?`
    );

    if (!confirmed) {
        return;
    }

    const previousSessions = sessions;

    sessions = sessions.filter(function (item) {
        return item.id !== id;
    });

    if (!saveSessions()) {
        sessions = previousSessions;
        return;
    }

    renderApp();
}


// ==========================================
// 9. MARK A SESSION COMPLETE OR PENDING
// ==========================================

function toggleSessionCompletion(id) {
    const previousSessions = sessions;

    sessions = sessions.map(function (session) {
        if (session.id === id) {
            return {
                ...session,
                completed: !session.completed
            };
        }

        return session;
    });

    if (!saveSessions()) {
        sessions = previousSessions;
        return;
    }

    renderApp();
}


// ==========================================
// 10. SEARCH AND FILTER SESSIONS
// ==========================================

function getFilteredSessions() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedPriority = priorityFilter.value;

    return sessions
        .filter(function (session) {
            const searchableText = [
                session.title,
                session.subject,
                session.notes || ""
            ].join(" ").toLowerCase();

            return searchableText.includes(searchTerm);
        })
        .filter(function (session) {
            if (selectedStatus === "completed") {
                return session.completed;
            }

            if (selectedStatus === "pending") {
                return !session.completed;
            }

            return true;
        })
        .filter(function (session) {
            if (selectedPriority === "all") {
                return true;
            }

            return session.priority === selectedPriority;
        })
        .sort(function (a, b) {
            const firstDate = `${a.date}T${a.time}`;
            const secondDate = `${b.date}T${b.time}`;

            return firstDate.localeCompare(secondDate);
        });
}


searchInput.addEventListener("input", renderSessions);
statusFilter.addEventListener("change", renderSessions);
priorityFilter.addEventListener("change", renderSessions);


// ==========================================
// 11. CREATE SESSION CARDS
// ==========================================

function createSessionCard(session) {
    const card = document.createElement("article");

    card.className = "session-card";

    if (session.completed) {
        card.classList.add("is-completed");
    }

    const main = document.createElement("div");
    main.className = "session-main";

    const topline = document.createElement("div");
    topline.className = "session-topline";

    const subjectTag = document.createElement("span");
    subjectTag.className = "subject-tag";
    subjectTag.textContent = session.subject;

    const priorityTag = document.createElement("span");
    priorityTag.className =
        `priority-tag priority-${session.priority.toLowerCase()}`;
    priorityTag.textContent = `${session.priority} Priority`;

    topline.append(subjectTag, priorityTag);

    if (session.completed) {
        const statusTag = document.createElement("span");
        statusTag.className = "status-tag";
        statusTag.textContent = "Completed";
        topline.appendChild(statusTag);
    }

    const title = document.createElement("h3");
    title.textContent = session.title;

    const metadata = document.createElement("div");
    metadata.className = "session-meta";

    const dateSpan = document.createElement("span");
    dateSpan.textContent = `📅 ${formatDate(session.date)}`;

    const timeSpan = document.createElement("span");
    timeSpan.textContent = `🕒 ${formatTime(session.time)}`;

    const durationSpan = document.createElement("span");

    durationSpan.textContent = session.duration >= 60
        ? `${session.duration / 60} hour${session.duration === 60 ? "" : "s"}`
        : `${session.duration} minutes`;

    metadata.append(dateSpan, timeSpan, durationSpan);

    main.append(topline, title, metadata);

    if (session.notes) {
        const notes = document.createElement("p");

        notes.className = "session-notes";
        notes.textContent = session.notes;

        main.appendChild(notes);
    }

    const actions = document.createElement("div");
    actions.className = "session-actions";

    const completeButton = document.createElement("button");

    completeButton.type = "button";
    completeButton.className = "small-button complete-button";

    completeButton.textContent = session.completed
        ? "↩ Undo"
        : "✓ Complete";

    completeButton.setAttribute(
        "aria-label",
        session.completed
            ? `Mark ${session.title} as pending`
            : `Mark ${session.title} as completed`
    );

    completeButton.addEventListener("click", function () {
        toggleSessionCompletion(session.id);
    });

    const editButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "small-button";
    editButton.textContent = "✎ Edit";

    editButton.addEventListener("click", function () {
        editSession(session.id);
    });

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "small-button delete-button";
    deleteButton.textContent = "✕ Delete";

    deleteButton.addEventListener("click", function () {
        deleteSession(session.id);
    });

    actions.append(completeButton, editButton, deleteButton);
    card.append(main, actions);

    return card;
}


// ==========================================
// 12. DISPLAY SESSIONS
// ==========================================

function renderSessions() {
    const filteredSessions = getFilteredSessions();

    sessionsList.replaceChildren();

    if (filteredSessions.length === 0) {
        const emptyState = document.createElement("div");

        emptyState.className = "empty-state";

        const icon = document.createElement("div");
        icon.className = "empty-icon";
        icon.textContent = sessions.length === 0 ? "📖" : "🔎";

        const heading = document.createElement("h3");
        heading.textContent = sessions.length === 0
            ? "No study sessions yet"
            : "No matching sessions";

        const message = document.createElement("p");
        message.textContent = sessions.length === 0
            ? "Add your first session to start planning your day."
            : "Try changing your search or filters.";

        emptyState.append(icon, heading, message);
        sessionsList.appendChild(emptyState);

        return;
    }

    filteredSessions.forEach(function (session) {
        sessionsList.appendChild(createSessionCard(session));
    });
}


// ==========================================
// 13. UPDATE DASHBOARD STATISTICS
// ==========================================

function renderStatistics() {
    const total = sessions.length;

    const completed = sessions.filter(function (session) {
        return session.completed;
    }).length;

    const pending = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalSessionsElement.textContent = total;
    completedSessionsElement.textContent = completed;
    pendingSessionsElement.textContent = pending;

    progressPercentageElement.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;

    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-label", "Study completion progress");
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    progressBar.setAttribute("aria-valuenow", String(percentage));
}


// ==========================================
// 14. UPDATE SUBJECT OVERVIEW
// ==========================================

function renderSubjects() {
    subjectsGrid.replaceChildren();

    const subjectCounts = {};

    sessions.forEach(function (session) {
        if (!subjectCounts[session.subject]) {
            subjectCounts[session.subject] = {
                total: 0,
                completed: 0
            };
        }

        subjectCounts[session.subject].total += 1;

        if (session.completed) {
            subjectCounts[session.subject].completed += 1;
        }
    });

    const subjectNames = Object.keys(subjectCounts).sort();

    if (subjectNames.length === 0) {
        const message = document.createElement("p");

        message.className = "section-description";
        message.textContent = "Your subjects will appear here after you add sessions.";

        subjectsGrid.appendChild(message);

        return;
    }

    subjectNames.forEach(function (subjectName) {
        const data = subjectCounts[subjectName];

        const card = document.createElement("article");
        card.className = "subject-card";

        const title = document.createElement("h3");
        title.textContent = subjectName;

        const count = document.createElement("p");
        count.className = "subject-count";
        count.textContent = data.total;

        const description = document.createElement("p");

        description.textContent =
            `${data.completed} of ${data.total} session` +
            `${data.total === 1 ? "" : "s"} completed`;

        card.append(title, count, description);

        subjectsGrid.appendChild(card);
    });
}


// ==========================================
// 15. REFRESH THE COMPLETE INTERFACE
// ==========================================

function renderApp() {
    renderStatistics();
    renderSessions();
    renderSubjects();
}


// ==========================================
// 16. MOBILE NAVIGATION
// ==========================================

menuToggle.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
    );

    menuToggle.textContent = isOpen ? "✕" : "☰";
});


navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
        navLinks.classList.remove("open");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");

        menuToggle.textContent = "☰";
    });
});


// ==========================================
// 17. START THE APPLICATION
// ==========================================

displayToday();
renderApp();