const mongoose = require("mongoose");

/**
 * Schema for a single "date" entry — the who/what/where/how-much of an outing.
 * The model is named `DateEntry` (not `Date`) so it never shadows the built-in
 * JavaScript `Date` object used below for the default timestamp.
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
    locationName: {
      type: String,
      trim: true,
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
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidBy: {
      type: String,
      enum: ["Me", "Her", "Split"],
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  },
);

module.exports = mongoose.model("DateEntry", dateSchema);
