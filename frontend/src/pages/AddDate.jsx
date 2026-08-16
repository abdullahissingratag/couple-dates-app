import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Star, Heart, Loader2, MapPin, Plus, Trash2 } from "lucide-react";

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

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

// Local YYYY-MM-DD so the picker defaults to *today* in the user's timezone.
const todayLocal = () => new Date().toLocaleDateString("en-CA");

const emptyExpense = () => ({ item: "", amount: "", paidBy: "Split" });

export default function AddDate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);

  const [form, setForm] = useState({
    title: "",
    date: todayLocal(),
    category: "",
    rating: 0,
    notes: "",
  });

  // ---- Itemized expenses ----
  const [expenses, setExpenses] = useState([emptyExpense()]);

  const expensesTotal = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0,
  );

  function addExpense() {
    setExpenses((prev) => [...prev, emptyExpense()]);
  }
  function removeExpense(index) {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  }
  function updateExpense(index, field, value) {
    setExpenses((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)),
    );
  }

  // ---- Location autocomplete (OpenStreetMap Nominatim) ----
  const [locationQuery, setLocationQuery] = useState("");
  const [location, setLocation] = useState(null); // selected { name, address, lat, lon }
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const skipSearchRef = useRef(false); // don't re-search right after a selection

  useEffect(() => {
    // Skip the search that a selection would otherwise trigger.
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (locationQuery.trim().length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    // Debounce: Nominatim asks for <= 1 request/second, so wait for a pause.
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        // Nominatim ignores the structured `city` param when a free-form `q`
        // is present, so we bias to Zamboanga City by appending it to the
        // query and limiting to the Philippines instead.
        const q = `${locationQuery}, Zamboanga City, Philippines`;
        const url =
          "https://nominatim.openstreetmap.org/search" +
          `?format=json&addressdetails=1&limit=5&countrycodes=ph&q=${encodeURIComponent(q)}`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: { "Accept-Language": "en" },
        });
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setShowResults(true);
      } catch (err) {
        if (err.name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locationQuery]);

  function selectPlace(place) {
    const name = place.name || place.display_name.split(",")[0].trim();
    skipSearchRef.current = true;
    setLocation({
      name,
      address: place.display_name,
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
    });
    setLocationQuery(name);
    setResults([]);
    setShowResults(false);
  }

  // ---- Rating ----
  function setRating(n) {
    setForm((prev) => ({ ...prev, rating: prev.rating === n ? 0 : n }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Keep only expenses that have something in them, and cast amounts.
    const cleanedExpenses = expenses
      .filter((exp) => exp.item.trim() !== "" || exp.amount !== "")
      .map((exp) => ({
        item: exp.item.trim(),
        amount: exp.amount === "" ? 0 : Number(exp.amount),
        paidBy: exp.paidBy,
      }));

    // Build a payload whose keys match the Mongoose schema exactly.
    const payload = { title: form.title.trim(), date: form.date };
    if (form.category) payload.category = form.category;
    if (form.rating > 0) payload.rating = form.rating;
    if (form.notes.trim()) payload.notes = form.notes.trim();
    if (cleanedExpenses.length > 0) payload.expenses = cleanedExpenses;

    // Prefer the geocoded selection; fall back to whatever was typed.
    if (location) {
      payload.location = location;
    } else if (locationQuery.trim()) {
      payload.location = { name: locationQuery.trim() };
    }

    try {
      await axios.post(API_URL, payload);
      navigate("/");
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

        {/* Location autocomplete */}
        <div>
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="location"
              type="text"
              autoComplete="off"
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                setLocation(null); // typing invalidates a prior selection
              }}
              onFocus={() => results.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
              placeholder="Search a place in Zamboanga City"
              className={`${fieldClass} pl-9 pr-9`}
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-stone-400" />
            )}

            {showResults &&
              (results.length > 0 ||
                (!searching && locationQuery.trim().length >= 3)) && (
                <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                  {results.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-stone-400">
                      No matches found.
                    </li>
                  ) : (
                    results.map((place) => (
                      <li key={place.place_id}>
                        <button
                          type="button"
                          // onMouseDown fires before the input's onBlur, so the
                          // selection registers before the dropdown closes.
                          onMouseDown={() => selectPlace(place)}
                          className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50"
                        >
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                          <span className="text-stone-700">
                            {place.display_name}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
          </div>
          {location?.lat != null && (
            <p className="mt-1.5 text-xs text-stone-400">
              Pinned at {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
            </p>
          )}
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

        {/* Expenses */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={`${labelClass} mb-0`}>Expenses</label>
            <span className="text-sm font-medium text-stone-500">
              Total {peso.format(expensesTotal)}
            </span>
          </div>

          <div className="space-y-2">
            {expenses.map((exp, index) => (
              <div
                key={index}
                className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
              >
                <input
                  type="text"
                  value={exp.item}
                  onChange={(e) => updateExpense(index, "item", e.target.value)}
                  placeholder="Item (e.g. Movie tickets)"
                  className={fieldClass}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={exp.amount}
                    onChange={(e) =>
                      updateExpense(index, "amount", e.target.value)
                    }
                    placeholder="0.00"
                    className={`${fieldClass} flex-1`}
                  />
                  <select
                    value={exp.paidBy}
                    onChange={(e) =>
                      updateExpense(index, "paidBy", e.target.value)
                    }
                    className={`${fieldClass} flex-1`}
                    aria-label="Paid by"
                  >
                    {PAYERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeExpense(index)}
                    aria-label="Remove expense"
                    className="shrink-0 rounded-lg p-2 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addExpense}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
          >
            <Plus className="h-4 w-4" />
            Add expense
          </button>
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
