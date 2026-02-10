import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { createRopa, listRopa } from "../lib/admin";

function fmtDate(v) {
  try {
    if (!v) return "—";
    return new Date(v).toLocaleString();
  } catch {
    return "—";
  }
}

function statusMeta(status = "DRAFT") {
  const map = {
    DRAFT: {
      label: "Draft",
      pill: "bg-slate-100 text-slate-800 ring-slate-200",
      dot: "bg-slate-400",
    },
    IN_PROGRESS: {
      label: "In progress",
      pill: "bg-amber-100 text-amber-900 ring-amber-200",
      dot: "bg-amber-500",
    },
    SUBMITTED: {
      label: "Submitted",
      pill: "bg-indigo-100 text-indigo-900 ring-indigo-200",
      dot: "bg-indigo-500",
    },
    APPROVED: {
      label: "Approved",
      pill: "bg-green-100 text-green-900 ring-green-200",
      dot: "bg-green-500",
    },
    REJECTED: {
      label: "Rejected",
      pill: "bg-rose-100 text-rose-900 ring-rose-200",
      dot: "bg-rose-500",
    },
  };
  return map[status] || map.DRAFT;
}

function clamp(n, a, b) {
  const x = Number(n);
  if (Number.isNaN(x)) return a;
  return Math.max(a, Math.min(b, x));
}

// ---------- Modern donut (no <style/>) ----------
function Donut({ percent = 0, tone = "indigo" }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));

  const colors = {
    indigo: {
      ring: "#4f46e5", // indigo-600
      track: "#c7d2fe", // indigo-200 (much stronger)
      glow: "rgba(79,70,229,0.35)",
    },
    amber: {
      ring: "#f59e0b", // amber-500
      track: "#fde68a", // amber-200
      glow: "rgba(245,158,11,0.35)",
    },
    green: {
      ring: "#059669", // green-600
      track: "#a7f3d0", // green-200
      glow: "rgba(5,150,105,0.35)",
    },
    rose: {
      ring: "#e11d48", // rose-600
      track: "#fecdd3", // rose-200
      glow: "rgba(225,29,72,0.35)",
    },
  };

  const c = colors[tone] || colors.indigo;

  return (
    <div className="relative h-16 w-16">
      {/* Track */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: c.track,
        }}
      />

      {/* Progress ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${c.ring} ${p}%, transparent 0)`,
          boxShadow: `0 0 10px ${c.glow}`,
        }}
      />

      {/* Inner cutout (smaller than before) */}
      <div className="absolute inset-[12px] rounded-full bg-white ring-1 ring-slate-200" />

      {/* Percentage */}
      <div className="absolute inset-0 grid place-items-center text-xs font-bold text-slate-800">
        {p}%
      </div>
    </div>
  );
}

function toneTextClass(tone) {
  const map = {
    indigo: "text-indigo-900",
    amber: "text-amber-900",
    green: "text-green-900",
    rose: "text-rose-900",
  };
  return map[tone] || "text-slate-900";
}

function toneSubTextClass(tone) {
  const map = {
    indigo: "text-indigo-900/80",
    amber: "text-amber-900/80",
    green: "text-green-900/80",
    rose: "text-rose-900/80",
  };
  return map[tone] || "text-slate-600";
}

function toneBgRingClass(tone) {
  const map = {
    indigo: "bg-indigo-100/50 ring-indigo-100 hover:ring-indigo-200",
    amber: "bg-amber-100/50 ring-amber-100 hover:ring-amber-200",
    green: "bg-green-100/50 ring-green-100 hover:ring-green-200",
    rose: "bg-rose-100/50 ring-rose-100 hover:ring-rose-200",
  };
  return map[tone] || "bg-slate-50 ring-slate-200 hover:ring-slate-300";
}

function toneIconBgClass(tone) {
  const map = {
    indigo: "text-indigo-700",
    amber: "text-amber-700",
    green: "text-green-700",
    rose: "text-rose-700",
  };
  return map[tone] || "bg-slate-100 text-slate-700 ring-slate-200";
}

function SummaryCard({ title, subtitle, value, percent, tone, icon: Icon }) {
  return (
    <div
      className={[
        "rounded-3xl px-5 py-3 ring-1 shadow-lg",
        "transition hover:shadow-lg hover:-translate-y-[1px]",
        "flex items-center justify-between gap-4",
        toneBgRingClass(tone),
      ].join(" ")}
    >
      <div className="min-w-0">
        <div
          className={["text-lg font-semibold", toneTextClass(tone)].join(" ")}
        >
          {title}
        </div>
        <div className={["mt-1 text-sm", toneSubTextClass(tone)].join(" ")}>
          {subtitle}
        </div>
        <div
          className={["mt-6 text-3xl font-bold", toneTextClass(tone)].join(" ")}
        >
          {value}
        </div>
      </div>

      <div className="flex flex-col items-end gap-5">
        <div
          className={[
            "grid h-5 w-5 place-items-center ",
            toneIconBgClass(tone),
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
        <Donut percent={percent} tone={tone} />
      </div>
    </div>
  );
}

/**
 * SUMMARY LOGIC
 * - Overall Score: average progress (0..100)
 * - In Progress: status === IN_PROGRESS
 * - Completed: status === SUBMITTED or APPROVED
 * - Critical: status === REJECTED OR (not completed and progress < 40)
 *
 * If backend provides res.summary, we’ll use it.
 */
function SummaryCards({ items, totalCount, summary }) {
  const computed = useMemo(() => {
    const total = Math.max(0, Number(totalCount) || 0);

    if (summary && typeof summary === "object") {
      const overallScore = clamp(
        summary.overallScore ?? summary.score ?? 0,
        0,
        100,
      );
      const inProgress = Number(summary.inProgress ?? 0) || 0;
      const completed = Number(summary.completed ?? 0) || 0;
      const critical = Number(summary.critical ?? 0) || 0;

      const denom = Math.max(1, Number(summary.total ?? total) || 1);

      return {
        total: Number(summary.total ?? total) || 0,
        overallScore,
        inProgress,
        completed,
        critical,
        pctInProgress: Math.round((inProgress / denom) * 100),
        pctCompleted: Math.round((completed / denom) * 100),
        pctCritical: Math.round((critical / denom) * 100),
      };
    }

    const rows = Array.isArray(items) ? items : [];
    const denom = Math.max(1, total || rows.length || 1);

    const progressVals = rows.map((x) => clamp(x?.progress ?? 0, 0, 100));
    const avgProgress =
      progressVals.length > 0
        ? Math.round(
            progressVals.reduce((a, b) => a + b, 0) / progressVals.length,
          )
        : 0;

    const inProgress = rows.filter(
      (x) => (x?.status || "DRAFT") === "IN_PROGRESS",
    ).length;

    const completed = rows.filter((x) => {
      const s = (x?.status || "DRAFT").toUpperCase();
      return s === "SUBMITTED" || s === "APPROVED";
    }).length;

    const critical = rows.filter((x) => {
      const s = (x?.status || "DRAFT").toUpperCase();
      const p = clamp(x?.progress ?? 0, 0, 100);
      const done = s === "SUBMITTED" || s === "APPROVED";
      return s === "REJECTED" || (!done && p < 40);
    }).length;

    return {
      total,
      overallScore: avgProgress,
      inProgress,
      completed,
      critical,
      pctInProgress: Math.round((inProgress / denom) * 100),
      pctCompleted: Math.round((completed / denom) * 100),
      pctCritical: Math.round((critical / denom) * 100),
    };
  }, [items, totalCount, summary]);

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <SummaryCard
        title="Overall Score"
        subtitle="Compliance readiness"
        value={`${computed.overallScore}%`}
        percent={computed.overallScore}
        tone="indigo"
        icon={ClipboardCheck}
      />
      <SummaryCard
        title="In Progress"
        subtitle="Ongoing work items"
        value={computed.inProgress}
        percent={computed.pctInProgress}
        tone="amber"
        icon={RotateCw}
      />
      <SummaryCard
        title="Completed"
        subtitle="Delivered / closed loop"
        value={computed.completed}
        percent={computed.pctCompleted}
        tone="green"
        icon={CheckCircle2}
      />
      <SummaryCard
        title="Critical"
        subtitle="Prioritize these first"
        value={computed.critical}
        percent={computed.pctCritical}
        tone="rose"
        icon={AlertTriangle}
      />
    </div>
  );
}

function ProgressBar({ value = 0 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const tone =
    v >= 100
      ? "bg-green-600"
      : v >= 70
        ? "bg-indigo-600"
        : v >= 40
          ? "bg-amber-600"
          : "bg-slate-400";

  return (
    <div className="min-w-[180px]">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-semibold">{v}%</span>
        <span>Progress</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
        <div
          className={["h-2 rounded-full", tone].join(" ")}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

function Modal({ open, title, children, onClose, busy }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => (busy ? null : onClose())}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                RoPA
              </div>
              <div className="text-lg font-bold text-slate-900">{title}</div>
            </div>
            <button
              onClick={onClose}
              disabled={busy}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const push = (p) => pages.push(p);

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  if (start > 1) {
    push(1);
    if (start > 2) push("…");
  }
  for (let p = start; p <= end; p++) push(p);
  if (end < totalPages) {
    if (end < totalPages - 1) push("…");
    push(totalPages);
  }

  const btnBase =
    "inline-flex h-9 min-w-[40px] items-center justify-center rounded-xl border text-sm font-semibold transition";
  const btnIdle = "border-slate-200 bg-white text-slate-800 hover:bg-slate-50";
  const btnActive = "border-indigo-200 bg-indigo-50 text-indigo-800";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className={[btnBase, btnIdle, "px-3 gap-1 disabled:opacity-50"].join(
          " ",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`dots-${i}`} className="px-2 text-slate-500">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={[btnBase, p === page ? btnActive : btnIdle].join(" ")}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className={[btnBase, btnIdle, "px-3 gap-1 disabled:opacity-50"].join(
          " ",
        )}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function RopaList() {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [summary, setSummary] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newDesc, setNewDesc] = useState("");

  async function load(nextPage = page, nextQ = q) {
    setLoading(true);
    setErr("");
    try {
      const res = await listRopa({
        page: nextPage,
        pageSize,
        q: (nextQ || "").trim() || "",
      });

      const nextItems = res?.items || res?.data || [];
      setItems(nextItems);

      if (typeof res?.total === "number") setTotal(res.total);
      else if (typeof res?.count === "number") setTotal(res.count);
      else setTotal(null);

      setSummary(res?.summary || null);
    } catch (e) {
      setErr(e?.message || "Failed to load RoPA list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locallyFiltered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((x) => (x.title || "").toLowerCase().includes(term));
  }, [items, q]);

  const usingServerPaging = total !== null;
  const effectiveTotal = usingServerPaging ? total : locallyFiltered.length;
  const totalPages = Math.max(1, Math.ceil((effectiveTotal || 0) / pageSize));

  const pageRows = useMemo(() => {
    if (usingServerPaging) return items;
    const startIdx = (page - 1) * pageSize;
    return locallyFiltered.slice(startIdx, startIdx + pageSize);
  }, [usingServerPaging, items, locallyFiltered, page]);

  const showingFrom = effectiveTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, effectiveTotal);

  function openCreateModal() {
    setErr("");
    setNewTitle("");
    setNewOwner("");
    setNewDesc("");
    setOpenCreate(true);
  }

  function closeCreateModal() {
    if (creating) return;
    setOpenCreate(false);
  }

  async function onCreateConfirm() {
    if (!newTitle.trim()) {
      setErr("Please enter a title");
      return;
    }
    setCreating(true);
    setErr("");
    try {
      const res = await createRopa({ title: newTitle.trim() });
      const id = res?.ropa?.id || res?.ropaActivity?.id || res?.id;
      if (!id) throw new Error("Backend did not return ropa.id");

      setOpenCreate(false);
      nav(`/admin/ropa/${id}`);
    } catch (e) {
      setErr(e?.message || "Failed to create RoPA");
    } finally {
      setCreating(false);
    }
  }

  // layout: Search full width, and 2 buttons side-by-side below it, matching width
  const rightBlockWidth = "w-[420px] max-w-full";
  const actionBtn =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-sm";

  function onSearchSubmit() {
    setPage(1);
    load(1, q);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-green-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-500">RoPA Module</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                Record of Processing Activities
              </div>
              <div className="mt-1 text-sm text-slate-600 max-w-2xl">
                Create and maintain RoPA activities using a step-by-step
                workflow.
              </div>
            </div>

            {/* Right block */}
            <div className={["flex flex-col gap-2", rightBlockWidth].join(" ")}>
              {/* Buttons side-by-side, same overall width as search */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => load(page, q)}
                  className={[
                    actionBtn,
                    "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>

                <button
                  onClick={openCreateModal}
                  className={[
                    actionBtn,
                    "bg-indigo-600 text-white hover:bg-indigo-700",
                  ].join(" ")}
                >
                  <Plus className="h-4 w-4" />
                  Create RoPA
                </button>
              </div>

              {/* Search (full width) */}
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className={[
                      "w-full rounded-2xl border border-slate-200 bg-white",
                      "pl-9 pr-10 py-2.5 text-sm font-medium outline-none",
                      "focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100",
                      "shadow-sm",
                    ].join(" ")}
                    placeholder="Search RoPA by title..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSearchSubmit();
                    }}
                  />
                  {q ? (
                    <button
                      onClick={() => {
                        setQ("");
                        setPage(1);
                        load(1, "");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-50 text-slate-600"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="mt-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>
                    {loading
                      ? "Loading…"
                      : `Showing ${showingFrom}–${showingTo} of ${effectiveTotal}`}
                  </span>
                  <button
                    onClick={onSearchSubmit}
                    className="rounded-lg px-2 py-1 hover:bg-white/70 text-indigo-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Legend moved to bottom */}
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl ">
            <span className="text-xs font-semibold text-slate-700">
              Legend:
            </span>
            {["DRAFT", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED"].map(
              (s) => {
                const m = statusMeta(s);
                return (
                  <span
                    key={s}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 bg-white ring-slate-200"
                    title={m.label}
                  >
                    <span
                      className={["h-2 w-2 rounded-full", m.dot].join(" ")}
                    />
                    <span className="text-slate-700">{m.label}</span>
                  </span>
                );
              },
            )}
          </div>

          {err ? (
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
              {err}
            </div>
          ) : null}
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-500 to-green-600" />
      </div>

      {/* Summary Cards (more modern + colored text per tone) */}
      <SummaryCards
        items={usingServerPaging ? items : locallyFiltered}
        totalCount={effectiveTotal}
        summary={summary}
      />

      {/* Table */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">
            Recent Activities
          </div>
          <div className="text-xs text-slate-500">
            Click Open to continue in the wizard.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="border-t border-slate-200">
                <th className="text-center font-semibold px-5 py-3 w-[70px]">
                  #
                </th>
                <th className="text-center font-bold px-5 py-3">Title</th>
                <th className="text-center font-bold px-5 py-3">Status</th>
                <th className="text-center font-bold px-5 py-3">Progress</th>
                <th className="text-center font-bold px-5 py-3">
                  Current Step
                </th>
                <th className="text-center font-bold px-5 py-3">Updated</th>
                <th className="text-center font-bold px-5 py-3">Action</th>
              </tr>
            </thead>

            {/* ✅ stronger zebra + hover to make odd/even obvious */}
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 w-10 bg-slate-100 rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-64 bg-slate-100 rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-6 w-24 bg-slate-100 rounded-full" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-56 bg-slate-100 rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 bg-slate-100 rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 bg-slate-100 rounded" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-9 w-28 bg-slate-100 rounded-xl ml-auto" />
                    </td>
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10">
                    <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
                      <div className="text-sm font-semibold text-slate-900">
                        No activities found
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Use “Create RoPA” or change your search term.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((x, idx) => {
                  const status = x.status || "DRAFT";
                  const m = statusMeta(status);
                  const serial = (page - 1) * pageSize + idx + 1;

                  const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
                  const hover = "hover:bg-indigo-50/70";

                  return (
                    <tr
                      key={x.id}
                      className={[zebra, hover, "transition"].join(" ")}
                    >
                      <td className="px-5 py-4 font-semibold text-slate-700 text-center">
                        {serial}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 max-w-[420px] truncate">
                          {x.title || "Untitled RoPA"}
                        </div>
                        <div className="text-xs text-slate-500">ID: {x.id}</div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={[
                            "inline-flex w-28 justify-center items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                            m.pill,
                          ].join(" ")}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <ProgressBar value={x.progress ?? 0} />
                      </td>

                      <td className="px-5 py-4 text-slate-700 text-center">
                        {x.currentStep || "OVERVIEW"}
                      </td>

                      <td className="px-5 py-4 text-slate-700 text-center">
                        {fmtDate(x.updatedAt || x.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => nav(`/admin/ropa/${x.id}`)}
                          className={[
                            "inline-flex w-[120px] items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold text-white",
                            "bg-indigo-600 hover:bg-indigo-700 shadow-sm transition",
                          ].join(" ")}
                        >
                          Open →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* pagination footer */}
        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPage={(p) => {
              setPage(p);
              if (usingServerPaging) load(p, q);
            }}
          />
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        open={openCreate}
        title="Create new RoPA activity"
        onClose={closeCreateModal}
        busy={creating}
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
            <div className="text-sm font-semibold text-indigo-900">
              Start a new RoPA record
            </div>
            <div className="mt-1 text-sm text-indigo-900/80">
              Provide a title now. You can complete all details in the wizard.
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">
              Activity title <span className="text-rose-600">*</span>
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              placeholder="e.g., RoPA for Customer Onboarding"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* extra fields (UI only) */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-900">
                Owner team
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="e.g., IT / HR / Marketing"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-900">
                Short note
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="Optional"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>

          {err ? (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
              {err}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={closeCreateModal}
              disabled={creating}
              className="inline-flex w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              onClick={onCreateConfirm}
              disabled={creating || !newTitle.trim()}
              className="inline-flex w-[160px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {creating ? "Creating..." : "Create & Open"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
