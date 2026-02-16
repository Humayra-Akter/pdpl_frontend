import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";

import logo from "../assets/logo.png";
function SidebarItem({
  to,
  icon: Icon,
  label,
  collapsed,
  exact = false,
  matchPrefix = false,
  pathname,
}) {
  const isActive = exact
    ? pathname === to
    : matchPrefix
      ? pathname === to || pathname.startsWith(to + "/")
      : pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      end={exact}
      title={collapsed ? label : undefined}
      className={() =>
        [
          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold",
          "transition-all duration-200",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-blue-50 text-blue-900 ring-1 ring-blue-100"
            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
        ].join(" ")
      }
    >
      {/* left active indicator */}
      <span
        className={[
          "absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full",
          "transition-all duration-200",
          isActive ? "bg-blue-600 opacity-100" : "bg-blue-600 opacity-0",
        ].join(" ")}
      />

      <Icon
        className={[
          "h-5 w-5",
          isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100",
        ].join(" ")}
      />

      {!collapsed ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const pageTitle = pathname.startsWith("/admin/dpia")
    ? "DPIA Assessment"
    : pathname.startsWith("/admin/gap")
      ? "PDPL Gap Assessment"
      : pathname.startsWith("/admin/ropa")
        ? "RoPA"
        : pathname.startsWith("/admin/incidents")
          ? "Incident & Breach Management"
          : pathname.startsWith("/admin/training")
            ? "Training"
            : pathname.startsWith("/admin/users")
              ? "User Management"
              : pathname.startsWith("/admin/vendor")
                ? "Policies & Procedures"
                : "Compliance Dashboard";

  // Sidebar collapsed state (persisted)
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pdpl.sidebarCollapsed");
    if (saved === "1") setCollapsed(true);
    if (saved === "0") setCollapsed(false);
  }, []);

  function toggleSidebar() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("pdpl.sidebarCollapsed", next ? "1" : "0");
      return next;
    });
  }

  // widths
  const sidebarW = collapsed ? "w-20" : "w-72";
  const mainPad = collapsed ? "lg:pl-20" : "lg:pl-72";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div
            className={[
              "fixed left-0 top-0 h-screen border-r border-slate-200 bg-white shadow-xl",
              sidebarW,
              "transition-all duration-200",
            ].join(" ")}
          >
            {/* Brand / top */}
            {/* Brand / top */}
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                {/* Left: Brand */}
                {!collapsed ? (
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">
                      PDPL Secure Portal
                    </div>

                    {/* Logo + Admin/DPO aligned */}
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={logo}
                        className="h-9 w-9 rounded-xl object-contain"
                        alt="PDPL Logo"
                      />
                      <div className="min-w-0">
                        <div
                          className="text-base font-semibold leading-tight"
                          style={{ color: "var(--pdpl-primary)" }}
                        >
                          Admin / DPO
                        </div>
                        <div className="text-xs font-semibold text-slate-500 leading-tight">
                          Compliance Console
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                    style={{ color: "var(--pdpl-primary)" }}
                    title="PDPL Secure Portal"
                  >
                    <span className="text-sm font-bold">PD</span>
                  </div>
                )}

                {/* Right: Toggle button (moved to top-right) */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className={[
                    "shrink-0 inline-flex items-center justify-center rounded-xl",
                    "border border-slate-200 bg-white",
                    "h-10 w-10",
                    "text-slate-700 hover:bg-slate-50",
                    "transition-all duration-200",
                  ].join(" ")}
                  title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? (
                    <ChevronRight className="h-5 w-5" />
                  ) : (
                    <ChevronLeft className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Menu */}
            <div className="h-[calc(100vh-96px)] overflow-y-auto p-3">
              <nav className="space-y-2">
                {!collapsed ? (
                  <div className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Overview
                  </div>
                ) : (
                  <div className="h-2" />
                )}
                <SidebarItem
                  to="/admin"
                  icon={LayoutDashboard}
                  label="Dashboard"
                  collapsed={collapsed}
                  exact
                  pathname={pathname}
                />

                {!collapsed ? (
                  <div className="px-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Assessments
                  </div>
                ) : (
                  <div className="h-2" />
                )}
                <SidebarItem
                  to="/admin/gap"
                  icon={ClipboardCheck}
                  label="PDPL Gap Assessment"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />
                <SidebarItem
                  to="/admin/dpia"
                  icon={FileText}
                  label="Data Privacy Impact Assessment"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />
                <SidebarItem
                  to="/admin/ropa"
                  icon={FileText}
                  label="Record of Processing Activities"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />

                {!collapsed ? (
                  <div className="px-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Operations
                  </div>
                ) : (
                  <div className="h-2" />
                )}
                <SidebarItem
                  to="/admin/incidents"
                  icon={ShieldAlert}
                  label="Incidents & Breach"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />
                <SidebarItem
                  to="/admin/vendor"
                  icon={BookOpen}
                  label="Policies & Procedures"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />
                <SidebarItem
                  to="/admin/training"
                  icon={GraduationCap}
                  label="Training"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />

                {!collapsed ? (
                  <div className="px-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Admin
                  </div>
                ) : (
                  <div className="h-2" />
                )}
                <SidebarItem
                  to="/admin/users"
                  icon={Users}
                  label="User Management"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />

                {/* Logout */}
                <div className="pt-2">
                  <button
                    onClick={logout}
                    className={[
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2",
                      "text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50",
                      collapsed ? "justify-center" : "",
                    ].join(" ")}
                    title={collapsed ? "Logout" : undefined}
                  >
                    <LogOut className="h-5 w-5" />
                    {!collapsed ? <span>Logout</span> : null}
                  </button>
                </div>

                <div className="h-4" />
              </nav>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className={["flex-1", mainPad].join(" ")}>
          <div className="px-6 py-6">
            {/* Top bar */}
            <header className="sticky top-0 z-10 mb-6 rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <Breadcrumbs />
                  <div
                    className="text-lg font-semibold"
                    style={{ color: "var(--pdpl-primary)" }}
                  >
                    {pageTitle}
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
