import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";

// Lightweight placeholders so the "Add Date" and "Stats" tabs don't lead to
// blank screens. Swap these out for real pages as you build them.
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <h2 className="text-base font-semibold text-stone-800">{title}</h2>
      <p className="mt-1 text-sm text-stone-500">Coming soon.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout renders the shared chrome (header + bottom nav) and an
            <Outlet /> where the matched child route appears. */}
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="add" element={<ComingSoon title="Add Date" />} />
          <Route path="stats" element={<ComingSoon title="Stats" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
