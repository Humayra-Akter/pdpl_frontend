import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Activity,
  ClipboardList,
} from "lucide-react";
import { listVendor, createVendor } from "../lib/admin";

/* ------------------ helpers ------------------ */
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
    SUBMITTED: "bg-indigo-100 text-indigo-900 ring-indigo-200",
    COMPLETED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  };
  return map[s] || map.DRAFT;
}

function riskPill(risk = "LOW") {
  const s = String(risk).toUpperCase();
  const map = {
    LOW: "bg-slate-100 text-slate-800 ring-slate-200",
    MEDIUM: "bg-amber-100 text-amber-900 ring-amber-200",
    HIGH: "bg-rose-100 text-rose-900 ring-rose-200",
  };
  return map[s] || map.LOW;
}

function riskFromScore(score) {
  const n = Number(score ?? 0) || 0;
  if (n <= 20) return "HIGH";
  if (n <= 36) return "MEDIUM";
  return "LOW";
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
  };

  const t = tones[tone] || tones.indigo;

  return (
    <div className={["rounded-xl ring-1 p-4", t.wrap].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={["text-xs font-bold", t.title].join(" ")}>
            {title}
          </div>
          <div className={["mt-1 text-3xl font-bold", t.value].join(" ")}>
            {value}
          </div>
          <div className={["mt-1 text-xs font-semibold", t.hint].join(" ")}>
            {hint}
          </div>
        </div>
        <div
          className={[
            "h-11 w-11 rounded-xl grid place-items-center ring-1",
            t.iconWrap,
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* ------------------ page ------------------ */
export default function VendorList() {
  const nav = useNavigate();

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [risk, setRisk] = useState("ALL");

  // paging
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  async function load() {
    setLoading(true);
    try {
      // backend supports: { status, search }
      const params = {};
      if (status !== "ALL") params.status = status;
      if (q.trim()) params.search = q.trim();

      const res = await listVendor(params);
      setRaw(res.items || []);
    } catch (e) {
      console.error(e);
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when filters change, reset page
  useEffect(() => {
    setPage(1);
  }, [q, status, risk]);

  const items = useMemo(() => {
    // risk filter is client-side (backend doesn't filter it)
    let xs = [...raw];

    if (risk !== "ALL") {
      xs = xs.filter((x) => {
        const r = x.riskLevel || riskFromScore(x.totalScore);
        return String(r).toUpperCase() === String(risk).toUpperCase();
      });
    }

    return xs;
  }, [raw, risk]);

  const kpis = useMemo(() => {
    const total = items.length;
    const completed = items.filter(
      (x) => String(x.status).toUpperCase() === "COMPLETED",
    ).length;
    const inProgress = items.filter((x) =>
      ["IN_PROGRESS", "SUBMITTED"].includes(String(x.status).toUpperCase()),
    ).length;
    const highRisk = items.filter((x) => {
      const r = x.riskLevel || riskFromScore(x.totalScore);
      return String(r).toUpperCase() === "HIGH";
    }).length;

    return { total, completed, inProgress, highRisk };
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageSafe = clamp(page, 1, totalPages);
  const paged = items.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  async function onCreate() {
    try {
      setCreating(true);
      const created = await createVendor({
        general: {
          vendorName: "",
          vendorContactName: "",
          jobTitle: "",
          email: "",
          services: "",
          assessmentDate: "",
        },
      });
      nav(`/admin/vendor/${created.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-green-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-500">
                Policies & Procedures
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                Third Party Agreements
              </div>
              <div className="mt-1 text-sm text-slate-600 max-w-2xl">
                Vendor privacy assessment checklist • scoring • decision outcome
              </div>
            </div>

            {/* Right block */}
            <div className="flex flex-col gap-2">
              {/* Buttons side-by-side, same overall width as search */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={load}
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>

                <button
                  onClick={onCreate}
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold disabled:opacity-60 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  {creating ? "Creating..." : "New Agreement"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-500 to-green-600" />
      </div>

      {/* KPIs (look alike to incidents) */}
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard
          title="TOTAL AGREEMENTS"
          value={kpis.total}
          hint="All vendor assessments"
          tone="indigo"
          icon={ClipboardList}
        />
        <KpiCard
          title="IN PROGRESS"
          value={kpis.inProgress}
          hint="Draft / in progress / submitted"
          tone="amber"
          icon={Activity}
        />
        <KpiCard
          title="COMPLETED"
          value={kpis.completed}
          hint="Marked complete"
          tone="emerald"
          icon={ShieldCheck}
        />
        <KpiCard
          title="HIGH RISK"
          value={kpis.highRisk}
          hint="Score indicates high risk"
          tone="rose"
          icon={ShieldAlert}
        />
      </div>

      {/* Search + filters row */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
              {q ? (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1 text-slate-500 hover:bg-slate-100"
                  title="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="ALL">All Risk</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            <button
              onClick={load}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Agreements
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {loading ? "Loading..." : `${items.length} record(s)`}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-bold text-slate-600">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Vendor Name</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Total Score</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    className="px-5 py-8 text-sm font-semibold text-slate-500"
                    colSpan={6}
                  >
                    Loading...
                  </td>
                </tr>
              ) : paged.length ? (
                paged.map((x) => {
                  const riskLevel =
                    x.riskLevel ||
                    (x.totalScore != null ? riskFromScore(x.totalScore) : "—");
                  return (
                    <tr
                      key={x.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                            <ClipboardList className="h-5 w-5 text-indigo-700" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">
                              {x.title || "Third Party Agreement"}
                            </div>
                            <div className="text-xs font-semibold text-slate-500">
                              ID: {String(x.id).slice(0, 8)}…
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {x?.formData?.general?.vendorName?.trim() || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {x.createdAt
                          ? new Date(x.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
                            statusPill(x.status),
                          ].join(" ")}
                        >
                          {x.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-indigo-600"
                              style={{
                                width: `${clamp(x.progress ?? 0, 0, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="text-xs font-bold text-slate-700">
                            {clamp(x.progress ?? 0, 0, 100)}%
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-900">
                        {x.totalScore ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        {riskLevel === "—" ? (
                          <span className="text-sm font-semibold text-slate-500">
                            —
                          </span>
                        ) : (
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
                              riskPill(riskLevel),
                            ].join(" ")}
                          >
                            {riskLevel}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => nav(`/admin/vendor/${x.id}`)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Open
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-5 py-10" colSpan={6}>
                    <div className="text-sm font-medium text-slate-900">
                      No agreements found
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-500">
                      Try changing the filters or create a new agreement.
                    </div>
                    <button
                      onClick={onCreate}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4" />
                      New Agreement
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <Pagination
            page={pageSafe}
            totalPages={totalPages}
            onPage={setPage}
          />
        </div>
      </div>
    </div>
  );
}
