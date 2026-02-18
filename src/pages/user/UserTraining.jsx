// src/pages/user/UserTraining.jsx
import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { listMyTrainings } from "../../lib/user";

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
  const cls =
    v === "COMPLETED"
      ? "bg-emerald-100 text-emerald-800"
      : v === "IN_PROGRESS"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-700";

  return (
    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", cls)}>
      {value || "Not Started"}
    </span>
  );
}

function EndpointMissing() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
      <div>
        <div className="text-slate-700 font-semibold">
          Training not connected
        </div>
        <div className="text-xs text-slate-500">
          Endpoint missing — showing placeholder UI.
        </div>
      </div>
    </div>
  );
}

export default function UserTraining() {
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [items, setItems] = useState([]);

  async function load() {
    setLoading(true);
    const res = await listMyTrainings();
    setMissing(!!res.missing);
    setItems(res.ok ? res.data?.items || res.data || [] : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const placeholder = [
    {
      id: "p1",
      title: "Privacy Awareness Training",
      status: "Not Started",
      dueDate: null,
    },
    {
      id: "p2",
      title: "Incident Reporting Basics",
      status: "In Progress",
      dueDate: null,
    },
    {
      id: "p3",
      title: "Handling Vendor Data",
      status: "Completed",
      dueDate: null,
    },
  ];

  const list = missing ? placeholder : items;

  return (
    <div className="space-y-4">
      <SoftCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-800">
              Privacy Training
            </div>
            <div className="text-sm text-slate-500 mt-1">
              Complete mandatory training modules. Status and due dates will
              appear here.
            </div>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </SoftCard>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Left list */}
        <SoftCard className="p-5">
          {missing && (
            <div className="mb-4">
              <EndpointMissing />
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              No trainings assigned.
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">
                        {t.title || t.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Due:{" "}
                        {t.dueDate
                          ? new Date(t.dueDate).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                    <Badge value={t.status} />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      disabled
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400"
                    >
                      Open module (placeholder)
                    </button>
                    <button
                      disabled
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400"
                    >
                      Take quiz (placeholder)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SoftCard>

        {/* Right side explanation */}
        <SoftCard className="p-5 bg-slate-50">
          <div className="text-sm font-semibold text-slate-700">
            Why this matters
          </div>
          <div className="mt-2 text-sm text-slate-600 leading-relaxed">
            Training helps reduce incidents and improves your response to
            privacy requests. Complete modules before due date to maintain
            compliance.
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Common topics</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li>• Personal data basics</li>
              <li>• Incident identification</li>
              <li>• Vendor & third-party handling</li>
              <li>• Data subject rights</li>
            </ul>
          </div>
        </SoftCard>
      </div>
    </div>
  );
}
