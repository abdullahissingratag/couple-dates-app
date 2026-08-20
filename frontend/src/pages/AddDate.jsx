import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DateForm from "../components/DateForm";

// Backend origin comes from the VITE_API_URL env var (set in .env locally and
// in the Vercel dashboard for production). Falls back to the local server so
// `npm run dev` works with no .env present.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api/dates`;

export default function AddDate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(payload) {
    setError(null);
    setSubmitting(true);
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
      <header className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-stone-800">
          Add a date
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Capture the details while they're still fresh.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DateForm onSubmit={handleSubmit} isSubmitting={submitting} />
    </div>
  );
}
