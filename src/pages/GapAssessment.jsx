import { useEffect, useState } from "react";
import {
  FileDown,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import {
  getGapSummary,
  listGapAssessments,
  createGapAssessment,
  updateGapAssessment,
} from "../lib/gap";

/** --- UI helpers --- */
function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-xl bg-white ring-1 ring-slate-200 shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function IndigoButton({ className = "", ...props }) {
  return (
    <button
      className={[
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
        "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

function OutlineButton({ className = "", ...props }) {
  return (
    <button
      className={[
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
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
      className={[
        "inline-flex items-center justify-center",
        "w-28", // ✅ fixed width so badge size doesn't change by text length
        "rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        map[tone] || map.neutral,
      ].join(" ")}
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
          className={`h-2.5 rounded-full ${bar}`}
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
    indigo: "stroke-indigo-600",
    amber: "stroke-amber-600",
    rose: "stroke-rose-600",
    emerald: "stroke-emerald-600",
  };

  return (
    <svg width="77" height="77" viewBox="0 0 88 88">
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-slate-200"
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
        className={colors[tone] || colors.indigo}
        transform="rotate(-90 44 44)"
      />
      <text
        x="44"
        y="48"
        textAnchor="middle"
        className="fill-slate-900 font-semibold"
        fontSize="16"
      >
        {v}%
      </text>
    </svg>
  );
}

function FancyKpiTile({
  title,
  subtitle,
  valueText,
  ringValue,
  ringTone,
  icon: Icon,
  bg,
  rightLines,
}) {
  return (
    <div className={["rounded-xl border px-5 py-2 shadow-sm", bg].join(" ")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xl mt-1 font-semibold text-slate-900">
            {title}
          </div>
          <div className="mt-1 text-sm text-slate-800">{subtitle}</div>
          <div className="mt-4 text-3xl font-bold text-slate-900">
            {valueText}
          </div>

          {rightLines ? (
            <div className="mt-1 space-y-1 text-sm">
              {rightLines.map((x) => (
                <div
                  key={x.label}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-slate-700">{x.label}</span>
                  <span className="font-bold text-slate-900">{x.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-5">
          {Icon ? (
            <div className=" p-1 ">
              <Icon className="h-5 w-5 text-slate-700" />
            </div>
          ) : null}
          <Ring value={ringValue} tone={ringTone} />
        </div>
      </div>
    </div>
  );
}

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
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <IndigoButton
            onClick={() => onCreate({ title, scope })}
            disabled={!title.trim()}
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

  // no useMemo
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

  // Status rules:
  // - COMPLETED => progress 100
  // - DRAFT => progress 0
  // - IN_PROGRESS => if 0, set 25
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
  const draft = Number(k.draft || 0);
  const critical = Number(k.critical || 0);

  const avgProgress = items.length
    ? Math.round(
        items.reduce((a, x) => a + (Number(x.progress) || 0), 0) / items.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          <OutlineButton>
            <FileDown className="h-4 w-4" /> Export
          </OutlineButton>

          <IndigoButton onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Assessment
          </IndigoButton>
        </div>
      </div>

      {/* Error */}
      {err ? (
        <div className="rounded-xl bg-white p-5 ring-1 ring-red-200">
          <div className="font-semibold text-red-700">Page failed</div>
          <div className="mt-1 text-sm text-slate-600">{err}</div>
          <IndigoButton className="mt-3" onClick={loadAll}>
            Retry
          </IndigoButton>
        </div>
      ) : null}

      {/* KPI tiles */}
      <div className="grid gap-4 xl:grid-cols-4">
        <FancyKpiTile
          title="Overall Score"
          subtitle="Compliance readiness"
          valueText={`${avgProgress}%`}
          ringValue={avgProgress}
          ringTone="indigo"
          icon={ClipboardList}
          bg="border-indigo-100 bg-indigo-50/70 shadow-xl hover:bg-indigo-100/50 hover:border-indigo-300/70 hover:shadow-2xl transition"
        />

        <FancyKpiTile
          title="In Progress"
          subtitle="Ongoing work items"
          valueText={`${inProgress}`}
          ringValue={total ? Math.round((inProgress / total) * 100) : 0}
          ringTone="amber"
          icon={RefreshCw}
          bg="border-amber-100 bg-amber-50/70 shadow-xl hover:bg-amber-100/50 hover:border-amber-300/70 hover:shadow-2xl transition"
        />

        <FancyKpiTile
          title="Completed"
          subtitle="Delivered"
          valueText={`${completed}`}
          ringValue={total ? Math.round((completed / total) * 100) : 0}
          ringTone="emerald"
          icon={CheckCircle2}
          bg="border-green-100 bg-green-50/70 shadow-xl hover:bg-green-100/50 hover:border-green-300/70 hover:shadow-2xl transition"
        />

        <FancyKpiTile
          title="Critical"
          subtitle="Prioritize these first"
          valueText={`${critical}`}
          ringValue={total ? Math.round((critical / total) * 100) : 0}
          ringTone="rose"
          icon={AlertTriangle}
          bg="border-red-100 bg-red-50/70 shadow-xl hover:bg-red-100/50 hover:border-red-300/70 hover:shadow-2xl transition"
          // rightLines={[
          //   { label: "Draft", value: draft },
          //   { label: "In Progress", value: inProgress },
          //   { label: "Completed", value: completed },
          // ]}
        />
      </div>

      {/* Controls (more visible + elevated) */}
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
                // ✅ clearer zebra
                const zebra = idx % 2 === 0 ? "bg-white" : "bg-indigo-50/35";

                const canPickProgress = x.status === "IN_PROGRESS";

                return (
                  <tr
                    key={x.id}
                    className={[
                      "border-t border-slate-100",
                      zebra,
                      "hover:bg-indigo-50/60 transition-colors",
                    ].join(" ")}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={(list?.page ?? page) <= 1}
            >
              Prev
            </OutlineButton>
            <OutlineButton
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
