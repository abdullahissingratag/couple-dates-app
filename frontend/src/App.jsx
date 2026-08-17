import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AddDate from "./pages/AddDate";
import EditDate from "./pages/EditDate";
import Stats from "./pages/Stats";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout renders the shared chrome (header + bottom nav) and an
            <Outlet /> where the matched child route appears. */}
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="add" element={<AddDate />} />
          {/* Reached from the Dashboard's edit button, not a nav tab. */}
          <Route path="edit/:id" element={<EditDate />} />
          <Route path="stats" element={<Stats />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
