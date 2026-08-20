import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Wallet,
  CalendarDays,
  TrendingUp,
  Users,
  PieChart,
  PlusCircle,
} from "lucide-react";

// Backend origin comes from the VITE_API_URL env var (set in .env locally and
// in the Vercel dashboard for production). Falls back to the local server so
// `npm run dev` works with no .env present.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SUMMARY_URL = `${API_BASE}/api/dates/summary`;

// Same PHP formatter used across the app (scoped to Zamboanga City).
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export default function Stats() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animate, setAnimate] = useState(false); // drives the bar grow-in

  useEffect(() => {
    let ignore = false;

    async function fetchSummary() {
      try {
        const { data } = await axios.get(SUMMARY_URL);
        if (!ignore) setSummary(data);
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

    fetchSummary();
    return () => {
      ignore = true;
    };
  }, []);

  // Once data is in, flip `animate` on the next frame so the bars grow from 0.
  useEffect(() => {
    if (!summary) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [summary]);

  // Safe reads — the API always returns numbers, but default anyway.
  const totalSpent = summary?.totalSpent ?? 0;
  const paidByMe = summary?.paidByMe ?? 0;
  const paidByHer = summary?.paidByHer ?? 0;
  const split = summary?.split ?? 0;

  // totalDates is only present if the /summary route has been updated to
  // include it. Treat it as optional so the page still works without it.
  const totalDates = summary?.totalDates;
  const hasCount = Number.isFinite(totalDates);
  const avgPerDate = hasCount && totalDates > 0 ? totalSpent / totalDates : 0;

  // Each payer's share of the grand total, as a percentage for the bar width.
  const pct = (amount) => (totalSpent > 0 ? (amount / totalSpent) * 100 : 0);

  const payers = [
    {
      key: "me",
      label: "My total",
      amount: paidByMe,
      bar: "bg-emerald-500",
      dot: "bg-emerald-500",
    },
    {
      key: "her",
      label: "Her total",
      amount: paidByHer,
      bar: "bg-rose-500",
      dot: "bg-rose-500",
    },
    {
      key: "split",
      label: "Split",
      amount: split,
      bar: "bg-amber-500",
      dot: "bg-amber-500",
    },
  ];

  function renderBody() {
    // Loading — skeletons shaped like the real layout.
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-2xl bg-stone-200/60" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 animate-pulse rounded-2xl bg-stone-200/60" />
            <div className="h-24 animate-pulse rounded-2xl bg-stone-200/60" />
          </div>
          <div className="h-52 animate-pulse rounded-2xl bg-stone-200/60" />
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

    // Empty — nothing to visualize yet.
    if (totalSpent === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <PieChart className="h-7 w-7 text-rose-500" strokeWidth={2} />
          </div>
          <h3 className="text-base font-semibold text-stone-800">
            No spending logged yet
          </h3>
          <p className="mt-1 max-w-xs text-sm text-stone-500">
            {hasCount && totalDates > 0
              ? `You've logged ${totalDates} ${totalDates === 1 ? "date" : "dates"}, but no expenses yet. Add some and your breakdown will appear here.`
              : "Log a date with expenses and your spending breakdown will show up here."}
          </p>
          <Link
            to="/add"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
          >
            <PlusCircle className="h-4 w-4" />
            Add a date
          </Link>
        </div>
      );
    }

    // Content
    return (
      <div className="space-y-4">
        {/* Hero — total spent */}
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-rose-100">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">Total spent</span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {peso.format(totalSpent)}
          </p>
          {hasCount && totalDates > 0 && (
            <p className="mt-1 text-sm text-rose-100">
              across {totalDates} {totalDates === 1 ? "date" : "dates"}
            </p>
          )}
        </div>

        {/* Secondary stats — only when the route reports a date count */}
        {hasCount && totalDates > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-stone-400">
                <CalendarDays className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Dates logged
                </span>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-stone-800">
                {totalDates}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-stone-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Avg / date
                </span>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-stone-800">
                {peso.format(avgPerDate)}
              </p>
            </div>
          </div>
        )}

        {/* Who paid what — percentage bars */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-stone-400" />
            <h3 className="text-sm font-semibold text-stone-700">
              Who paid what
            </h3>
          </div>

          <div className="space-y-4">
            {payers.map((p) => {
              const percent = pct(p.amount);
              return (
                <div key={p.key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 font-medium text-stone-700">
                      <span className={`h-2.5 w-2.5 rounded-full ${p.dot}`} />
                      {p.label}
                    </span>
                    <span className="tabular-nums text-stone-600">
                      {peso.format(p.amount)}
                      <span className="ml-1.5 text-stone-400">
                        {Math.round(percent)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={`h-full rounded-full ${p.bar} transition-[width] duration-700 ease-out`}
                      style={{ width: animate ? `${percent}%` : "0%" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-stone-800">
          Our spending
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          How the two of you split the bill.
        </p>
      </header>
      {renderBody()}
    </div>
  );
}
