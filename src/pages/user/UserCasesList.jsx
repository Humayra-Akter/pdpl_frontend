// src/pages/user/UserCasesList.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { listMyCases, createMyCase } from "../../lib/user";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function SoftCard({ className = "", children }) {
  return (
    <div
      className={cn("rounded-xl border border-slate-200 bg-white", className)}
    >
      {children}
    </div>
  );
}

function Badge({ value }) {
  const v = String(value || "").toUpperCase();
  const cls = ["CLOSED", "COMPLETED", "DONE", "RESOLVED"].includes(v)
    ? "bg-emerald-100 text-emerald-800"
    : ["OPEN", "PENDING", "IN_PROGRESS", "REVIEW"].includes(v)
      ? "bg-amber-100 text-amber-800"
      : ["REJECTED", "CANCELLED", "BLOCKED"].includes(v)
        ? "bg-rose-100 text-rose-800"
        : "bg-slate-100 text-slate-700";

  return (
    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", cls)}>
      {value || "—"}
    </span>
  );
}

function EndpointMissing({ label }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
      <div>
        <div className="text-slate-700 font-semibold">
          {label} not connected
        </div>
        <div className="text-xs text-slate-500">
          Endpoint missing — showing placeholder UI.
        </div>
      </div>
    </div>
  );
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-base font-semibold text-slate-800">
            Create request
          </div>
          <div className="text-sm text-slate-500 mt-1">
            Quick create (you can add more later).
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {missing && <EndpointMissing label="Create request" />}
          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {err}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <div className="text-xs text-slate-500 mb-1">Type *</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="DSR">DSR</option>
                <option value="INCIDENT">Incident</option>
                <option value="VENDOR">Vendor</option>
                <option value="QUESTION">Privacy question</option>
              </select>
            </label>

            <label className="text-sm">
              <div className="text-xs text-slate-500 mb-1">Title *</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                placeholder="Short title"
              />
            </label>
          </div>

          <label className="text-sm block">
            <div className="text-xs text-slate-500 mb-1">Description *</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              placeholder="Describe your request"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
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
              "rounded-xl px-4 py-2 text-sm font-semibold text-white",
              !canSubmit || submitting
                ? "bg-slate-300"
                : "bg-blue-600 hover:bg-blue-700",
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
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

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
    "OPEN",
    "IN_PROGRESS",
    "PENDING",
    "COMPLETED",
    "CLOSED",
  ];

  async function load() {
    setLoading(true);
    const res = await listMyCases();
    setMissing(!!res.missing);
    setItems(res.ok ? res.data?.items || res.data || [] : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <SoftCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-800">
              My Requests
            </div>
            <div className="text-sm text-slate-500 mt-1">
              Search and filter your requests. Click a row to open details.
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
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>
        </div>

        {/* Filters (segmented like figma) */}
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_200px_200px]">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
              placeholder="Search by title…"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
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
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            >
              {statusOptions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SoftCard>

      {/* Table */}
      <SoftCard className="overflow-hidden">
        <div className="grid grid-cols-5 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
          <div className="col-span-2">Title</div>
          <div>Type</div>
          <div>Status</div>
          <div>Updated</div>
        </div>

        {missing ? (
          <div className="p-4">
            <EndpointMissing label="List cases" />
          </div>
        ) : loading ? (
          <div className="p-4 space-y-2">
            <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="text-base font-semibold text-slate-800">
                No requests yet
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Create a request to start a conversation with the privacy team.
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create request
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((x) => (
              <button
                key={x.id}
                onClick={() => navigate(`/user/cases/${x.id}`)}
                className="grid w-full grid-cols-5 gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <div className="col-span-2 min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-700">
                    {x.title}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {x.description || "—"}
                  </div>
                </div>
                <div className="text-sm text-slate-600">{x.type || "—"}</div>
                <div className="text-sm">
                  <Badge value={x.status} />
                </div>
                <div className="text-sm text-slate-600">
                  {x.updatedAt ? new Date(x.updatedAt).toLocaleString() : "—"}
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
