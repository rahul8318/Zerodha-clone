const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Models
const User = require('./models/UserModel');
const HoldingModel = require('./models/HoldingModel');
const PositionModel = require('./models/PositionModel');
const OrderModel = require('./models/OrderModel');

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"], 
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "secretKey",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Passport Config
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Local Strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  const user = await User.findOne({ username });
  if (!user) return done(null, false, { message: "User not found" });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return done(null, false, { message: "Incorrect password" });
  return done(null, user);
}));
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://zerodha-clone-7vge.onrender.comauth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    // Find or create user
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({ 
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value
      });
    }
    return done(null, user);
  }
));

// Google login route
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback route
app.get("/auth/google/callback", 
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:3000"); 
  }
);
const GitHubStrategy = require("passport-github2").Strategy;

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://zerodha-clone-7vge.onrender.com/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ githubId: profile.id });
      if (!user) {
        user = await User.create({
          githubId: profile.id,
          username: profile.username,
          email: profile.emails?.[0]?.value || ""
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));
// Redirect user to GitHub login
app.get("/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

// GitHub callback
app.get("/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    // Successful login, redirect to frontend
    res.redirect("http://localhost:3000");
  }
);


// Middleware to protect routes
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}

// =======================
// User Routes
// =======================

// Register
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    res.json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// Login
app.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Logged in successfully", user: req.user });
});

// Logout
app.get("/logout", (req, res) => {
  req.logout(() => res.json({ message: "Logged out successfully" }));
});

// Get current logged-in user
app.get("/current-user", (req, res) => {
  if (req.isAuthenticated()) res.json({ user: req.user });
  else res.json({ user: null });
});

// =======================
// Holdings Routes
// =======================

// =======================
// Holdings Routes
// =======================
app.get("/holdings", async (req, res) => {
  try {
    const allHoldings = await HoldingModel.find({});
    res.json(allHoldings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching holdings", error: err.message });
  }
});

app.post("/holdings", async (req, res) => {
  try {
    const newHolding = new HoldingModel(req.body);
    await newHolding.save();
    res.json({ message: "Holding added", holding: newHolding });
  } catch (err) {
    res.status(500).json({ message: "Error adding holding", error: err.message });
  }
});

// =======================
// Positions Routes
// =======================
app.get("/positions", async (req, res) => {
  try {
    const allPositions = await PositionModel.find({});
    res.json(allPositions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching positions", error: err.message });
  }
});

app.post("/positions", async (req, res) => {
  try {
    const newPosition = new PositionModel(req.body);
    await newPosition.save();
    res.json({ message: "Position added", position: newPosition });
  } catch (err) {
    res.status(500).json({ message: "Error adding position", error: err.message });
  }
});

// =======================
// Orders Routes
// =======================
app.get("/orders", async (req, res) => {
  try {
    const allOrders = await OrderModel.find({});
    res.json(allOrders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const newOrder = new OrderModel(req.body);
    await newOrder.save();
    res.json({ message: "Order saved", order: newOrder });
  } catch (err) {
    res.status(500).json({ message: "Error saving order", error: err.message });
  }
});

// =======================
// Start server
// =======================
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
