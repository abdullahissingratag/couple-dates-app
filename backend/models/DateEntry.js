const mongoose = require("mongoose");

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

    photos: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  },
);

module.exports = mongoose.model("DateEntry", dateSchema);
