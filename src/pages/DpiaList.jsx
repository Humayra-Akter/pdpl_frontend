import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDpia, listDpia } from "../lib/admin";

export default function DpiaList() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
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

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-slate-500">DPIA Assessment</div>
        <div className="text-2xl font-semibold text-slate-900">
          Data Privacy Impact Assessments
        </div>
      </div>

      <div className="rounded-2xl shadow-md bg-white p-4 ring-1 ring-slate-200 space-y-3">
        <div className="text-sm font-semibold text-slate-900">
          Create new DPIA
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            className="w-full md:w-[420px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g., DPIA for Customer Onboarding"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            onClick={onCreate}
            disabled={creating}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create"}
          </button>
          <button
            onClick={load}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
          >
            Refresh
          </button>
        </div>

        {err ? <div className="text-sm text-red-600">{err}</div> : null}
      </div>

      <div className="rounded-2xl shadow-md bg-white p-4 ring-1 ring-slate-200">
        <div className="text-sm font-semibold text-slate-900 mb-3">Recent DPIAs</div>
        <hr className="border-slate-300" />

        {loading ? (
          <div className="mt-3 text-sm text-slate-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="mt-3 text-sm text-slate-600">
            No DPIAs yet. Create one above.
          </div>
        ) : (
          <div className="mt-3 divide-y">
            {items.map((x) => (
              <button
                key={x.id}
                onClick={() => nav(`/admin/dpia/${x.id}`)}
                className="w-full text-left py-3 hover:bg-slate-50 rounded-xl px-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {x.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      Status: {x.status} • Progress: {x.progress}%
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">Open →</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
