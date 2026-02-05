import { useAuth } from "../auth/AuthProvider";

export default function Dpo() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm text-slate-500">PDPL Secure Portal</div>
            <div className="text-lg font-semibold">DPO Dashboard</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold">{user?.fullName}</div>
              <div className="text-xs text-slate-500">
                {user?.email} · {user?.role}
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-lg font-semibold">DPO Work Queue (next)</div>
          <p className="mt-2 text-slate-600">
            We’ll add: approvals, review requests, assign/return, and audit
            actions.
          </p>
        </div>
      </main>
    </div>
  );
}
