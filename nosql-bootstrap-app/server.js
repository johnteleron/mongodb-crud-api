const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
// Ensure you have dotenv installed if you use it locally
require("dotenv").config(); 

const app = express();
const PORT = process.env.PORT || 5000; // Use environment PORT first

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('client'))

// ----------------------------------------------------
// ✅ FIX 1: Use only the environment variable for security and deployment
const mongoURI = process.env.MONGODB_URI;

// Check if URI is available before attempting to connect
if (!mongoURI) {
    console.error("❌ CRITICAL ERROR: MONGODB_URI environment variable is not set!");
    console.error("Please set it in your Render dashboard or local .env file.");
    process.exit(1); 
}

console.log("Attempting to connect to MongoDB...");

mongoose
  .connect(mongoURI) // Removed unused options (now default)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    // Exit if DB connection fails
    process.exit(1); 
  });
// ----------------------------------------------------


// ================================
// 🧩 User Schema & Model
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

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

// ================================
// 🧩 Product Schema & Model
// ================================
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, default: 0 }, 
    image: { type: String, default: '' },
}, { timestamps: true });

const Product = mongoose.model("Product", ProductSchema);

// ================================
// 🚀 Routes (Same as before)
// ================================

// Health check
app.get("/", (req, res) => res.send("✅ Server is running!"));

// SIGN UP
app.post("/api/users", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ name: newUser.name, email: newUser.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid credentials" });

    res.json({ message: "Login successful", name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View all users (optional, for testing)
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// 🚀 Product Routes 
// ================================

// GET all products
app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new product
app.post("/api/products", async (req, res) => {
    const { name, price, category, image, quantity } = req.body; 
    try {
        const newProduct = new Product({ name, price, category, image, quantity }); 
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT/PATCH to update a product by ID
app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.status(200).json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a product by ID
app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Deduct stock quantity
app.post("/api/products/stock/deduct", async (req, res) => {
    const { productId, quantity } = req.body;
    
    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: "Invalid product ID or quantity provided." });
    }

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({ error: "Insufficient stock available." });
        }

        product.quantity -= quantity;
        await product.save();

        res.status(200).json({ 
            message: "Stock successfully deducted.", 
            newQuantity: product.quantity 
        });

    } catch (err) {
        console.error("Error deducting stock:", err);
        res.status(500).json({ error: "Server error during stock deduction." });
    }
});


// ================================
// 🟢 Start Server
// ================================
// ✅ CRITICAL FIX: Removed 'localhost'. This allows Render's proxy to connect to your server.
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
