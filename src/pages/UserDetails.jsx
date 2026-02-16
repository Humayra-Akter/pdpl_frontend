import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUser } from "../lib/admin";

function Badge({ tone = "slate", children }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    indigo: "bg-indigo-50 text-indigo-800 ring-indigo-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    rose: "bg-rose-50 text-rose-800 ring-rose-200",
  };
  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
        tones[tone] || tones.slate,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function roleTone(role) {
  if (role === "ADMIN") return "indigo";
  if (role === "DPO") return "amber";
  return "slate";
}
function statusTone(status) {
  return status === "ACTIVE" ? "emerald" : "rose";
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

export default function UserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await getUser(id);
        if (!alive) return;
        setUser(res?.user || null);
      } catch (e) {
        if (!alive) return;
        setErr(e?.error || e?.message || "Failed to load user");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-500">
              User Management
            </div>
            <div className="mt-1 text-3xl font-black text-slate-900">
              User Details
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-600">
              Profile fields only • audit-friendly • passwordHash never returned
            </div>
          </div>

          <Link
            to="/admin/users"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
          >
            ← Back
          </Link>
        </div>
      </div>

      {err ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {err}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        {loading ? (
          <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />
        ) : !user ? (
          <div className="text-sm font-semibold text-slate-600">
            No user found.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  {user.fullName}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-600">
                  {user.email}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={roleTone(user.role)}>{user.role}</Badge>
                <Badge tone={statusTone(user.status)}>{user.status}</Badge>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-extrabold text-slate-700">
                  Created
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  {formatDateTime(user.createdAt)}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-extrabold text-slate-700">
                  Updated
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  {formatDateTime(user.updatedAt)}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-extrabold text-slate-700">
                customFields
              </div>
              <pre className="mt-2 overflow-auto rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
                {JSON.stringify(user.customFields || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
