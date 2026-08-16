const express = require("express");
const router = express.Router();
const DateEntry = require("../models/DateEntry");

/**
 * @route   GET /api/dates/summary
 * @desc    Spending totals across all dates, computed from itemized expenses.
 *          $unwind flattens each date's `expenses` array into one document per
 *          line item, so we can sum amounts and break them down by who paid.
 *
 * NOTE: This static route is declared BEFORE any parameterized routes so that
 * "summary" is never mistaken for an :id.
 */
router.get("/summary", async (req, res) => {
  try {
    const [result] = await DateEntry.aggregate([
      { $unwind: "$expenses" },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$expenses.amount" },
          paidByMe: {
            $sum: {
              $cond: [
                { $eq: ["$expenses.paidBy", "Me"] },
                "$expenses.amount",
                0,
              ],
            },
          },
          paidByHer: {
            $sum: {
              $cond: [
                { $eq: ["$expenses.paidBy", "Her"] },
                "$expenses.amount",
                0,
              ],
            },
          },
          split: {
            $sum: {
              $cond: [
                { $eq: ["$expenses.paidBy", "Split"] },
                "$expenses.amount",
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);

    // aggregate returns [] when there are no expenses anywhere yet
    res.json(result || { totalSpent: 0, paidByMe: 0, paidByHer: 0, split: 0 });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * @route   GET /api/dates
 * @desc    Fetch all date entries, most recent first.
 */
router.get("/", async (req, res) => {
  try {
    const dates = await DateEntry.find().sort({ date: -1 });
    res.json(dates);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * @route   POST /api/dates
 * @desc    Create a new date entry.
 */
router.post("/", async (req, res) => {
  try {
    const newDate = await DateEntry.create(req.body);
    res.status(201).json(newDate);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation failed", error: err.message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * @route   DELETE /api/dates/:id
 * @desc    Delete a date entry by its id.
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await DateEntry.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Date entry not found" });
    }
    res.json({ message: "Date entry deleted", id: req.params.id });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid id format" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
