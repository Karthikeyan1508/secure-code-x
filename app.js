const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const session = require("express-session");
const flash = require("connect-flash");
require("dotenv").config();
const fs = require("fs");
const bcrypt = require("bcryptjs");
const cookieParser = require('cookie-parser');

// Use cookie-parser middleware to parse cookies
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

const serviceAccount = require('serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ctf-ise.firebaseio.com",
});

// Session setup
app.use(
  session({
    secret: "your-session-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Use 'true' in production with HTTPS
  })
);

// Setup flash messages
app.use(flash());

// Middleware to make flash messages available globally
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  res.locals.user = req.session.user || null; // Make user available in templates
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  console.log("Checking authentication...");
  if (req.session && req.session.user) {
    console.log("User is authenticated:", req.session.user);
    return next();
  }
  console.log("User is not authenticated. Redirecting to /login");
  req.flash("error", "You must log in first!");
  res.redirect("/login");
}

function isOrganizer(req, res, next) {
  console.log("Checking organizer role...");
  if (req.session.user && req.session.user.role === "organizer") {
    console.log("User is an organizer:", req.session.user);
    return next();
  }
  console.log("User is not an organizer. Redirecting to /");
  req.flash("error", "You do not have permission to access this page.");
  res.redirect("/");
}

function blockIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    req.flash(
      "error",
      "You are currently logged in. Logout first to access this page."
    );
    return res.redirect("/events");
  }
  next();
}

// Static file serving
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));

app.set("view engine", "ejs");

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

// Fetch all events
app.get("/events", isAuthenticated, async (req, res) => {
  try {
    const eventsSnapshot = await admin.firestore().collection("events").get();
    const events = [];
    eventsSnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });

    res.render("events", { events, user: req.session.user });
  } catch (error) {
    console.error("Error fetching events:", error);
    req.flash("error", "Failed to load events.");
    res.redirect("/");
  }
});

// Create a new event (Organizer-only route)
// Route to render the new event form
app.get("/events/new", isAuthenticated, isOrganizer, (req, res) => {
  res.render("newEvent");
});

// Route to handle new event creation
app.post("/events/new", isAuthenticated, isOrganizer, async (req, res) => {
  const { title, description, start_date, end_date } = req.body;
  const userId = req.session.user.uid; // Get the organizer's user ID

  try {
    // Validate input
    if (!title || !description || !start_date || !end_date) {
      req.flash("error", "All fields are required.");
      return res.redirect("/events/new");
    }

    // Add event to Firestore with the organizer's user ID
    const eventRef = await admin.firestore().collection("events").add({
      title,
      description,
      start_date,
      end_date,
      createdBy: userId, // Store the organizer's user ID
      participants: [], // Initialize empty participants array
    });

    req.flash("success", "Event created successfully!");
    res.redirect("/events");
  } catch (error) {
    console.error("Error creating event:", error);
    req.flash("error", "Failed to create event. Please try again.");
    res.redirect("/events/new");
  }
});

// Fetch challenges for a specific event
// Route to view challenges for a specific event
// Example route for challenges
// Example route for challenges
app.get("/events/:eventId/challenges", isAuthenticated, async (req, res) => {
  const eventId = req.params.eventId;

  try {
    // Fetch the event details
    const eventDoc = await admin.firestore().collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      req.flash("error", "Event not found!");
      return res.redirect("/events");
    }

    const eventData = eventDoc.data();

    // Fetch challenges for the event
    const challengesSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("challenges")
      .get();

    const challenges = [];
    challengesSnapshot.forEach((doc) => {
      challenges.push({ id: doc.id, ...doc.data() });
    });

    // Render the challenges page
    res.render("challenges", {
      event: { id: eventId, ...eventData },
      challenges,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    req.flash("error", "Failed to load challenges.");
    res.redirect("/events");
  }
});
app.post("/events/:eventId/challenges/:challengeId/delete", isAuthenticated, isOrganizer, async (req, res) => {
  const eventId = req.params.eventId;
  const challengeId = req.params.challengeId;
  const userId = req.session.user.uid; // Get the organizer's user ID

  try {
    // Fetch the event details
    const eventDoc = await admin.firestore().collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      req.flash("error", "Event not found!");
      return res.redirect("/events");
    }

    const eventData = eventDoc.data();

    // Check if the organizer is the owner of the event
    if (eventData.createdBy !== userId) {
      req.flash("error", "You do not have permission to delete challenges in this event.");
      return res.redirect(`/events/${eventId}/challenges`);
    }

    // Delete the challenge
    await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("challenges")
      .doc(challengeId)
      .delete();

    req.flash("success", "Challenge deleted successfully!");
  } catch (error) {
    console.error("Error deleting challenge:", error);
    req.flash("error", "Failed to delete challenge.");
  }

  res.redirect(`/events/${eventId}/challenges`);
});
app.post("/events/:id/delete", isAuthenticated, isOrganizer, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.uid;

  try {
    const eventDoc = await admin.firestore().collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      req.flash("error", "Event not found!"); 
      return res.redirect("/events");
    }

    const eventData = eventDoc.data();
    if (eventData.createdBy !== userId) {
      req.flash("error", "You do not have permission to delete this event.");
      return res.redirect("/events");
    }

    await admin.firestore().collection("events").doc(eventId).delete();
    req.flash("success", "Event deleted successfully!");
  } catch (error) {
    console.error("Error deleting event:", error);
    req.flash("error", "Failed to delete event.");
  }

  res.redirect("/events");
});



// Route for hackers to join an event
// Route for hackers to join an event
app.post("/events/:eventId/join", isAuthenticated, async (req, res) => {
  const eventId = req.params.eventId;
  const userId = req.session.user.uid;

  try {
    // Add the user to the event's participants list
    await admin.firestore().collection("events").doc(eventId).update({
      participants: admin.firestore.FieldValue.arrayUnion(userId),
    });

    req.flash("success", "You have successfully joined the event!");
    res.redirect(`/events/${eventId}/challenges`);
  } catch (error) {
    console.error("Error joining event:", error);
    req.flash("error", "Failed to join the event. Please try again.");
    res.redirect(`/events/${eventId}`);
  }
});

// Route to render the new challenge form
app.get("/events/:eventId/challenges/new", isAuthenticated, isOrganizer, async (req, res) => {
  const eventId = req.params.eventId;
  const userId = req.session.user.uid; // Get the organizer's user ID

  try {
    // Fetch the event details
    const eventDoc = await admin.firestore().collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      req.flash("error", "Event not found!");
      return res.redirect("/events");
    }

    const eventData = eventDoc.data();

    // Check if the organizer is the owner of the event
    if (eventData.createdBy !== userId) {
      req.flash("error", "You do not have permission to create challenges in this event.");
      return res.redirect(`/events/${eventId}/challenges`);
    }

    // Render the new challenge form
    res.render("newChallenge", { eventId, event: eventData });
  } catch (error) {
    console.error("Error fetching event details:", error);
    req.flash("error", "Failed to load event details.");
    res.redirect(`/events/${eventId}/challenges`);
  }
});

app.post("/events/:eventId/challenges/new", isAuthenticated, isOrganizer, async (req, res) => {
  const eventId = req.params.eventId;
  const { title, description, points, correctFlag, categories } = req.body;

  try {
    if (!title || !description || !points || !correctFlag || !categories) {
      req.flash("error", "All fields are required.");
      return res.redirect(`/events/${eventId}/challenges/new`);
    }

    await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("challenges")
      .add({
        title,
        description,
        points: Number(points),
        correctFlag,
        categories: categories.split(","),
      });

    req.flash("success", "Challenge added successfully!");
    res.redirect(`/events/${eventId}/challenges`);
  } catch (error) {
    console.error("Error adding challenge:", error);
    req.flash("error", "Failed to add challenge.");
    res.redirect(`/events/${eventId}/challenges/new`);
  }
});

// Fetch leaderboard for a specific event
// Fetch leaderboard for a specific event
app.get("/events/:eventId/leaderboard", isAuthenticated, async (req, res) => {
  const eventId = req.params.eventId;

  try {
    const eventDoc = await admin.firestore().collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      req.flash("error", "Event not found!");
      return res.redirect("/events");
    }

    const eventData = eventDoc.data();

    const usersSnapshot = await admin.firestore().collection("users").get();
    const users = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const eventPoints = userData.eventPoints?.[eventId] || 0;
      const completedChallenges = userData.completedChallenges?.[eventId] || [];

      users.push({
        username: userData.username,
        points: eventPoints,
        completedChallenges: completedChallenges,
      });
    });

    users.sort((a, b) => b.points - a.points);

    res.render("leaderboard", {
      event: { id: eventId, ...eventData }, // Pass the event object
      users,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    req.flash("error", "Failed to load leaderboard.");
    res.redirect(`/events/${eventId}`);
  }
});
// Fetch details of a specific challenge within an event
// Route to view details of a specific challenge
app.get("/events/:eventId/challenges/:challengeId", isAuthenticated, async (req, res) => {
  const eventId = req.params.eventId;
  const challengeId = req.params.challengeId;
  const user = req.session.user;

  try {
    // Fetch the event details
    const eventDoc = await admin.firestore().collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      req.flash("error", "Event not found!");
      return res.redirect("/events");
    }

    const eventData = eventDoc.data();

    // Fetch the specific challenge details
    const challengeDoc = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("challenges")
      .doc(challengeId)
      .get();

    if (!challengeDoc.exists) {
      req.flash("error", "Challenge not found!");
      return res.redirect(`/events/${eventId}/challenges`);
    }

    const challengeData = challengeDoc.data();

    // Check if the user is an organizer
    if (user && user.role === "organizer") {
      // Redirect organizers to the edit page
      return res.redirect(`/events/${eventId}/challenges/${challengeId}/edit`);
    }

    // Render the challenge details page for hackers
    res.render("challengeDetail", {
      event: { id: eventId, ...eventData },
      challenge: { id: challengeId, ...challengeData },
      user,
    });
  } catch (error) {
    console.error("Error fetching challenge details:", error);
    req.flash("error", "Failed to load challenge details.");
    res.redirect(`/events/${eventId}/challenges`);
  }
});

app.get("/events/:eventId/challenges/:challengeId/edit", isAuthenticated, isOrganizer, async (req, res) => {
  const eventId = req.params.eventId;
  const challengeId = req.params.challengeId;
  const userId = req.session.user.uid; // Get the organizer's user ID

  try {
    // Fetch the event details
    const eventDoc = await admin.firestore().collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      req.flash("error", "Event not found!");
      return res.redirect("/events");
    }

    const eventData = eventDoc.data();

    // Check if the organizer is the owner of the event
    if (eventData.createdBy !== userId) {
      req.flash("error", "You do not have permission to edit challenges in this event.");
      return res.redirect(`/events/${eventId}/challenges`);
    }

    // Fetch the specific challenge details
    const challengeDoc = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("challenges")
      .doc(challengeId)
      .get();

    if (!challengeDoc.exists) {
      req.flash("error", "Challenge not found!");
      return res.redirect(`/events/${eventId}/challenges`);
    }

    const challengeData = challengeDoc.data();

    // Render the edit challenge form
    res.render("editChallenge", {
      event: { id: eventId, ...eventData },
      challenge: { id: challengeId, ...challengeData },
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error fetching challenge details:", error);
    req.flash("error", "Failed to load challenge details.");
    res.redirect(`/events/${eventId}/challenges`);
  }
});

app.post("/events/:eventId/challenges/:challengeId/update", isAuthenticated, isOrganizer, async (req, res) => {
  const eventId = req.params.eventId;
  const challengeId = req.params.challengeId;
  const { title, description, points, correctFlag, categories } = req.body;

  try {
    // Update the challenge in Firestore
    await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("challenges")
      .doc(challengeId)
      .update({
        title,
        description,
        points: Number(points),
        correctFlag,
        categories: categories.split(","), // Convert comma-separated string to array
      });

    req.flash("success", "Challenge updated successfully!");
    res.redirect(`/events/${eventId}/challenges`);
  } catch (error) {
    console.error("Error updating challenge:", error);
    req.flash("error", "Failed to update challenge.");
    res.redirect(`/events/${eventId}/challenges/${challengeId}/edit`);
  }
});
// Flag submission route
// Route to handle flag submission
app.post("/events/:eventId/challenges/:challengeId/submit", isAuthenticated, async (req, res) => {
  const eventId = req.params.eventId;
  const challengeId = req.params.challengeId;
  const submittedFlag = req.body.flag;
  const userId = req.session.user.uid;

  try {
    // Fetch the challenge details
    const challengeDoc = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("challenges")
      .doc(challengeId)
      .get();

    if (!challengeDoc.exists) {
      req.flash("error", "Challenge not found!");
      return res.redirect(`/events/${eventId}/challenges`);
    }

    const challengeData = challengeDoc.data();

    // Fetch the user details
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      req.flash("error", "User not found!");
      return res.redirect(`/events/${eventId}/challenges`);
    }

    const userData = userDoc.data();

    // Check if the user has already solved this challenge
    const completedChallenges = userData.completedChallenges || [];
    if (completedChallenges.includes(challengeId)) {
      req.flash("error", "You have already solved this challenge!");
      return res.redirect(`/events/${eventId}/challenges/${challengeId}`);
    }

    // Validate the submitted flag
    if (submittedFlag === challengeData.correctFlag) {
      // Update user's points and completed challenges
      const eventPoints = userData.eventPoints || {};
      const currentPoints = eventPoints[eventId] || 0;
      const newPoints = currentPoints + challengeData.points;

      await userRef.update({
        completedChallenges: [...completedChallenges, challengeId],
        eventPoints: { ...eventPoints, [eventId]: newPoints },
      });

      req.flash("success", `Correct flag! You earned ${challengeData.points} points.`);
    } else {
      req.flash("error", "Incorrect flag. Try again!");
    }

    res.redirect(`/events/${eventId}/challenges/${challengeId}`);
  } catch (error) {
    console.error("Error validating flag:", error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect(`/events/${eventId}/challenges/${challengeId}`);
  }
});

// Login/Logout Routes
app.get("/login", blockIfAuthenticated, (req, res) => res.render("login"));
app.get("/register", blockIfAuthenticated, (req, res) => res.render("register"));

// Registration Route
app.post("/register", async (req, res) => {
  const { name, username, email, password, confirmPassword, role } = req.body;

  if (password !== confirmPassword) {
    req.flash("error", "Passwords do not match!");
    return res.redirect("/register");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      username,
      email,
      displayName: name,
      hashedPassword,
      role: role || "hacker", // Default to 'hacker' if role is not provided
      points: 0,
      completedChallenges: [],
    });

    req.flash("success", "Registration successful! Please log in.");
    res.redirect("/login");
  } catch (error) {
    console.error("Registration Error:", error.message);
    req.flash("error", "Registration failed. Please try again.");
    res.redirect("/register");
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userSnapshot = await admin.firestore().collection("users").where("email", "==", email).limit(1).get();
    if (userSnapshot.empty) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    const isPasswordValid = await bcrypt.compare(password, userData.hashedPassword);
    if (!isPasswordValid) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    req.session.user = {
      uid: userDoc.id,
      displayName: userData.displayName,
      email: userData.email,
      role: userData.role,
    };

    res.cookie("auth", "true", { path: "/", secure: true, httpOnly: true });
    req.flash("success", "Login successful!");
    res.redirect("/events");
  } catch (error) {
    console.error("Login Error:", error.message);
    req.flash("error", "Login failed. Please try again.");
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Failed to logout");
    res.redirect("/");
  });
});

app.get("/write-ups", (req, res) => {
  res.render("write-ups");
});

app.get("/robots.txt", (req, res) => {
  const filePath = path.join(__dirname, "robots.txt");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading robots.txt file:", err);
      res.status(500).send("Error loading robots.txt");
    } else {
      res.type("text/plain");
      res.send(data);
    }
  });
});

app.get("/*", (req, res) => res.status(404).render("notfound"));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));