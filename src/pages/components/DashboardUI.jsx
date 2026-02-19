import React from "react";
import { ArrowUpRight } from "lucide-react";
import { cx } from "./dashboard";

export function SubheaderBar({ children }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3">
        {children}
      </div>
    </div>
  );
}

export function TabButton({ active, icon: Icon, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow"
          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
      )}
    >
      <Icon
        className={cx("h-4 w-4", active ? "text-white" : "text-slate-600")}
      />
      {children}
    </button>
  );
}

const TONES = {
  blue: {
    card: "border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 bg-gradient-to-tl from-indigo-50 to-indigo-200/80 ring-indigo-300 hover:border-indigo-300",
    accent: "text-indigo-700",
    badge: "bg-indigo-600 text-white",
    icon: "bg-indigo-600/10 text-indigo-700 border-indigo-200",
    strip: "bg-indigo-600",
  },
  orange: {
    card: "border-rose-200 bg-orange-50/60 hover:bg-rose-50 bg-gradient-to-tl from-rose-50 to-rose-200/80 ring-rose-300 hover:border-rose-300",
    accent: "text-orange-700",
    badge: "bg-orange-600 text-white",
    icon: "bg-orange-600/10 text-orange-700 border-orange-200",
    strip: "bg-orange-600",
  },
  yellow: {
    card: "border-amber-200 bg-amber-50/60 hover:bg-amber-50 bg-gradient-to-tl from-amber-50 to-amber-200/80 ring-amber-300 hover:border-amber-300",
    accent: "text-amber-800",
    badge: "bg-amber-600 text-white",
    icon: "bg-amber-600/10 text-amber-800 border-amber-200",
    strip: "bg-amber-600",
  },
  green: {
    card: "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 bg-gradient-to-tl from-emerald-50 to-green-200 ring-emerald-300 hover:border-emerald-300",
    accent: "text-emerald-700",
    badge: "bg-emerald-600 text-white",
    icon: "bg-emerald-600/10 text-emerald-700 border-emerald-200",
    strip: "bg-emerald-600",
  },
  red: {
    card: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white",
    accent: "text-rose-700",
    badge: "bg-rose-600 text-white",
    icon: "bg-rose-600/10 text-rose-700 border-rose-200",
    strip: "bg-rose-600",
  },
  gray: {
    card: "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white",
    accent: "text-slate-800",
    badge: "bg-slate-700 text-white",
    icon: "bg-slate-600/10 text-slate-700 border-slate-200",
    strip: "bg-slate-700",
  },
};

export function PastelKpiTile({
  tone = "blue",
  title,
  big,
  subtitle,
  small,
  secondary,
  icon: Icon,
  footer,
}) {
  const t = TONES[tone] || TONES.blue;

  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-xl border p-4 shadow-md transition",
        "hover:-translate-y-1 hover:shadow-lg",
        t.card,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-600">{title}</div>
          <div
            className={cx("mt-2 text-3xl font-bold tracking-tight", t.accent)}
          >
            {big}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {subtitle}
          </div>
          {small ? (
            <div className="mt-1 text-xs text-slate-600">{small}</div>
          ) : null}
          {secondary ? (
            <div className="mt-2 text-xs font-semibold text-slate-700">
              {secondary}
            </div>
          ) : null}
        </div>

        <div className={cx("rounded-xl border p-2", t.icon)}>
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
      </div>

      <div className={cx("mt-4 h-1.5 w-full rounded-full bg-slate-100")}>
        <div className={cx("h-full w-2/3 rounded-full", t.strip)} />
      </div>

      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}

export function SectionCard({ children, className }) {
  return (
    <div
      className={cx(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FocusCard({ severity, title, recommendation, href, onReview }) {
  const sev = String(severity || "").toLowerCase();
  const tone =
    sev === "high"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : sev === "medium"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-slate-50 text-slate-900";

  const badge =
    sev === "high"
      ? "bg-rose-600 text-white"
      : sev === "medium"
        ? "bg-amber-600 text-white"
        : "bg-slate-700 text-white";

  return (
    <div className={cx("rounded-xl border p-3", tone)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cx(
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                badge,
              )}
            >
              {String(severity || "Low").toUpperCase()}
            </span>
            <div className="text-sm font-bold">{title}</div>
          </div>
          <div className="mt-1 text-xs opacity-90">{recommendation}</div>
        </div>

        <button
          onClick={onReview}
          className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
        >
          Review <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function StatusPill({ status }) {
  const s = String(status || "").toUpperCase();
  const tone =
    s.includes("APPROV") || s === "DONE" || s === "COMPLETED"
      ? "bg-emerald-100 text-emerald-800"
      : s.includes("REJECT")
        ? "bg-rose-100 text-rose-800"
        : s.includes("SUBMIT")
          ? "bg-indigo-100 text-indigo-800"
          : s.includes("PROGRESS") ||
              s.includes("OPEN") ||
              s.includes("PENDING")
            ? "bg-amber-100 text-amber-800"
            : "bg-slate-100 text-slate-700";

  return (
    <span
      className={cx("rounded-full px-2 py-0.5 text-[11px] font-bold", tone)}
    >
      {s || "UNKNOWN"}
    </span>
  );
}

export function ProgressBar({ segments = [], showLegend = true }) {
  const total = segments.reduce((a, s) => a + (Number(s.value) || 0), 0) || 1;

  const toneClass = (tone) => {
    if (tone === "green") return "bg-emerald-600";
    if (tone === "amber") return "bg-amber-600";
    if (tone === "indigo") return "bg-indigo-600";
    if (tone === "gray") return "bg-slate-300";
    return "bg-slate-600";
  };

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
        {segments.map((s) => (
          <div
            key={s.label}
            className={cx("h-full", toneClass(s.tone))}
            style={{
              width: `${Math.max(0, (Number(s.value) || 0) / total) * 100}%`,
            }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>

      {showLegend ? (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
          {segments.map((s) => (
            <span
              key={s.label}
              className="rounded-full bg-slate-100 px-2 py-0.5"
            >
              {s.label}: {s.value}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-sm font-semibold text-slate-600">
      {text}
    </div>
  );
}
