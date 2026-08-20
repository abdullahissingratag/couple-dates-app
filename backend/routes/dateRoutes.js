const express = require("express");
const router = express.Router();
const DateEntry = require("../models/DateEntry");

/**
 * @route
 * @desc
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
 * @route
 * @desc
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
 * @route
 * @desc
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
 * @route
 * @desc
 *
 *
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
 * @route
 * @desc
 */
router.put("/:id", async (req, res) => {
  try {
    const { title, date, expenses, category, rating, notes, location, photos } =
      req.body;

    const $set = {};
    const $unset = {};

    // Always-present fields.
    if (title !== undefined) $set.title = title;
    if (date !== undefined) $set.date = date;
    $set.expenses = Array.isArray(expenses) ? expenses : [];
    $set.photos = Array.isArray(photos) ? photos : [];

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
