const express = require("express");
const router = express.Router();
const DateEntry = require("../models/DateEntry");

/**
 * @route   GET /api/dates/summary
 * @desc    Spending totals across all dates, computed from itemized expenses,
 *          plus a count of how many dates have been logged.
 *
 * NOTE: This static route is declared BEFORE any parameterized routes so that
 * "summary" is never mistaken for an :id.
 *
 * Returns: { totalSpent, paidByMe, paidByHer, split, totalDates }
 */
router.get("/summary", async (req, res) => {
  try {
    const [result] = await DateEntry.aggregate([
      {
        $facet: {
          totals: [
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
          ],
          count: [{ $count: "totalDates" }],
        },
      },
      {
        $project: {
          totalSpent: {
            $ifNull: [{ $arrayElemAt: ["$totals.totalSpent", 0] }, 0],
          },
          paidByMe: { $ifNull: [{ $arrayElemAt: ["$totals.paidByMe", 0] }, 0] },
          paidByHer: {
            $ifNull: [{ $arrayElemAt: ["$totals.paidByHer", 0] }, 0],
          },
          split: { $ifNull: [{ $arrayElemAt: ["$totals.split", 0] }, 0] },
          totalDates: {
            $ifNull: [{ $arrayElemAt: ["$count.totalDates", 0] }, 0],
          },
        },
      },
    ]);

    res.json(
      result || {
        totalSpent: 0,
        paidByMe: 0,
        paidByHer: 0,
        split: 0,
        totalDates: 0,
      },
    );
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
 * @route   GET /api/dates/:id
 * @desc    Fetch a single date entry by its id — used to pre-fill the edit form.
 *
 * NOTE: Declared AFTER '/summary' so the literal "summary" path is never
 * captured here as an :id.
 */
router.get("/:id", async (req, res) => {
  try {
    const entry = await DateEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Date entry not found" });
    }
    res.json(entry);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid id format" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * @route   PUT /api/dates/:id
 * @desc    Update an existing date entry.
 *
 *          The edit form always resubmits the whole record, so this behaves as
 *          a replace: fields that are present are $set, and optional fields the
 *          user cleared (and therefore omitted) are $unset. That's what lets an
 *          edit actually remove a category, rating, note, or location — a plain
 *          findByIdAndUpdate($set) would silently keep the old value.
 *
 *          title, date, and expenses are always sent by the form, so they're
 *          always written (expenses defaults to [] when the user removes them).
 */
router.put("/:id", async (req, res) => {
  try {
    const { title, date, expenses, category, rating, notes, location } =
      req.body;

    const $set = {};
    const $unset = {};

    // Always-present fields.
    if (title !== undefined) $set.title = title;
    if (date !== undefined) $set.date = date;
    $set.expenses = Array.isArray(expenses) ? expenses : [];

    // Optional fields: set when provided, clear when omitted.
    const optional = { category, rating, notes, location };
    for (const [key, value] of Object.entries(optional)) {
      if (value === undefined) {
        $unset[key] = "";
      } else {
        $set[key] = value;
      }
    }

    const update = { $set };
    if (Object.keys($unset).length > 0) update.$unset = $unset;

    const updated = await DateEntry.findByIdAndUpdate(req.params.id, update, {
      new: true, // return the updated document
      runValidators: true, // enforce enum / min / required rules on update
    });

    if (!updated) {
      return res.status(404).json({ message: "Date entry not found" });
    }
    res.json(updated);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation failed", error: err.message });
    }
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid id format" });
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
