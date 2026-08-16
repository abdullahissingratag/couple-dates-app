import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { CalendarDays, MapPin, Heart, PlusCircle } from "lucide-react";

const API_URL = "http://localhost:5000/api/dates";

// Consistent color coding for who paid — the color itself carries the meaning.
const payerStyles = {
  Me: "bg-sky-50 text-sky-700 ring-sky-600/20",
  Her: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Split: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchDates() {
      try {
        const { data } = await axios.get(API_URL);
        if (!ignore) setDates(data);
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

  // Empty state — an invitation to act
  if (dates.length === 0) {
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
      {dates.map((d) => (
        <article
          key={d._id}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-tight text-stone-800">
              {d.title}
            </h3>
            {d.paidBy && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  payerStyles[d.paidBy] ??
                  "bg-stone-100 text-stone-600 ring-stone-500/20"
                }`}
              >
                {d.paidBy === "Split" ? "Split" : `Paid by ${d.paidBy}`}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-stone-400" />
              {formatDate(d.date)}
            </span>
            {d.locationName && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-stone-400" />
                {d.locationName}
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
