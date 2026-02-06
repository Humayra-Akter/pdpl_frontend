import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  ShieldAlert,
  Users,
  BookOpen,
  GraduationCap,
  LogOut,
} from "lucide-react";

function Item({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
          "transition-all duration-200",
          isActive
            ? "bg-blue-50 text-blue-800 ring-1 ring-blue-100"
            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
        ].join(" ")
      }
    >
      {/* left active indicator */}
      <span
        className={[
          "absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full",
          "transition-all duration-200",
          "bg-blue-600",
          "opacity-0 group-[.active]:opacity-100",
        ].join(" ")}
      />
      <Icon className="h-4 w-4 opacity-80 group-hover:opacity-100" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar (fixed left on large screens) */}
        <aside className="hidden lg:block">
          <div className="fixed left-0 top-0 h-screen w-72 border-r border-slate-200 bg-white">
            {/* Brand area */}
            <div className="border-b border-slate-200 p-5">
              <div className="text-xs text-slate-500">PDPL Secure Portal</div>
              <div
                className="mt-1 text-base font-semibold"
                style={{ color: "var(--pdpl-primary)" }}
              >
                Admin / DPO
              </div>
            </div>

            {/* Scrollable menu */}
            <div className="h-[calc(100vh-76px)] overflow-y-auto p-3">
              <nav className="space-y-2">
                <div className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Overview
                </div>
                <Item to="/admin" icon={LayoutDashboard} label="Dashboard" />

                <div className="px-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Assessments
                </div>
                <Item
                  to="/admin/gap"
                  icon={ClipboardCheck}
                  label="PDPL Gap Assessment"
                />
                <Item
                  to="/admin/dpia"
                  icon={FileText}
                  label="Data Privacy Impact Assessment (DPIA)"
                />
                <Item
                  to="/admin/ropa"
                  icon={FileText}
                  label="Record of Processing Activities (RoPA)"
                />

                <div className="px-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Operations
                </div>
                <Item
                  to="/admin/incidents"
                  icon={ShieldAlert}
                  label="Incidents & Breach"
                />
                <Item
                  to="/admin/policies"
                  icon={BookOpen}
                  label="Policies & Procedures"
                />
                <Item
                  to="/admin/training"
                  icon={GraduationCap}
                  label="Training"
                />

                <div className="px-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Admin
                </div>
                <Item to="/admin/users" icon={Users} label="User Management" />

                <button
                  onClick={logout}
                  className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>

                {/* spacer */}
                <div className="h-4" />
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content (push right so it doesn't go under fixed sidebar) */}
        <main className="flex-1 lg:pl-72">
          <div className="px-6 py-6">
            {/* Top bar (sticky inside main) */}
            <header className="sticky top-0 z-10 mb-6 rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">
                    Last updated: just now
                  </div>
                  <div
                    className="text-lg font-semibold"
                    style={{ color: "var(--pdpl-primary)" }}
                  >
                    Compliance Dashboard
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {user?.fullName}
                    </div>
                    <div className="text-xs text-slate-500">{user?.email}</div>
                  </div>
                </div>
              </div>
            </header>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
