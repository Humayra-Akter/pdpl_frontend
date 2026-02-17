import { useEffect, useMemo, useState } from "react";
import {
  FileDown,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  getGapSummary,
  listGapAssessments,
  createGapAssessment,
  updateGapAssessment,
} from "../lib/gap";

/** --- UI helpers --- */
function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Card({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white ring-1 ring-slate-200 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function IndigoButton({ className = "", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
        "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition",
        className,
      )}
      {...props}
    />
  );
}

function OutlineButton({ className = "", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition",
        className,
      )}
      {...props}
    />
  );
}

function Badge({ tone = "neutral", children }) {
  const map = {
    neutral: "bg-slate-100 text-slate-800 ring-slate-200",
    warning: "bg-amber-100 text-amber-900 ring-amber-200",
    accent: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    danger: "bg-rose-100 text-rose-900 ring-rose-200",
    primary: "bg-indigo-100 text-indigo-900 ring-indigo-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "w-28",
        "rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        map[tone] || map.neutral,
      )}
    >
      {children}
    </span>
  );
}

function statusTone(s) {
  if (s === "COMPLETED") return "accent";
  if (s === "IN_PROGRESS") return "warning";
  if (s === "DRAFT") return "neutral";
  return "neutral";
}

function clamp(n, a, b) {
  const x = Number(n);
  if (Number.isNaN(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function ProgressPill({ progress }) {
  const p = Math.max(0, Math.min(100, Number(progress) || 0));
  const bar =
    p >= 100
      ? "bg-emerald-600"
      : p >= 75
        ? "bg-indigo-600"
        : p >= 50
          ? "bg-amber-600"
          : p >= 25
            ? "bg-rose-600"
            : "bg-slate-300";

  return (
    <div className="min-w-[170px]">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Progress</span>
        <span className="font-semibold text-slate-800">{p}%</span>
      </div>
      <div className="mt-1 h-2.5 w-full rounded-full bg-slate-100">
        <div
          className={cn("h-2.5 rounded-full", bar)}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

function Ring({ value = 0, tone = "indigo" }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const stroke = 10;
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;

  const colors = {
    indigo: {
      track: "stroke-indigo-200",
      bar: "stroke-indigo-600",
      text: "fill-indigo-950",
    },
    amber: {
      track: "stroke-amber-200",
      bar: "stroke-amber-600",
      text: "fill-amber-950",
    },
    rose: {
      track: "stroke-rose-200",
      bar: "stroke-rose-600",
      text: "fill-rose-950",
    },
    emerald: {
      track: "stroke-emerald-200",
      bar: "stroke-emerald-600",
      text: "fill-emerald-950",
    },
  };

  const t = colors[tone] || colors.indigo;

  return (
    <svg width="78" height="78" viewBox="0 0 88 88">
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        strokeWidth={stroke}
        className={t.track}
      />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className={t.bar}
        transform="rotate(-90 44 44)"
      />
      <text
        x="44"
        y="48"
        textAnchor="middle"
        className={cn("font-extrabold", t.text)}
        fontSize="16"
      >
        {v}%
      </text>
    </svg>
  );
}

/* ------------------ KPI LOOK (tone-aware) ------------------ */
function DeltaChip({ value, label = "30d", tone = "indigo" }) {
  if (typeof value !== "number") return null;

  const isPos = value > 0;
  const isNeg = value < 0;

  const neutral = "bg-white/70 ring-black/5";
  const good = "bg-emerald-50 text-emerald-800 ring-emerald-200";
  const bad = "bg-rose-50 text-rose-800 ring-rose-200";
  const same = "bg-slate-50 text-slate-700 ring-slate-200";

  const base =
    "inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-extrabold ring-1 shadow-sm";
  const cls = isPos ? good : isNeg ? bad : same;

  const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : null;

  // tiny tone accent on hover
  const hoverTone =
    tone === "rose"
      ? "hover:ring-rose-200"
      : tone === "amber"
        ? "hover:ring-amber-200"
        : tone === "emerald"
          ? "hover:ring-emerald-200"
          : "hover:ring-indigo-200";

  return (
    <span
      className={cn(base, cls, neutral, "transition", hoverTone)}
      title={`${label} change`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {isPos ? "+" : ""}
      {value}
      <span className="font-semibold opacity-70">{label}</span>
    </span>
  );
}

function ToneProgress({ value = 0, tone = "indigo" }) {
  const pct = clamp(value, 0, 100);

  const map = {
    indigo: {
      wrap: "bg-indigo-50/70 ring-indigo-200",
      bar: "bg-indigo-600",
      text: "text-indigo-900",
      sub: "text-indigo-900/70",
    },
    amber: {
      wrap: "bg-amber-50/70 ring-amber-200",
      bar: "bg-amber-600",
      text: "text-amber-900",
      sub: "text-amber-900/70",
    },
    emerald: {
      wrap: "bg-emerald-50/70 ring-emerald-200",
      bar: "bg-emerald-600",
      text: "text-emerald-900",
      sub: "text-emerald-900/70",
    },
    rose: {
      wrap: "bg-rose-50/70 ring-rose-200",
      bar: "bg-rose-600",
      text: "text-rose-900",
      sub: "text-rose-900/70",
    },
  };
}

function BetterKpiTile({
  title,
  subtitle,
  valueText,
  ringValue,
  ringTone = "indigo",
  icon: Icon,
  delta,
  progressValue,
}) {
  const toneMap = {
    indigo: {
      ring: "ring-indigo-200",
      bg: "bg-indigo-50/60",
      glow: "from-indigo-500/12 to-emerald-500/10",
      title: "text-indigo-700",
      subtitle: "text-indigo-900/75",
      value: "text-indigo-700",
      chip: "bg-indigo-100 text-indigo-900 ring-indigo-200",
      iconStroke: "text-indigo-600",
      hoverRing: "hover:ring-indigo-300",
    },
    amber: {
      ring: "ring-amber-200",
      bg: "bg-amber-50/60",
      glow: "from-amber-500/12 to-indigo-500/10",
      title: "text-amber-700",
      subtitle: "text-amber-900/75",
      value: "text-amber-700",
      chip: "bg-amber-100 text-amber-900 ring-amber-200",
      iconStroke: "text-amber-600",
      hoverRing: "hover:ring-amber-300",
    },
    emerald: {
      ring: "ring-emerald-200",
      bg: "bg-emerald-50/60",
      glow: "from-emerald-500/12 to-sky-500/10",
      title: "text-emerald-700",
      subtitle: "text-emerald-900/75",
      value: "text-emerald-700",
      chip: "bg-emerald-100 text-emerald-900 ring-emerald-200",
      iconStroke: "text-emerald-600",
      hoverRing: "hover:ring-emerald-300",
    },
    rose: {
      ring: "ring-rose-200",
      bg: "bg-rose-50/60",
      glow: "from-rose-500/12 to-amber-500/10",
      title: "text-rose-700",
      subtitle: "text-rose-900/75",
      value: "text-rose-700",
      chip: "bg-rose-100 text-rose-900 ring-rose-200",
      iconStroke: "text-rose-600",
      hoverRing: "hover:ring-rose-300",
    },
  };

  const t = toneMap[ringTone] || toneMap.indigo;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl p-5 ring-1 shadow-md transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg",
        t.ring,
        t.hoverRing,
        t.bg,
      )}
    >
      {/* soft glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          t.glow,
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className={cn("text-[12px] font-bold tracking-wide", t.title)}>
              {title}
            </div>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1",
                t.chip,
              )}
            >
              KPI
            </span>
          </div>

          <div className={cn("mt-1 text-sm", t.subtitle)}>{subtitle}</div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className={cn("text-3xl font-bold", t.value)}>{valueText}</div>
            <DeltaChip value={delta} label="30d" tone={ringTone} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          {Icon ? (
            <div className={cn("group-hover:scale-[1.03]", t.iconWrap)}>
              <Icon className={cn("h-5 w-5", t.iconStroke)} />
            </div>
          ) : null}

          <div>
            <Ring value={ringValue} tone={ringTone} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ existing bits kept ------------------ */
function CreateModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setScope("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              New Gap Assessment
            </div>
            <div className="mt-1 text-sm font-medium text-slate-600">
              Create an assessment and start tracking progress.
            </div>
          </div>

          <button
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-800">Title</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Vendor risk controls"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800">
              Scope (optional)
            </label>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="e.g., Supplier due diligence, DPAs, security questionnaires..."
              rows={3}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <OutlineButton onClick={onClose} type="button">
            Cancel
          </OutlineButton>
          <IndigoButton
            onClick={() => onCreate({ title, scope })}
            disabled={!title.trim()}
            type="button"
          >
            Create
          </IndigoButton>
        </div>
      </div>
    </div>
  );
}

function StatusDropdown({ value, onChange }) {
  return (
    <select
      className="w-32 rounded-xl border border-slate-200 bg-white px-1 py-2 text-sm text-slate-800"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Actions"
    >
      <option value="DRAFT">DRAFT</option>
      <option value="IN_PROGRESS">IN_PROGRESS</option>
      <option value="COMPLETED">COMPLETED</option>
    </select>
  );
}

function ProgressDropdown({ value, onChange, disabled }) {
  return (
    <select
      className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50"
      value={String(value ?? 25)}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      title="Progress"
    >
      <option value={25}>25%</option>
      <option value={50}>50%</option>
      <option value={75}>75%</option>
      <option value={100}>100%</option>
    </select>
  );
}

/* ------------------ KPI deltas from createdAt ------------------ */
function computeDeltaByCreatedAt(items, pick = () => true, days = 30) {
  const now = new Date();
  const curFrom = new Date(now);
  curFrom.setDate(curFrom.getDate() - days);
  const prevFrom = new Date(now);
  prevFrom.setDate(prevFrom.getDate() - days * 2);

  const inRange = (x, from, to) => {
    const dt = new Date(x.createdAt);
    return Number.isFinite(dt.getTime()) && dt >= from && dt <= to;
  };

  const cur = (items || []).filter(
    (x) => pick(x) && inRange(x, curFrom, now),
  ).length;
  const prev = (items || []).filter(
    (x) => pick(x) && inRange(x, prevFrom, curFrom),
  ).length;
  return cur - prev;
}

/** --- Page --- */
export default function GapAssessment() {
  const [summary, setSummary] = useState(null);
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [createOpen, setCreateOpen] = useState(false);

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const [s, l] = await Promise.all([
        getGapSummary(),
        listGapAssessments({ page, pageSize, status: statusFilter }),
      ]);
      setSummary(s);
      setList(l);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const items = list?.items || [];

  const term = q.trim().toLowerCase();
  const filtered = !term
    ? items
    : items.filter((x) => {
        return (
          (x.title || "").toLowerCase().includes(term) ||
          (x.scope || "").toLowerCase().includes(term) ||
          (x.createdBy?.fullName || "").toLowerCase().includes(term)
        );
      });

  async function handleCreate(payload) {
    try {
      await createGapAssessment(payload);
      setCreateOpen(false);
      setPage(1);
      await loadAll();
    } catch (e) {
      alert(e.message || "Create failed");
    }
  }

  async function setRowStatus(row, newStatus) {
    const currentProgress = Number(row.progress) || 0;

    let nextProgress = currentProgress;
    if (newStatus === "COMPLETED") nextProgress = 100;
    if (newStatus === "DRAFT") nextProgress = 0;
    if (newStatus === "IN_PROGRESS")
      nextProgress = currentProgress > 0 ? currentProgress : 25;

    try {
      await updateGapAssessment(row.id, {
        status: newStatus,
        progress: nextProgress,
      });
      await loadAll();
    } catch (e) {
      alert(e.message || "Update failed");
    }
  }

  async function setRowProgress(row, nextProgress) {
    const nextStatus = nextProgress >= 100 ? "COMPLETED" : "IN_PROGRESS";
    try {
      await updateGapAssessment(row.id, {
        progress: nextProgress,
        status: nextStatus,
      });
      await loadAll();
    } catch (e) {
      alert(e.message || "Update failed");
    }
  }

  const k = summary?.kpis || {};
  const total = Number(k.total || 0);
  const completed = Number(k.completed || 0);
  const inProgress = Number(k.inProgress || 0);
  const critical = Number(k.critical || 0);

  const avgProgress = items.length
    ? Math.round(
        items.reduce((a, x) => a + (Number(x.progress) || 0), 0) / items.length,
      )
    : 0;

  const deltas = useMemo(() => {
    return {
      overall: computeDeltaByCreatedAt(items, () => true, 30),
      comp: computeDeltaByCreatedAt(items, (x) => x.status === "COMPLETED", 30),
      prog: computeDeltaByCreatedAt(
        items,
        (x) => x.status === "IN_PROGRESS",
        30,
      ),
      crit: computeDeltaByCreatedAt(
        items,
        (x) => Boolean(x.critical) || x.priority === "CRITICAL",
        30,
      ),
    };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-green-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-slate-500">GAP Assessments</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              PDPL Gap Assessment
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Track gaps, progress, and evidence in one place.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <OutlineButton type="button">
              <FileDown className="h-4 w-4" /> Export
            </OutlineButton>

            <IndigoButton onClick={() => setCreateOpen(true)} type="button">
              <Plus className="h-4 w-4" /> New Assessment
            </IndigoButton>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-500 to-green-600" />
      </div>

      {/* Error */}
      {err ? (
        <div className="rounded-xl bg-white p-5 ring-1 ring-red-200">
          <div className="font-semibold text-red-700">Page failed</div>
          <div className="mt-1 text-sm text-slate-600">{err}</div>
          <IndigoButton className="mt-3" onClick={loadAll} type="button">
            Retry
          </IndigoButton>
        </div>
      ) : null}

      {/* KPI tiles (tone-aware: indigo/amber/emerald/rose) */}
      <div className="grid gap-4 xl:grid-cols-4">
        <BetterKpiTile
          title="Overall Score"
          subtitle="Compliance readiness"
          valueText={`${avgProgress}%`}
          ringValue={avgProgress}
          ringTone="indigo"
          icon={ClipboardList}
          delta={deltas.overall}
        />

        <BetterKpiTile
          title="In Progress"
          subtitle="Ongoing work items"
          valueText={`${inProgress}`}
          ringValue={total ? Math.round((inProgress / total) * 100) : 0}
          ringTone="amber"
          icon={RefreshCw}
          delta={deltas.prog}
        />

        <BetterKpiTile
          title="Completed"
          subtitle="Delivered"
          valueText={`${completed}`}
          ringValue={total ? Math.round((completed / total) * 100) : 0}
          ringTone="emerald"
          icon={CheckCircle2}
          delta={deltas.comp}
        />

        <BetterKpiTile
          title="Critical"
          subtitle="Prioritize these first"
          valueText={`${critical}`}
          ringValue={total ? Math.round((critical / total) * 100) : 0}
          ringTone="rose"
          icon={AlertTriangle}
          delta={deltas.crit}
        />
      </div>

      {/* Controls */}
      <Card className="p-4 shadow-md bg-slate-50/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="w-72 max-w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm"
                placeholder="Search title, scope, creator..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter className="h-4 w-4" />
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="">All statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <div className="text-sm font-semibold text-slate-600">
            {loading
              ? "Loading..."
              : `Showing ${filtered.length} of ${list?.total ?? 0}`}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[1020px] w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="text-center px-4 py-3 font-bold w-14">#</th>
                <th className="text-center px-4 py-3 font-bold">Title</th>
                <th className="text-center px-4 py-3 font-bold">Status</th>
                <th className="text-center px-4 py-3 font-bold">Progress</th>
                <th className="text-center px-4 py-3 font-bold">Created By</th>
                <th className="text-center px-4 py-3 font-bold">Created</th>
                <th className="text-center px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((x, idx) => {
                const zebra = idx % 2 === 0 ? "bg-white" : "bg-indigo-50/35";
                const canPickProgress = x.status === "IN_PROGRESS";

                return (
                  <tr
                    key={x.id}
                    className={cn(
                      "border-t border-slate-100",
                      zebra,
                      "hover:bg-indigo-50/60 transition-colors",
                    )}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-600">
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {x.title}
                      </div>
                      {x.scope ? (
                        <div className="mt-1 text-xs text-slate-500 line-clamp-1">
                          {x.scope}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={statusTone(x.status)}>{x.status}</Badge>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProgressPill progress={x.progress} />
                        <ProgressDropdown
                          value={x.progress ?? 25}
                          onChange={(p) => setRowProgress(x, p)}
                          disabled={!canPickProgress}
                        />
                      </div>
                      {!canPickProgress ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Set status to IN_PROGRESS to edit progress
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-900 font-semibold">
                        {x.createdBy?.fullName || "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {x.createdBy?.email || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {x.createdAt
                        ? new Date(x.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <StatusDropdown
                          value={x.status}
                          onChange={(v) => setRowStatus(x, v)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No assessments found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-white">
          <div className="text-sm font-semibold text-slate-600">
            Page {list?.page ?? page} • {list?.pageSize ?? pageSize} per page
          </div>
          <div className="flex items-center gap-2">
            <OutlineButton
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={(list?.page ?? page) <= 1}
            >
              Prev
            </OutlineButton>
            <OutlineButton
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={list && list.page * list.pageSize >= list.total}
            >
              Next
            </OutlineButton>
          </div>
        </div>
      </Card>

      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
