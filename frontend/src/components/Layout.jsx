import { NavLink, Outlet } from "react-router-dom";
import { Home, PlusCircle, PieChart } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/add", label: "Add Date", icon: PlusCircle, end: false },
  { to: "/stats", label: "Stats", icon: PieChart, end: false },
];

export default function Layout() {
  return (
    <div className="min-h-screen">
      {/* Top header */}
      <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-center px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-stone-800">
            Our Dates
          </h1>
        </div>
      </header>

      {/* Page content — bottom padding keeps content clear of the nav bar */}
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">
        <Outlet />
      </main>

      {/* Sticky bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-rose-600"
                    : "text-stone-400 hover:text-stone-600",
                ].join(" ")
              }
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
