require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const dateRoutes = require("./routes/dateRoutes");

const app = express();

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ---- Routes ----
app.use("/api/dates", dateRoutes);

// Simple health check
app.get("/", (req, res) => {
  res.send("Date Tracker API is running");
});

const PORT = process.env.PORT || 5000;

// ---- Connect to MongoDB Atlas, then start the server ----
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
