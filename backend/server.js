require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const dateRoutes = require("./routes/dateRoutes");

const app = express();

// ---- Middleware ----
// Only these origins may call the API from a browser. Each must be scheme +
// host ONLY — no trailing slash, no path. Add more (e.g. Vercel preview URLs)
// as needed. With credentials:true you cannot use a "*" wildcard, so origins
// are listed explicitly.
const allowedOrigins = [
  "http://localhost:5173", // Vite dev server
  "https://couple-dates-app.vercel.app", // deployed frontend
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
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
