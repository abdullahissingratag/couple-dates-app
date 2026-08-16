const mongoose = require("mongoose");

/**
 * A single itemized expense within a date (e.g. "Movie tickets", "Popcorn").
 * Each line has its own payer so we can split costs accurately.
 */
const expenseSchema = new mongoose.Schema({
  item: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  paidBy: {
    type: String,
    enum: ["Me", "Her", "Split"],
    default: "Split",
  },
});

/**
 * Schema for a single "date" entry. Model is named `DateEntry` (not `Date`) so
 * it never shadows the built-in JavaScript `Date` used for the default below.
 */
const dateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A title is required"],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // Structured location, populated from the OpenStreetMap Nominatim search.
    location: {
      name: { type: String, trim: true },
      address: { type: String, trim: true },
      lat: { type: Number },
      lon: { type: Number },
    },
    category: {
      type: String,
      enum: ["Dining", "Entertainment", "Outdoor", "Travel", "Casual", "Other"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    notes: {
      type: String,
      trim: true,
    },
    // Itemized expenses replace the old single totalAmount / paidBy pair.
    expenses: {
      type: [expenseSchema],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  },
);

module.exports = mongoose.model("DateEntry", dateSchema);
