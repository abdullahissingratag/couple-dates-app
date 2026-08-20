import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import DateForm from "../components/DateForm";

// Backend origin comes from the VITE_API_URL env var (set in .env locally and
// in the Vercel dashboard for production). Falls back to the local server so
// `npm run dev` works with no .env present.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api/dates`;

export default function EditDate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the date to edit and pre-fill the form.
  useEffect(() => {
    let ignore = false;

    async function fetchDate() {
      try {
        const { data } = await axios.get(`${API_URL}/${id}`);
        if (!ignore) setInitialData(data);
      } catch (err) {
        if (!ignore) {
          setLoadError(
            err.response?.status === 404
              ? "That date couldn't be found — it may have been deleted."
              : "Couldn't load this date. Make sure the server is running on port 5000.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchDate();
    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleSubmit(payload) {
    setError(null);
    setSubmitting(true);
    try {
      await axios.put(`${API_URL}/${id}`, payload);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Couldn't save your changes. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-stone-800">
          Edit date
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Update the details of this outing.
        </p>
      </header>

      {/* Loading — field-shaped skeletons */}
      {loading && (
        <div className="space-y-5">
          <div className="h-11 animate-pulse rounded-xl bg-stone-200/60" />
          <div className="h-11 animate-pulse rounded-xl bg-stone-200/60" />
          <div className="h-11 animate-pulse rounded-xl bg-stone-200/60" />
          <div className="h-24 animate-pulse rounded-xl bg-stone-200/60" />
          <div className="h-12 animate-pulse rounded-xl bg-stone-200/60" />
        </div>
      )}

      {/* Couldn't load the date */}
      {!loading && loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{loadError}</p>
          <Link
            to="/"
            className="mt-2 inline-block font-medium text-rose-700 underline"
          >
            Back to all dates
          </Link>
        </div>
      )}

      {/* Loaded — hand the data to the shared form */}
      {!loading && !loadError && initialData && (
        <>
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          <DateForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
          />
        </>
      )}
    </div>
  );
}
