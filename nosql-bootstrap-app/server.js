const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config(); // Load .env variables

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const mongoURI =
  process.env.MONGODB_URI ||
  "mongodb+srv://johnteleron21:lunax1234@cluster0.iqfstdr.mongodb.net/test"; // fallback URI

console.log("MONGODB_URI from .env =", process.env.MONGODB_URI);

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Stop server if DB fails
  });

// ================================
// 🧩 Schema & Model
// ================================
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

// ================================
// 🚀 Routes
// ================================

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Server is running and ready!");
});

// Create a new user
app.post("/api/users", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    const newUser = new User({ name, email });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// 🟢 Start Server
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
