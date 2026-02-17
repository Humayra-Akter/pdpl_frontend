import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ShieldAlert,
  FolderOpen,
  Eye,
  Flame,
  Siren,
  ArrowUpRight,
} from "lucide-react";
import {
  createIncident,
  deleteIncident,
  getIncidentSummary,
  listIncidents,
  closeIncident,
} from "../lib/admin";

function fmtDate(v) {
  try {
    if (!v) return "—";
    return new Date(v).toLocaleString();
  } catch {
    return "—";
  }
}

function fmtDateOnly(v) {
  try {
    if (!v) return "—";
    const d = new Date(v);

    const parts = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).formatToParts(d);

    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const year = parts.find((p) => p.type === "year")?.value ?? "";

    // 2-Feb-2026
    return `${day}-${month}-${year}`;
  } catch {
    return "—";
  }
}

function fmtTimeOnly(v) {
  try {
    if (!v) return "";
    return new Date(v).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function clamp(n, a, b) {
  const x = Number(n);
  if (Number.isNaN(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function statusPill(status = "DRAFT") {
  const s = String(status).toUpperCase();
  const map = {
    DRAFT: "bg-slate-100 text-slate-800 ring-slate-200",
    IN_PROGRESS: "bg-amber-100 text-amber-900 ring-amber-200",
    IN_REVIEW: "bg-indigo-100 text-indigo-900 ring-indigo-200",
    CLOSED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  };
  return map[s] || map.DRAFT;
}

function severityPill(sev = "LOW") {
  const s = String(sev).toUpperCase();
  const map = {
    LOW: "bg-slate-100 text-slate-800 ring-slate-200",
    MEDIUM: "bg-amber-100 text-amber-900 ring-amber-200",
    HIGH: "bg-orange-100 text-orange-900 ring-orange-200",
    CRITICAL: "bg-rose-100 text-rose-900 ring-rose-200",
  };
  return map[s] || map.LOW;
}

function isOverdue(dueAt, status) {
  if (!dueAt) return false;
  const s = String(status || "").toUpperCase();
  if (s === "CLOSED") return false;
  return new Date(dueAt).getTime() < Date.now();
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  if (start > 1) pages.push(1, "…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages) pages.push("…", totalPages);

  const btnBase =
    "inline-flex h-9 min-w-[40px] items-center justify-center rounded-xl border text-sm font-semibold transition";
  const btnIdle = "border-slate-200 bg-white text-slate-800 hover:bg-slate-50";
  const btnActive = "border-indigo-200 bg-indigo-50 text-indigo-800";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className={[btnBase, btnIdle, "px-3 disabled:opacity-50"].join(" ")}
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
        className={[btnBase, btnIdle, "px-3 disabled:opacity-50"].join(" ")}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
function KpiCard({ title, value, hint, tone, icon: Icon, total = 0 }) {
  const n = Number(value ?? 0) || 0;
  const denom = Math.max(1, Number(total ?? 0) || 1);
  const pct = Math.round((n / denom) * 100);

  const tones = {
    blue: {
      wrap:"bg-gradient-to-tl from-sky-50 to-sky-200/80 ring-indigo-200 hover:ring-sky-400",
      title: "text-sky-900",
      hint: "text-sky-900/70",
      value: "text-sky-950",
      iconWrap: "bg-sky-100 text-sky-700 ring-sky-200",
      bar: "bg-sky-600",
      barTrack: "bg-sky-200",
    },
    amber: {
      wrap: "bg-gradient-to-tl from-amber-50 to-yellow-200/80 ring-amber-300 hover:ring-amber-400",
      title: "text-amber-900",
      hint: "text-amber-900/70",
      value: "text-amber-950",
      iconWrap: "bg-amber-100 text-amber-700 ring-amber-200",
      bar: "bg-amber-500",
      barTrack: "bg-amber-200",
    },
    indigo: {
      wrap: "bg-gradient-to-tl from-indigo-50 to-indigo-200/80 ring-indigo-300 hover:ring-indigo-400",
      title: "text-indigo-900",
      hint: "text-indigo-900/70",
      value: "text-indigo-950",
      iconWrap: "bg-indigo-100 text-indigo-700 ring-indigo-200",
      bar: "bg-indigo-600",
      barTrack: "bg-indigo-200",
    },
    red: {
      wrap: "bg-gradient-to-tl from-rose-50 to-rose-200/80 ring-rose-300 hover:ring-rose-400",
      title: "text-rose-900",
      hint: "text-rose-900/70",
      value: "text-rose-950",
      iconWrap: "bg-rose-100 text-rose-700 ring-rose-200",
      bar: "bg-rose-600",
      barTrack: "bg-rose-200",
    },
    rose: {
      wrap: "bg-gradient-to-tl from-pink-50 to-pink-200/80 ring-pink-300 hover:ring-pink-400",
      title: "text-pink-900",
      hint: "text-pink-900/70",
      value: "text-pink-950",
      iconWrap: "bg-pink-100 text-pink-700 ring-pink-200",
      bar: "bg-pink-600",
      barTrack: "bg-pink-200",
    },
  };

  const t = tones[tone] || tones.blue;

  return (
    <div
      className={[
        "rounded-xl ring-1 shadow-sm",
        "px-4 py-3",
        "transition hover:shadow-md hover:-translate-y-[1px]",
        t.wrap,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={["text-sm font-bold", t.title].join(" ")}>
            {title}
          </div>
          <div className={["mt-0.5 text-xs font-medium", t.hint].join(" ")}>
            {hint}
          </div>
        </div>

        <div
          className={[
            "grid h-9 w-9 place-items-center rounded-xl ring-1",
            t.iconWrap,
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div className={["text-3xl font-bold leading-none", t.value].join(" ")}>
          {value ?? "—"}
        </div>
        <div className={["text-xs font-bold tabular-nums", t.hint].join(" ")}>
          {pct}% of total
        </div>
      </div>

      {/* mini progress bar */}
      <div className={["mt-3 h-2 rounded-full", t.barTrack].join(" ")}>
        <div
          className={["h-2 rounded-full", t.bar].join(" ")}
          style={{ width: `${clamp(pct, 0, 100)}%` }}
        />
      </div>
    </div>
  );
}


function ConfirmDeleteModal({ open, onClose, onConfirm, busy, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => (busy ? null : onClose())}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Confirm delete
            </div>
            <div className="text-lg font-bold text-slate-900">
              Delete incident?
            </div>
          </div>
          <div className="p-6 space-y-3">
            <div className="text-sm text-slate-700">
              This will soft-delete the incident:
            </div>
            <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4">
              <div className="font-semibold text-slate-900 truncate">
                {title}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={busy}
                className="inline-flex w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className="inline-flex w-[160px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {busy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateIncidentModal({
  open,
  busy,
  onClose,
  onConfirm,
  initialTitle = "",
}) {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState("OTHER");
  const [isBreach, setIsBreach] = useState(false);
  const [localErr, setLocalErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle || "");
    setCategory("OTHER");
    setIsBreach(false);
    setLocalErr("");
  }, [open, initialTitle]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => (busy ? null : onClose())}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Incidents
              </div>
              <div className="text-lg font-bold text-slate-900">
                Create new incident
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={busy}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              aria-label="Close"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
              <div className="text-sm font-semibold text-indigo-900">
                Start a new incident
              </div>
              <div className="mt-1 text-sm text-indigo-900/80">
                Provide basic details now. You can complete the rest in the
                details page.
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-900">
                Title <span className="text-rose-600">*</span>
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="e.g., Unauthorized access detected"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setLocalErr("");
                }}
                autoFocus
              />
            </div>

            {/* Category + breach */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-900">
                  Category
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800"
                >
                  <option value="SECURITY">Security</option>
                  <option value="PRIVACY">Privacy</option>
                  <option value="OPERATIONAL">Operational</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-900">
                  Personal data breach?
                </div>

                <button
                  type="button"
                  onClick={() => setIsBreach((v) => !v)}
                  disabled={busy}
                  className={[
                    "w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                    isBreach
                      ? "border-rose-200 bg-rose-50 text-rose-900"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                    busy ? "opacity-60" : "",
                  ].join(" ")}
                  title="Toggle breach flag"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <span
                      className={[
                        "h-2.5 w-2.5 rounded-full",
                        isBreach ? "bg-rose-600" : "bg-slate-300",
                      ].join(" ")}
                    />
                    {isBreach ? "Yes (Breach)" : "No"}
                  </span>
                </button>
              </div>
            </div>

            {localErr ? (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
                {localErr}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={busy}
                className="inline-flex w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  const t = title.trim();
                  if (!t) {
                    setLocalErr("Please enter a title");
                    return;
                  }
                  onConfirm({ title: t, category, isBreach });
                }}
                disabled={busy}
                className="inline-flex w-[170px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {busy ? "Creating..." : "Create & Open"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IncidentsList() {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [kpis, setKpis] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [isBreach, setIsBreach] = useState("");

  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [createBusy, setCreateBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadSummary() {
    try {
      const res = await getIncidentSummary();
      setKpis(res?.kpis || null);
    } catch {
      // do not block list if summary fails
    }
  }

  async function loadList(nextPage = page) {
    setLoading(true);
    setErr("");
    try {
      const res = await listIncidents({
        page: nextPage,
        pageSize,
        q: q.trim(),
        status,
        severity,
        isBreach,
        sort,
        order,
      });
      setItems(res?.items || []);
      setTotal(Number(res?.total || 0));
    } catch (e) {
      setErr(e?.message || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
    loadList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  function applyFilters() {
    setPage(1);
    loadList(1);
    loadSummary();
  }

  async function openCreate() {
    setErr("");
    setCreateOpen(true);
  }

  async function confirmCreate(payload) {
    setCreateBusy(true);
    setErr("");
    try {
      const res = await createIncident(payload);
      const id = res?.incident?.id;
      if (!id) throw new Error("Backend did not return incident.id");
      setCreateOpen(false);
      nav(`/admin/incidents/${id}`);
    } catch (e) {
      setErr(e?.message || "Failed to create incident");
    } finally {
      setCreateBusy(false);
    }
  }

  function openDelete(row) {
    setDeleteTarget(row);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return;
    setDeleteBusy(true);
    setErr("");
    try {
      await deleteIncident(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadList(page);
      await loadSummary();
    } catch (e) {
      setErr(e?.message || "Failed to delete incident");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function quickClose(id) {
    setErr("");
    try {
      await closeIncident(id);
      await loadList(page);
      await loadSummary();
    } catch (e) {
      setErr(e?.message || "Failed to close incident");
    }
  }

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-rose-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-500">Incidents Module</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                Incident & Breach Management
              </div>
              <div className="mt-1 text-sm text-slate-600 max-w-2xl">
                Track security/privacy incidents, breach flags, deadlines,
                evidence, and lifecycle.
              </div>
            </div>

            <div className="w-[460px] max-w-full space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    loadSummary();
                    loadList(page);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-sm border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
                <button
                  onClick={openCreate}
                  disabled={createBusy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  New Incident
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={[
                    "w-full rounded-xl border border-slate-200 bg-white",
                    "pl-9 pr-10 py-2.5 text-sm font-medium outline-none",
                    "focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100",
                    "shadow-sm",
                  ].join(" ")}
                  placeholder="Search title/description..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                />
                {q ? (
                  <button
                    onClick={() => setQ("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-50 text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {/* Filters + Sort */}
              <div className="grid gap-2 md:grid-cols-4">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  <option value="">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="IN_REVIEW">In review</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  <option value="">All Severity</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>

                <select
                  value={isBreach}
                  onChange={(e) => setIsBreach(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  <option value="">Breach (All)</option>
                  <option value="true">Breach = Yes</option>
                  <option value="false">Breach = No</option>
                </select>

                <select
                  value={`${sort}:${order}`}
                  onChange={(e) => {
                    const [s, o] = e.target.value.split(":");
                    setSort(s);
                    setOrder(o);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  <option value="createdAt:desc">Newest</option>
                  <option value="createdAt:asc">Oldest</option>
                  <option value="title:asc">Title A→Z</option>
                  <option value="title:desc">Title Z→A</option>
                  <option value="dueAt:asc">Due soon</option>
                  <option value="dueAt:desc">Due far</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  {loading
                    ? "Loading…"
                    : `Showing ${showingFrom}–${showingTo} of ${total}`}
                </span>
                <button
                  onClick={applyFilters}
                  className="rounded-lg px-2 py-1 hover:bg-white/70 text-indigo-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
              {err}
            </div>
          ) : null}
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-500 to-rose-600" />
      </div>

      {/* KPIs */}
      <div className="grid gap-3 lg:grid-cols-5">
        <KpiCard
          title="Total"
          hint="All incidents"
          value={kpis?.total ?? "—"}
          tone="blue"
          icon={FolderOpen}
          total={kpis?.total ?? 0}
        />
        <KpiCard
          title="Open"
          hint="Not closed"
          value={kpis?.open ?? "—"}
          tone="amber"
          icon={Flame}
          total={kpis?.total ?? 0}
        />
        <KpiCard
          title="In Review"
          hint="Waiting decision"
          value={kpis?.inReview ?? "—"}
          tone="indigo"
          icon={Eye}
          total={kpis?.total ?? 0}
        />
        <KpiCard
          title="Critical"
          hint="Critical & open"
          value={kpis?.critical ?? "—"}
          tone="red"
          icon={Siren}
          total={kpis?.total ?? 0}
        />
        <KpiCard
          title="Breaches"
          hint="Breach flagged"
          value={kpis?.breaches ?? "—"}
          tone="rose"
          icon={ShieldAlert}
          total={kpis?.total ?? 0}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">
            Recent Incidents
          </div>
          <div className="text-xs text-slate-500">
            Click Open to view details.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="border-t border-slate-200">
                <th className="text-center font-semibold px-4 py-3 w-[64px]">
                  #
                </th>
                <th className="text-left font-bold px-4 py-3">Title</th>
                <th className="text-center font-bold px-4 py-3 w-[120px]">
                  Status
                </th>
                <th className="text-center font-bold px-4 py-3 w-[120px]">
                  Severity
                </th>
                <th className="text-center font-bold px-4 py-3 w-[90px]">
                  Breach
                </th>
                <th className="text-center font-bold px-4 py-3 w-[150px]">
                  Due
                </th>
                <th className="text-center font-bold px-4 py-3 w-[150px]">
                  Updated
                </th>
                <th className="text-right font-bold px-4 py-3 w-[220px]">
                  Actions
                </th>
              </tr>
            </thead>

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
                      <div className="h-6 w-16 bg-slate-100 rounded-full" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 bg-slate-100 rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 bg-slate-100 rounded" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-9 w-40 bg-slate-100 rounded-xl ml-auto" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10">
                    <div className="rounded-xl bg-slate-50 p-6 ring-1 ring-slate-200">
                      <div className="text-sm font-semibold text-slate-900">
                        No incidents found
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Create a new incident or adjust your filters.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items?.map((x, idx) => {
                  const serial = (page - 1) * pageSize + idx + 1;
                  const overdue = isOverdue(x.dueAt, x.status);

                  return (
                    <tr
                      key={x.id}
                      className={[
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50",
                        overdue ? "bg-rose-50/50" : "",
                        "hover:bg-indigo-50/70 transition",
                      ].join(" ")}
                    >
                      <td className="px-5 py-4 font-semibold text-slate-700 text-center">
                        {serial}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 max-w-[520px] truncate">
                          {x.title}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[520px]">
                          {x.category}
                          {x.assignedTo?.fullName
                            ? ` • Assigned: ${x.assignedTo.fullName}`
                            : ""}
                          {x.id ? ` • ${x.id.slice(0, 8)}…` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={[
                            "inline-flex w-24 justify-center items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                            statusPill(x.status),
                          ].join(" ")}
                        >
                          {x.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={[
                            "inline-flex w-24 justify-center items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                            severityPill(x.severity),
                          ].join(" ")}
                        >
                          {x.severity || "LOW"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {x.isBreach ? (
                          <span className="inline-flex items-center text-red-700 text-xs font-semibold">
                            YES
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-700 text-xs font-semibold">
                            NO
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div
                          className={[
                            "leading-tight",
                            overdue ? "text-rose-900" : "text-slate-800",
                          ].join(" ")}
                        >
                          <div className="text-sm font-semibold">
                            {x.dueAt ? fmtDateOnly(x.dueAt) : "—"}
                          </div>
                          <div className="text-xs font-semibold opacity-70">
                            {x.dueAt ? fmtTimeOnly(x.dueAt) : ""}
                          </div>
                          {overdue ? (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-900 ring-1 ring-rose-200 px-2 py-0.5 text-[11px] font-bold">
                              <ArrowUpRight className="h-3 w-3" />
                              Overdue
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="leading-tight text-slate-700">
                          <div className="text-sm font-semibold">
                            {fmtDateOnly(x.updatedAt)}
                          </div>
                          <div className="text-xs font-semibold opacity-70">
                            {fmtTimeOnly(x.updatedAt)}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {String(x.status).toUpperCase() !== "CLOSED" ? (
                            <button
                              onClick={() => quickClose(x.id)}
                              className="inline-flex items-center justify-center rounded-xl px-2 py-1 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50"
                              title="Quick close"
                            >
                              Close
                            </button>
                          ) : null}

                          <button
                            onClick={() => nav(`/admin/incidents/${x.id}`)}
                            className="inline-flex items-center justify-center rounded-xl px-2 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
                            title="Open"
                          >
                            Open →
                          </button>

                          <button
                            onClick={() => openDelete(x)}
                            className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPage={(p) => {
              setPage(p);
              loadList(p);
            }}
          />
        </div>
      </div>

      <CreateIncidentModal
        open={createOpen}
        busy={createBusy}
        onClose={() => {
          if (createBusy) return;
          setCreateOpen(false);
        }}
        onConfirm={confirmCreate}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        busy={deleteBusy}
        title={deleteTarget?.title || "—"}
        onClose={() => {
          if (deleteBusy) return;
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
