// src/layouts/UserLayout.jsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, ChevronRight, User2 } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function TopNavItem({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "rounded-xl px-5 py-2 text-sm font-semibold transition",
          isActive
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700",
        )
      }
    >
      {label}
    </NavLink>
  );
}

export default function UserLayout() {
  const { user } = useAuth() || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm">
                PD
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-slate-800">
                  PDPL Portal
                </div>
                <div className="text-sm text-slate-600">
                  Your personal data, your rights
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="hidden items-center gap-2 md:flex">
              <TopNavItem to="/user" label="Home" end />
              <TopNavItem to="/user/cases" label="My Requests" />
              <TopNavItem to="/user/training" label="Privacy Training" />
              <TopNavItem to="/user/profile" label="Profile" />
            </nav>

            {/* Right */}
            <div className="flex items-center gap-2">
              <button className="rounded-xl shadow-sm border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 hover:shadow-md">
                <Bell className="h-5 w-5 text-indigo-700" />
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 hover:shadow-sm">
                <User2 className="h-5 w-5 text-slate-600" />
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800">
                    {user?.fullName || user?.name || "User"}
                  </div>
                  <div className="text-sm text-slate-600">
                    {user?.role || "USER"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        <Outlet />
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 text-sm text-slate-600">
          © {new Date().getFullYear()} PDPL • Privacy & Data Protection
        </div>
      </footer>
    </div>
  );
}
