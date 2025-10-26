const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");


const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(bodyParser.json());


// MongoDB Connection
mongoose.connect(
  "mongodb+srv://johnteleron21:lunax1234@cluster0.iqfstdr.mongodb.net/",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ Connection error:", err));


// Schema & Model
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});


const User = mongoose.model("User", UserSchema);


// Routes


// Create user
app.post("/api/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const newUser = new User({ name, email });
    await newUser.save();
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


