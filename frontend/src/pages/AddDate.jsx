import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Star, Heart, Loader2 } from "lucide-react";

const API_URL = "http://localhost:5000/api/dates";

const CATEGORIES = [
  "Dining",
  "Entertainment",
  "Outdoor",
  "Travel",
  "Casual",
  "Other",
];
const PAYERS = ["Me", "Her", "Split"];

// Shared styling so every field looks consistent.
const fieldClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 shadow-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200";
const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";

// Local YYYY-MM-DD (en-CA formats this way) so the picker defaults to *today*
// in the user's timezone rather than drifting via UTC.
const todayLocal = () => new Date().toLocaleDateString("en-CA");

export default function AddDate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);

  const [form, setForm] = useState({
    title: "",
    date: todayLocal(),
    locationName: "",
    category: "",
    rating: 0,
    totalAmount: "",
    paidBy: "",
    notes: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function setRating(n) {
    // Click the current rating again to clear it.
    setForm((prev) => ({ ...prev, rating: prev.rating === n ? 0 : n }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Build the payload with keys that match the Mongoose schema exactly.
    // Optional fields are omitted when empty so enum/min validators don't trip
    // (e.g. an empty category "" isn't a valid enum value; rating must be >= 1).
    const payload = { title: form.title.trim(), date: form.date };
    if (form.locationName.trim())
      payload.locationName = form.locationName.trim();
    if (form.category) payload.category = form.category;
    if (form.rating > 0) payload.rating = form.rating;
    if (form.totalAmount !== "") payload.totalAmount = Number(form.totalAmount);
    if (form.paidBy) payload.paidBy = form.paidBy;
    if (form.notes.trim()) payload.notes = form.notes.trim();

    try {
      await axios.post(API_URL, payload);
      navigate("/"); // back to the dashboard on success
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Couldn't save this date. Check that the server is running and try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-stone-800">
          Add a date
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Capture the details while they're still fresh.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="Sunset picnic at the park"
            className={fieldClass}
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className={labelClass}>
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="locationName" className={labelClass}>
            Location
          </label>
          <input
            id="locationName"
            name="locationName"
            type="text"
            value={form.locationName}
            onChange={handleChange}
            placeholder="Where did you go?"
            className={fieldClass}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className={labelClass}>
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className={fieldClass}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Rating — star icons */}
        <div>
          <label className={labelClass}>Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = (hoverRating || form.rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className="rounded-md p-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      active
                        ? "fill-amber-400 text-amber-400"
                        : "text-stone-300"
                    }`}
                    strokeWidth={2}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-sm text-stone-400">
              {form.rating > 0 ? `${form.rating}/5` : "Tap to rate"}
            </span>
          </div>
        </div>

        {/* Total Amount */}
        <div>
          <label htmlFor="totalAmount" className={labelClass}>
            Total amount
          </label>
          <input
            id="totalAmount"
            name="totalAmount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={form.totalAmount}
            onChange={handleChange}
            placeholder="0.00"
            className={fieldClass}
          />
        </div>

        {/* Paid By */}
        <div>
          <label htmlFor="paidBy" className={labelClass}>
            Paid by
          </label>
          <select
            id="paidBy"
            name="paidBy"
            value={form.paidBy}
            onChange={handleChange}
            className={fieldClass}
          >
            <option value="">Who paid?</option>
            {PAYERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={form.notes}
            onChange={handleChange}
            placeholder="Anything worth remembering..."
            className={`${fieldClass} resize-none`}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Heart className="h-4 w-4" />
              Save date
            </>
          )}
        </button>
      </form>
    </div>
  );
}
