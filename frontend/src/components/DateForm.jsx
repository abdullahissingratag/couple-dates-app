import { useState, useEffect, useRef } from "react";
import {
  Star,
  Heart,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  ImagePlus,
  X,
} from "lucide-react";

const CATEGORIES = [
  "Dining",
  "Entertainment",
  "Outdoor",
  "Travel",
  "Casual",
  "Other",
];
const PAYERS = ["Me", "Her", "Split"];

const CLOUDINARY_CLOUD_NAME = "atcwcfgg";
const CLOUDINARY_UPLOAD_PRESET = "thrwa8xe";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const fieldClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 shadow-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200";
const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const todayLocal = () => new Date().toLocaleDateString("en-CA");
const emptyExpense = () => ({ item: "", amount: "", paidBy: "Split" });

function toDateInput(value) {
  if (!value) return todayLocal();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
    return value.slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? todayLocal()
    : d.toLocaleDateString("en-CA");
}

function toExpenseRow(e) {
  return {
    item: e?.item ?? "",
    amount: e?.amount != null ? String(e.amount) : "",
    paidBy: e?.paidBy ?? "Split",
  };
}

export default function DateForm({ initialData, onSubmit, isSubmitting }) {
  const isEditing = Boolean(initialData);
  const [hoverRating, setHoverRating] = useState(0);

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    date: toDateInput(initialData?.date),
    category: initialData?.category ?? "",
    rating: initialData?.rating ?? 0,
    notes: initialData?.notes ?? "",
  });

  // ---- Itemized expenses ----
  const [expenses, setExpenses] = useState(
    initialData?.expenses?.length
      ? initialData.expenses.map(toExpenseRow)
      : [emptyExpense()],
  );

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
  const [locationQuery, setLocationQuery] = useState(
    initialData?.location?.name ?? "",
  );
  const [location, setLocation] = useState(initialData?.location ?? null);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const skipSearchRef = useRef(true);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (locationQuery.trim().length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

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

  // ---- Photos (Cloudinary unsigned upload) ----
  const [photos, setPhotos] = useState(initialData?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadError(null);
    setUploading(true);
    try {
      // Upload each selected file, collecting the secure_urls Cloudinary returns.
      const urls = [];
      for (const file of files) {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        // Plain fetch on purpose: the browser sets the multipart boundary itself.
        const res = await fetch(CLOUDINARY_UPLOAD_URL, {
          method: "POST",
          body: data,
        });
        if (!res.ok) throw new Error("Cloudinary upload failed");
        const json = await res.json();
        if (json.secure_url) urls.push(json.secure_url);
      }
      setPhotos((prev) => [...prev, ...urls]);
    } catch (err) {
      setUploadError("Couldn't upload that image. Please try again.");
    } finally {
      setUploading(false);
      // Reset the input so picking the same file again still fires onChange.
      e.target.value = "";
    }
  }

  function removePhoto(url) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  // ---- Rating ----
  function setRating(n) {
    setForm((prev) => ({ ...prev, rating: prev.rating === n ? 0 : n }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Keep only expenses that have something in them, and cast amounts.
    const cleanedExpenses = expenses
      .filter((exp) => exp.item.trim() !== "" || exp.amount !== "")
      .map((exp) => ({
        item: exp.item.trim(),
        amount: exp.amount === "" ? 0 : Number(exp.amount),
        paidBy: exp.paidBy,
      }));

    // title, date, and expenses are always sent (expenses may be []). Optional
    // fields are only included when set — on edit, omitting one tells the PUT
    // route to clear it.
    const payload = {
      title: form.title.trim(),
      date: form.date,
      expenses: cleanedExpenses,
    };
    if (form.category) payload.category = form.category;
    if (form.rating > 0) payload.rating = form.rating;
    if (form.notes.trim()) payload.notes = form.notes.trim();
    if (location) payload.location = location;
    else if (locationQuery.trim())
      payload.location = { name: locationQuery.trim() };
    // Photos are always sent as an array (possibly empty), like expenses, so an
    // edit that removes every photo actually clears them on the backend.
    payload.photos = photos;

    onSubmit(payload);
  }

  return (
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
                    active ? "fill-amber-400 text-amber-400" : "text-stone-300"
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

      {/* Photos */}
      <div>
        <label className={labelClass}>Photos</label>

        {/* Thumbnail previews */}
        {photos.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {photos.map((url) => (
              <div
                key={url}
                className="group relative h-20 w-20 overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
              >
                <img
                  src={url}
                  alt="Date photo"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 rounded-full bg-stone-900/60 p-1 text-white opacity-0 transition-opacity hover:bg-stone-900/80 focus:opacity-100 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload control — a styled label wrapping a hidden file input */}
        <label
          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors ${
            uploading
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" />
              Add photos
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {uploadError && (
          <p className="mt-1.5 text-xs text-rose-600">{uploadError}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Heart className="h-4 w-4" />
            {isEditing ? "Save changes" : "Save date"}
          </>
        )}
      </button>
    </form>
  );
}
