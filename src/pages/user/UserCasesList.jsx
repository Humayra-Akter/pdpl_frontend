// src/pages/user/UserCasesList.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  X,
  Sparkles,
  ChevronRight,
  Filter,
  ShieldAlert,
  ClipboardCheck,
  Info,
  Clock,
} from "lucide-react";
import { listMyCases, createMyCase } from "../../lib/user";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function SoftCard({ className = "", children }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function EndpointMissing({ label }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
      <div>
        <div className="font-semibold text-slate-900">
          {label} not connected
        </div>
        <div className="mt-0.5 text-xs text-slate-700/80">
          Endpoint missing — showing placeholder UI.
        </div>
      </div>
    </div>
  );
}

function Badge({ value, kind = "status" }) {
  const v = String(value || "").toUpperCase();
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold";

  // type
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
          className={cn(base, "border-amber-200 bg-amber-50 text-amber-900")}
        >
          {value || "—"}
        </span>
      );
    if (v === "QUESTION" || v === "POLICY")
      return (
        <span className={cn(base, "border-sky-200 bg-sky-50 text-sky-900")}>
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

  if (["IN_REVIEW", "REVIEW"].includes(v))
    return (
      <span className={cn(base, "border-sky-200 bg-sky-50 text-sky-900")}>
        {value || "—"}
      </span>
    );

  if (["OPEN", "PENDING", "IN_PROGRESS", "SUBMITTED"].includes(v))
    return (
      <span
        className={cn(base, "border-indigo-200 bg-indigo-50 text-indigo-800")}
      >
        {value || "—"}
      </span>
    );

  if (["NEED_INFO", "NEEDINFO"].includes(v))
    return (
      <span className={cn(base, "border-amber-200 bg-amber-50 text-amber-900")}>
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

function StatCard({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate:
      "border-slate-200/70 bg-gradient-to-br from-slate-50 to-slate-100 shadow-md hover:shadow-lg hover:bg-slate-50/60 text-slate-900 text-slate-700",
    indigo:
      "border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-md hover:shadow-lg hover:bg-indigo-50 text-indigo-950 text-indigo-700",
    amber:
      "border-amber-200/70 bg-gradient-to-br from-amber-50 to-amber-100 shadow-md hover:shadow-lg hover:bg-amber-50 text-amber-950 text-amber-700",
    sky: "border-sky-200/70 bg-gradient-to-br from-sky-50 to-sky-100 shadow-md hover:shadow-lg hover:bg-sky-50 text-sky-950 text-sky-700",
    rose: "border-rose-200/70 bg-gradient-to-br from-rose-50 to-rose-100 shadow-md hover:shadow-lg hover:bg-rose-50 text-rose-950 text-rose-700",
    emerald:
      "border-emerald-200/70 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-950 text-emerald-700",
  };

  return (
    <div
      className={cn(
        "group rounded-xl border p-4 transition",
        tones[tone] || tones.slate,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold capitalize tracking-wide">
            {label}
          </div>
          <div className="mt-1 truncate text-2xl font-semibold">{value}</div>
        </div>
        <div>
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full w-2/3 rounded-full bg-slate-200 transition group-hover:w-4/5" />
      </div>
    </div>
  );
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString();
}

/** keep URL params clean */
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              Create request
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Create fast — add attachments & comments inside the request.
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
              placeholder="Deadline, impact, context, affected system..."
            />
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              Attachments
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Upload on the request detail page after creating.
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

  // Modern: status tabs (maps to status filter)
  const statusTabs = [
    { key: "ALL", label: "All" },
    { key: "NEED_INFO", label: "Need info" },
    { key: "IN_REVIEW", label: "In review" },
    { key: "SUBMITTED", label: "Submitted" },
    { key: "CLOSED", label: "Closed" },
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

  // keep URL in sync
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
    // stats based on ALL items (not just filtered) feels more “dashboard”
    const all = Array.isArray(items) ? items : [];
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
  }, [items]);

  function clearFilters() {
    setQ("");
    setType("ALL");
    setStatus("ALL");
  }

  function accentByType(t) {
    const v = String(t || "").toUpperCase();
    if (v === "INCIDENT") return "bg-rose-500";
    if (v === "DSR") return "bg-indigo-500";
    if (v === "VENDOR") return "bg-amber-500";
    if (v === "QUESTION" || v === "POLICY") return "bg-sky-500";
    return "bg-slate-400";
  }

  function iconByType(t) {
    const v = String(t || "").toUpperCase();
    if (v === "INCIDENT") return ShieldAlert;
    if (v === "DSR") return ClipboardCheck;
    if (v === "QUESTION" || v === "POLICY") return Info;
    return Clock;
  }

  return (
    <div className="space-y-5">
      {/* Modern Hero Header */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <div className="absolute inset-0">
          <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-indigo-100 blur-3xl opacity-70" />
          <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-sky-100 blur-3xl opacity-70" />
        </div>

        <div className="relative px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-indigo-700">
                    My Requests
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Track your privacy requests, upload evidence, and
                    communicate with the privacy team.
                  </div>
                </div>
              </div>

              {/* Status tabs */}
              <div className="mt-4 inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/70 p-1">
                {statusTabs.map((t) => {
                  const active = status === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setStatus(t.key)}
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm font-semibold transition",
                        active
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
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

          {/* Stat cards + Filters */}
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-3 sm:grid-cols-4">
              <StatCard
                label="Total"
                value={stats.total}
                icon={ClipboardCheck}
                tone="slate"
              />
              <StatCard
                label="Need info"
                value={stats.needInfo}
                icon={AlertTriangle}
                tone="amber"
              />
              <StatCard
                label="In review"
                value={stats.inReview}
                icon={Info}
                tone="sky"
              />
              <StatCard
                label="Incidents"
                value={stats.incidents}
                icon={ShieldAlert}
                tone="rose"
              />
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_170px_auto]">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500"
                    placeholder="Search by title…"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
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

                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filtered.length}
                </span>{" "}
                {filtered.length === 1 ? "request" : "requests"}
              </div>
            </div>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
      </div>

      {/* List */}
      <SoftCard className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="text-sm font-semibold text-indigo-700">Requests</div>
          <div className="text-xs text-slate-500">
            Tip: If “Need info”, add deadline + impact inside comments.
          </div>
        </div>

        {missing ? (
          <div className="p-5">
            <EndpointMissing label="List cases" />
          </div>
        ) : loading ? (
          <div className="p-5 space-y-3">
            <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <div className="rounded-xl border border-slate-200 bg-white p-8">
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-indigo-700">
                    No requests found
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Try clearing filters, or create a new request.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    DSR request
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Access, correct, or delete personal data.
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Incident report
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Report phishing, breach, or suspicious activity.
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Vendor / Question
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Ask privacy questions or vendor concerns.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((x) => {
              const Accent = accentByType(x.type);
              const TypeIcon = iconByType(x.type);
              const updated = fmtDate(x.updatedAt || x.createdAt);

              return (
                <button
                  key={x.id}
                  onClick={() => navigate(`/user/cases/${x.id}`)}
                  className={cn(
                    "group relative flex w-full items-stretch gap-4 px-5 py-4 text-left",
                    "transition hover:bg-slate-50",
                  )}
                >
                  {/* left accent */}
                  <div className={cn("w-1.5 shrink-0 rounded-full", Accent)} />

                  {/* icon bubble */}
                  <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm">
                    <TypeIcon className="h-5 w-5 text-slate-700" />
                  </div>

                  {/* main */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
                        {x.title || "Untitled"}
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        #{String(x.id).slice(0, 6)}
                      </span>
                    </div>

                    <div className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {x.description || "—"}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge kind="type" value={x.type || "—"} />
                      <Badge kind="status" value={x.status || "—"} />
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                        <Clock className="h-3.5 w-3.5" />
                        {updated}
                      </span>
                    </div>
                  </div>

                  {/* right chevron */}
                  <div className="flex shrink-0 items-center">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              );
            })}
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
