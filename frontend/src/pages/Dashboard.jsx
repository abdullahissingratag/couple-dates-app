import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CalendarDays,
  MapPin,
  Heart,
  PlusCircle,
  Pencil,
  Trash2,
  Images,
} from "lucide-react";

// Backend origin comes from the VITE_API_URL env var (set in .env locally and
// in the Vercel dashboard for production). Falls back to the local server so
// `npm run dev` works with no .env present.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api/dates`;

// Assumes Philippine pesos (the app is scoped to Zamboanga City). Change the
// locale/currency here if you track dates elsewhere.
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Sum all itemized expenses for a single date.
function dateTotal(expenses = []) {
  return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchDates() {
      try {
        const { data } = await axios.get(API_URL);
        // Guard against a non-array payload (an error object, or an HTML page
        // from a misconfigured API URL). Storing that would crash `.map()`
        // later, so we normalize to an empty array and warn instead.
        if (!ignore) {
          if (Array.isArray(data)) {
            setDates(data);
          } else {
            console.warn("Expected an array from", API_URL, "but got:", data);
            setDates([]);
            setError("The server returned unexpected data. Check the API URL.");
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(
            "Couldn't reach the server. Make sure it's running on port 5000.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchDates();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Delete this date? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      // Drop it from local state so the list updates instantly.
      setDates((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      window.alert("Couldn't delete this date. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  // Loading — lightweight skeleton cards
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-stone-200/60"
          />
        ))}
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  // Empty state — an invitation to act. The Array.isArray guard is belt-and-
  // suspenders: setDates already normalizes to an array, but this guarantees
  // we never reach dates.map() below with a non-array value.
  if (!Array.isArray(dates) || dates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <Heart className="h-7 w-7 text-rose-500" strokeWidth={2} />
        </div>
        <h2 className="text-base font-semibold text-stone-800">
          No dates logged yet!
        </h2>
        <p className="mt-1 max-w-xs text-sm text-stone-500">
          Your memories will live here. Log your first outing to get started.
        </p>
        <Link
          to="/add"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
        >
          <PlusCircle className="h-4 w-4" />
          Add your first date
        </Link>
      </div>
    );
  }

  // List of dates
  return (
    <div className="space-y-3">
      {dates.map((d) => {
        const total = dateTotal(d.expenses);
        const isDeleting = deletingId === d._id;
        return (
          <article
            key={d._id}
            className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition ${
              isDeleting ? "opacity-50" : "hover:shadow-md"
            }`}
          >
            {/* Cover photo — bleeds to the card edges; overflow-hidden on the
                article clips it to the card's rounded-2xl corners. */}
            {d.photos?.length > 0 && (
              <div className="relative">
                <img
                  src={d.photos[0]}
                  alt={d.title}
                  loading="lazy"
                  className="h-48 w-full object-cover"
                />
                {d.photos.length > 1 && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-stone-900/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    <Images className="h-3.5 w-3.5" />
                    {d.photos.length}
                  </span>
                )}
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold leading-tight text-stone-800">
                  {d.title}
                </h3>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/edit/${d._id}`)}
                    disabled={isDeleting}
                    aria-label="Edit date"
                    className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d._id)}
                    disabled={isDeleting}
                    aria-label="Delete date"
                    className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-stone-500">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-stone-400" />
                    {formatDate(d.date)}
                  </span>
                  {d.location?.name && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-stone-400" />
                      {d.location.name}
                    </span>
                  )}
                </div>
                {d.expenses?.length > 0 && (
                  <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                    {peso.format(total)}
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
