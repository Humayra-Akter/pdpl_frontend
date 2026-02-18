// src/pages/user/UserCasesList.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  AlertTriangle,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { listMyCases, createMyCase } from "../../lib/user";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function SoftCard({ className = "", children }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function EndpointMissing({ label }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
      <div>
        <div className="font-semibold text-slate-800">
          {label} not connected
        </div>
        <div className="text-xs text-slate-600">
          Endpoint missing — showing placeholder UI.
        </div>
      </div>
    </div>
  );
}

function Badge({ value, kind = "status" }) {
  const v = String(value || "").toUpperCase();

  // Subtle, “not tacky” pill styles
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold";

  if (kind === "type") {
    if (v === "INCIDENT")
      return (
        <span className={cn(base, "border-rose-200 bg-rose-50 text-rose-800")}>
          {value || "—"}
        </span>
      );
    if (v === "DSR")
      return (
        <span
          className={cn(base, "border-indigo-200 bg-indigo-50 text-indigo-800")}
        >
          {value || "—"}
        </span>
      );
    if (v === "VENDOR")
      return (
        <span
          className={cn(base, "border-amber-200 bg-amber-50 text-amber-800")}
        >
          {value || "—"}
        </span>
      );
    return (
      <span className={cn(base, "border-slate-200 bg-slate-50 text-slate-700")}>
        {value || "—"}
      </span>
    );
  }

  // status
  if (["CLOSED", "COMPLETED", "DONE", "RESOLVED"].includes(v))
    return (
      <span
        className={cn(
          base,
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        )}
      >
        {value || "—"}
      </span>
    );

  if (["OPEN", "PENDING", "IN_PROGRESS", "REVIEW", "SUBMITTED"].includes(v))
    return (
      <span className={cn(base, "border-sky-200 bg-sky-50 text-sky-800")}>
        {value || "—"}
      </span>
    );

  if (["NEED_INFO", "NEEDINFO"].includes(v))
    return (
      <span className={cn(base, "border-amber-200 bg-amber-50 text-amber-800")}>
        NEED_INFO
      </span>
    );

  if (["REJECTED", "CANCELLED", "BLOCKED"].includes(v))
    return (
      <span className={cn(base, "border-rose-200 bg-rose-50 text-rose-800")}>
        {value || "—"}
      </span>
    );

  return (
    <span className={cn(base, "border-slate-200 bg-slate-50 text-slate-700")}>
      {value || "—"}
    </span>
  );
}

function StatChip({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-800",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return (
    <div
      className={cn("rounded-2xl border px-3 py-2", tones[tone] || tones.slate)}
    >
      <div className="text-[11px] font-semibold opacity-80">{label}</div>
      <div className="mt-0.5 text-xl font-bold leading-none">{value}</div>
    </div>
  );
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString();
}

/** Small helper: keep URL params clean */
function setOrDelete(sp, key, val) {
  if (!val || val === "ALL") sp.delete(key);
  else sp.set(key, val);
}

function CreateInlineModal({ open, onClose, onCreated }) {
  const [type, setType] = useState("DSR");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [missing, setMissing] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit = title.trim() && description.trim() && type.trim();

  useEffect(() => {
    if (!open) {
      setType("DSR");
      setTitle("");
      setDescription("");
      setSubmitting(false);
      setMissing(false);
      setErr("");
    }
  }, [open]);

  async function submit() {
    setErr("");
    setMissing(false);
    if (!canSubmit) return;

    setSubmitting(true);
    const res = await createMyCase({ type, title, description });
    setSubmitting(false);

    if (res.missing) return setMissing(true);
    if (!res.ok) return setErr(res.error?.message || "Failed");

    const createdId = res.data?.id || res.data?.case?.id || res.data?.data?.id;
    if (createdId) onCreated(createdId);
    else onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(2,6,23,0.35)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="text-base font-semibold text-slate-900">
              Create request
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Quick create — add attachments & comments inside the request.
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {missing && <EndpointMissing label="Create request" />}
          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {err}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <div className="mb-1 text-xs font-semibold text-slate-600">
                Type *
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/40"
              >
                <option value="DSR">DSR</option>
                <option value="INCIDENT">Incident</option>
                <option value="VENDOR">Vendor</option>
                <option value="QUESTION">Privacy question</option>
              </select>
            </label>

            <label className="text-sm">
              <div className="mb-1 text-xs font-semibold text-slate-600">
                Title *
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/40"
                placeholder="Short title"
              />
            </label>
          </div>

          <label className="text-sm block">
            <div className="mb-1 text-xs font-semibold text-slate-600">
              Description *
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/40"
              placeholder="Describe your request (deadline, impact, context)"
            />
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-800">
              Attachments
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Upload inside the request detail page after creating it.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm",
              !canSubmit || submitting
                ? "bg-slate-300"
                : "bg-indigo-600 hover:bg-indigo-700",
            )}
          >
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserCasesList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // URL-driven filters
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const typeOptions = [
    "ALL",
    "DSR",
    "DPIA",
    "INCIDENT",
    "POLICY",
    "VENDOR",
    "QUESTION",
  ];
  const statusOptions = [
    "ALL",
    "SUBMITTED",
    "IN_REVIEW",
    "NEED_INFO",
    "IN_PROGRESS",
    "PENDING",
    "COMPLETED",
    "CLOSED",
  ];

  // init from URL
  useEffect(() => {
    const spQ = searchParams.get("q") || "";
    const spType = (searchParams.get("type") || "ALL").toUpperCase();
    const spStatus = (searchParams.get("status") || "ALL").toUpperCase();

    setQ(spQ);
    setType(typeOptions.includes(spType) ? spType : "ALL");
    setStatus(statusOptions.includes(spStatus) ? spStatus : "ALL");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep URL in sync (debounced-ish without timers: only when values change)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    setOrDelete(next, "q", q.trim() || "");
    setOrDelete(next, "type", type);
    setOrDelete(next, "status", status);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, status]);

  async function load() {
    setLoading(true);

    // Let backend filter too (still ok if backend ignores q/type/status)
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (type !== "ALL") params.type = type;
    if (status !== "ALL") params.status = status;

    const res = await listMyCases(params);
    setMissing(!!res.missing);
    setItems(res.ok ? res.data?.items || res.data || [] : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, status]);

  const filtered = useMemo(() => {
    // We still do client filtering as a safety net (in case backend doesn’t support)
    let xs = [...items];
    const qq = q.trim().toLowerCase();
    if (qq)
      xs = xs.filter((x) =>
        String(x.title || "")
          .toLowerCase()
          .includes(qq),
      );
    if (type !== "ALL")
      xs = xs.filter((x) => String(x.type || "").toUpperCase() === type);
    if (status !== "ALL")
      xs = xs.filter((x) => String(x.status || "").toUpperCase() === status);

    xs.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
    );
    return xs;
  }, [items, q, type, status]);

  const stats = useMemo(() => {
    const all = filtered;
    const total = all.length;
    const needInfo = all.filter(
      (x) => String(x.status || "").toUpperCase() === "NEED_INFO",
    ).length;
    const inReview = all.filter(
      (x) => String(x.status || "").toUpperCase() === "IN_REVIEW",
    ).length;
    const incidents = all.filter(
      (x) => String(x.type || "").toUpperCase() === "INCIDENT",
    ).length;
    return { total, needInfo, inReview, incidents };
  }, [filtered]);

  function clearFilters() {
    setQ("");
    setType("ALL");
    setStatus("ALL");
  }

  return (
    <div className="space-y-4">
      {/* Header / controls — clean, not tacky */}
      <SoftCard className="overflow-hidden">
        <div className="relative px-6 py-5">
          {/* subtle background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.08),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.8),rgba(255,255,255,0.95))]" />

          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  My Requests
                </div>
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Search, filter, and open request details. Upload attachments and
                add comments inside a request.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
            </div>
          </div>

          <div className="relative mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
            {/* Stats row */}
            <div className="grid gap-2 sm:grid-cols-4">
              <StatChip label="Total" value={stats.total} tone="slate" />
              <StatChip label="Need info" value={stats.needInfo} tone="amber" />
              <StatChip label="In review" value={stats.inReview} tone="sky" />
              <StatChip label="Incidents" value={stats.incidents} tone="rose" />
            </div>

            {/* Filters row */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="grid gap-2 md:grid-cols-[1fr_170px_170px_auto]">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500"
                    placeholder="Search by title…"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                  >
                    {typeOptions.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                  >
                    {statusOptions.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              </div>

              <div className="mt-2 text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filtered.length}
                </span>{" "}
                {filtered.length === 1 ? "item" : "items"}
              </div>
            </div>
          </div>
        </div>
      </SoftCard>

      {/* Table */}
      <SoftCard className="overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-600">
          <div className="col-span-6">Title</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Updated</div>
        </div>

        {missing ? (
          <div className="p-5">
            <EndpointMissing label="List cases" />
          </div>
        ) : loading ? (
          <div className="p-5 space-y-2">
            <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-base font-semibold text-slate-900">
                No requests found
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Try clearing filters, or create a new request.
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={clearFilters}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Create request
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((x) => (
              <button
                key={x.id}
                onClick={() => navigate(`/user/cases/${x.id}`)}
                className={cn(
                  "group grid w-full grid-cols-12 gap-3 px-5 py-4 text-left",
                  "transition hover:bg-slate-50",
                )}
              >
                <div className="col-span-6 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
                      {x.title || "Untitled"}
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      #{String(x.id).slice(0, 6)}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-sm text-slate-600">
                    {x.description || "—"}
                  </div>
                </div>

                <div className="col-span-2 flex items-center">
                  <Badge kind="type" value={x.type || "—"} />
                </div>

                <div className="col-span-2 flex items-center">
                  <Badge kind="status" value={x.status || "—"} />
                </div>

                <div className="col-span-2 flex items-center justify-between gap-2">
                  <div className="text-sm text-slate-700">
                    {fmtDate(x.updatedAt || x.createdAt)}
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 opacity-0 transition group-hover:opacity-100">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </SoftCard>

      <CreateInlineModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => navigate(`/user/cases/${id}`)}
      />
    </div>
  );
}
