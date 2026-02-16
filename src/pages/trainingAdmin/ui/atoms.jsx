import { cn } from "../utils";
import { X, ChevronRight, CheckCircle2 } from "lucide-react";

/* ---------------- UI atoms ---------------- */

function Card({ children, className }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 text-xs font-semibold text-slate-500">
            {subtitle}
          </div>
        ) : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

function KpiCard({ title, value, hint, tone, icon: Icon }) {
  const tones = {
    indigo: {
      wrap: "bg-indigo-50 ring-indigo-200",
      title: "text-indigo-900",
      hint: "text-indigo-900/70",
      value: "text-indigo-950",
      iconWrap: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    },
    amber: {
      wrap: "bg-amber-50 ring-amber-200",
      title: "text-amber-900",
      hint: "text-amber-900/70",
      value: "text-amber-950",
      iconWrap: "bg-amber-100 text-amber-700 ring-amber-200",
    },
    emerald: {
      wrap: "bg-emerald-50 ring-emerald-200",
      title: "text-emerald-900",
      hint: "text-emerald-900/70",
      value: "text-emerald-950",
      iconWrap: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    },
    rose: {
      wrap: "bg-rose-50 ring-rose-200",
      title: "text-rose-900",
      hint: "text-rose-900/70",
      value: "text-rose-950",
      iconWrap: "bg-rose-100 text-rose-700 ring-rose-200",
    },
    slate: {
      wrap: "bg-slate-50 ring-slate-200",
      title: "text-slate-900",
      hint: "text-slate-600",
      value: "text-slate-950",
      iconWrap: "bg-white text-slate-700 ring-slate-200",
    },
  };

  const t = tones[tone] || tones.indigo;

  return (
    <div className={cn("rounded-3xl ring-1 p-4", t.wrap)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("text-xs font-bold", t.title)}>{title}</div>
          <div className={cn("mt-1 text-3xl font-bold", t.value)}>{value}</div>
          <div className={cn("mt-1 text-xs font-semibold", t.hint)}>{hint}</div>
        </div>
        <div
          className={cn(
            "h-11 w-11 rounded-2xl grid place-items-center ring-1",
            t.iconWrap,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-700">{label}</div>
        {hint ? (
          <div className="text-[11px] font-semibold text-slate-500">{hint}</div>
        ) : null}
      </div>
      <div className="mt-1">{children}</div>
      {error ? (
        <div className="mt-1 text-xs font-semibold text-rose-600">{error}</div>
      ) : null}
    </div>
  );
}

function Tabs({ value, onChange, tabs }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = value === t.key;

        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition",
              active
                ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
            )}
            type="button"
          >
            {t.icon ? <t.icon className="h-4 w-4" /> : null}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function Drawer({ open, title, subtitle, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-lg font-bold text-slate-900">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {subtitle}
              </div>
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
            type="button"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-[calc(100%-140px)] overflow-auto p-5">{children}</div>
        <div className="border-t border-slate-200 px-5 py-4">{footer}</div>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  body,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="text-lg font-bold text-slate-900">{title}</div>
        <div className="mt-2 text-sm font-semibold text-slate-600">{body}</div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- components used in panels ---------------- */

function ActionButton({ icon: Icon, title, desc, tone, onClick }) {
  const tones = {
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    amber: "bg-amber-600 hover:bg-amber-700",
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    slate: "bg-slate-800 hover:bg-slate-900",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl px-4 py-3 text-left text-white shadow-sm transition",
        tones[tone] || tones.indigo,
      )}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white/15 grid place-items-center ring-1 ring-white/25">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{title}</div>
          <div className="mt-1 text-xs font-semibold text-white/85">{desc}</div>
        </div>

        <ChevronRight className="h-5 w-5 opacity-80" />
      </div>
    </button>
  );
}

function RuleRow({ icon: Icon, title, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-2xl bg-white grid place-items-center ring-1 ring-slate-200">
          <Icon className="h-4 w-4 text-slate-700" />
        </div>

        <div>
          <div className="text-xs font-bold text-slate-900">{title}</div>
          <div className="mt-0.5 text-xs font-semibold text-slate-600">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const map = {
    emerald: "bg-emerald-50 ring-emerald-200 text-emerald-900",
    indigo: "bg-indigo-50 ring-indigo-200 text-indigo-900",
    rose: "bg-rose-50 ring-rose-200 text-rose-900",
  };

  return (
    <div className={cn("rounded-3xl p-3 ring-1", map[tone] || map.indigo)}>
      <div className="text-xs font-bold">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function ProofItem({ label }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      <div className="text-xs font-bold text-slate-800">{label}</div>
    </div>
  );
}

export {
  Card,
  SectionTitle,
  KpiCard,
  Field,
  Tabs,
  Drawer,
  ConfirmModal,
  ActionButton,
  RuleRow,
  MiniStat,
  ProofItem,
};
