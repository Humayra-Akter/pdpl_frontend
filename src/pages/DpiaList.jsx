import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { createDpia, listDpia, deleteDpia } from "../lib/admin";

function fmtDate(v) {
  try {
    if (!v) return "—";
    return new Date(v).toLocaleString();
  } catch {
    return "—";
  }
}

function statusPillClass(status = "DRAFT") {
  const map = {
    DRAFT: "bg-slate-100 text-slate-800 ring-slate-200",
    IN_PROGRESS: "bg-amber-100 text-amber-900 ring-amber-200",
    IN_REVIEW: "bg-indigo-100 text-indigo-900 ring-indigo-200",
    NEED_INFO: "bg-orange-100 text-orange-900 ring-orange-200",
    REJECTED: "bg-rose-100 text-rose-900 ring-rose-200",
    SUBMITTED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    COMPLETED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    APPROVED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  };
  return map[status] || map.DRAFT;
}

function ProgressBar({ value = 0 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const tone =
    v >= 100
      ? "bg-emerald-600"
      : v >= 60
        ? "bg-indigo-600"
        : v >= 30
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

export default function DpiaList() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await listDpia({ page: 1, pageSize: 50 });
      setItems(res.items || []);
    } catch (e) {
      setErr(e?.message || "Failed to load DPIA list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate() {
    if (!title.trim()) {
      setErr("Please enter a title");
      return;
    }
    setCreating(true);
    setErr("");
    try {
      const res = await createDpia({ title: title.trim() });
      const id = res?.dpia?.id;
      if (!id) throw new Error("Backend did not return dpia.id");
      setTitle("");
      nav(`/admin/dpia/${id}`);
    } catch (e) {
      setErr(e?.message || "Failed to create DPIA");
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((x) => (x.title || "").toLowerCase().includes(term));
  }, [items, q]);

  async function onDelete(item) {
    const ok = window.confirm(
      `Delete this DPIA?\n\n"${item.title || "Untitled DPIA"}"\n\nThis cannot be undone.`,
    );
    if (!ok) return;

    try {
      setErr("");
      await deleteDpia(item.id);

      // remove from UI instantly
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch (e) {
      setErr(e?.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-500">DPIA Assessment</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                Data Privacy Impact Assessments
              </div>
              <div className="mt-1 text-sm text-slate-600 max-w-2xl">
                Table view for faster scanning. Search, open, and manage DPIAs.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>

              <button
                onClick={onCreate}
                disabled={creating || !title.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {creating ? "Creating..." : "Create DPIA"}
              </button>
            </div>
          </div>

          {/* Create + Search row */}
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-slate-900">
                Create new DPIA
              </div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="e.g., DPIA for Customer Onboarding"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-900">Search</div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm font-medium outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="Search by title..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-600">
                {loading ? "Loading…" : `${filtered.length} item(s)`}
              </div>
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
              {err}
            </div>
          ) : null}
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-600" />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Recent DPIAs
            </div>
            <div className="text-xs text-slate-500">
              Scan quickly. Click Open to continue.
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="border-t border-slate-200">
                <th className="text-left font-semibold px-5 py-3">Title</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
                <th className="text-left font-semibold px-5 py-3">Progress</th>
                <th className="text-left font-semibold px-5 py-3">
                  Last Updated
                </th>
                <th className="text-right font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
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
                      <div className="h-4 w-40 bg-slate-100 rounded" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-8 w-32 bg-slate-100 rounded-xl ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10">
                    <div className="rounded-xl bg-slate-50 p-6 ring-1 ring-slate-200">
                      <div className="text-sm font-semibold text-slate-900">
                        No DPIAs found
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Try a different search, or create a new DPIA above.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((x, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-slate-50/40";
                  const status = x.status || "DRAFT";
                  const progress = Number(x.progress ?? 0) || 0;

                  return (
                    <tr key={x.id} className={rowBg}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 max-w-[420px] truncate">
                          {x.title || "Untitled DPIA"}
                        </div>
                        <div className="text-xs text-slate-500">ID: {x.id}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                            statusPillClass(status),
                          ].join(" ")}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <ProgressBar value={progress} />
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {fmtDate(x.updatedAt || x.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Delete is intentionally disabled until backend supports it */}
                          <button
                            onClick={() => onDelete(x)}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>

                          <button
                            onClick={() => nav(`/admin/dpia/${x.id}`)}
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            Open →
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

      </div>
    </div>
  );
}
