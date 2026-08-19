import { useState, useEffect } from "react";
import { Lock, Delete } from "lucide-react";

/**
 * PinLock — a lightweight gate that keeps the app behind a 4-digit PIN.
 *
 * ⚠️ This is "keep a curious friend out" protection, NOT real security.
 *    T
 */
const CORRECT_PIN = "0706";
const PIN_LENGTH = CORRECT_PIN.length;
const STORAGE_KEY = "isAuthenticated";

export default function PinLock({ children }) {
  // Read the stored flag with a lazy initializer so an already-unlocked user
  // never sees a flash of the lock screen on first render.
  const [authed, setAuthed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true",
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  // Verify automatically once a full-length PIN has been entered.
  useEffect(() => {
    if (pin.length < PIN_LENGTH) return;

    if (pin === CORRECT_PIN) {
      localStorage.setItem(STORAGE_KEY, "true");
      setAuthed(true);
    } else {
      setError(true);
      // Hold the shake + message briefly, then clear for another attempt.
      const t = setTimeout(() => {
        setPin("");
        setError(false);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [pin]);

  // Let desktop users type on a physical keyboard too. The handlers only use
  // functional state updates, so the empty dep array is safe (no stale state).
  useEffect(() => {
    function onKey(e) {
      if (e.key >= "0" && e.key <= "9") {
        setError(false);
        setPin((prev) => (prev.length >= PIN_LENGTH ? prev : prev + e.key));
      } else if (e.key === "Backspace") {
        setError(false);
        setPin((prev) => prev.slice(0, -1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Already unlocked → render the app untouched.
  if (authed) return children;

  function press(digit) {
    setError(false);
    setPin((prev) => (prev.length >= PIN_LENGTH ? prev : prev + digit));
  }
  function backspace() {
    setError(false);
    setPin((prev) => prev.slice(0, -1));
  }

  const keypadClass =
    "flex h-16 items-center justify-center rounded-2xl border border-stone-200 bg-white text-xl font-medium text-stone-800 shadow-sm transition active:scale-95 active:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 py-10">
      <div className="w-full max-w-xs">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
            <Lock className="h-6 w-6 text-rose-600" strokeWidth={2} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-stone-800">
            Enter your PIN
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            This little space is just for the two of you.
          </p>
        </div>

        {/* PIN dots */}
        <div
          className={`mt-8 flex items-center justify-center gap-4 ${error ? "pin-shake" : ""}`}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <span
                key={i}
                className={`h-3.5 w-3.5 rounded-full border transition-colors ${
                  error
                    ? "border-rose-400 bg-rose-400"
                    : filled
                      ? "border-rose-500 bg-rose-500"
                      : "border-stone-300 bg-transparent"
                }`}
              />
            );
          })}
        </div>

        {/* Error message — fixed height so the keypad never jumps */}
        <p className="mt-4 h-5 text-center text-sm text-rose-600">
          {error ? "Incorrect PIN. Try again." : ""}
        </p>

        {/* Number pad */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className={keypadClass}
            >
              {k}
            </button>
          ))}

          {/* Empty cell keeps the 0 centered under the pad */}
          <span aria-hidden="true" />

          <button
            type="button"
            onClick={() => press("0")}
            className={keypadClass}
          >
            0
          </button>

          <button
            type="button"
            onClick={backspace}
            aria-label="Delete last digit"
            className="flex h-16 items-center justify-center rounded-2xl text-stone-500 transition active:scale-95 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Shake animation kept local so no tailwind.config.js edit is needed. */}
      <style>{`
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .pin-shake { animation: pin-shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
