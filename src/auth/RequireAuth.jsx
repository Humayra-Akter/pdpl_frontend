import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-700">
        <div className="rounded-xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200">
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles?.length && !roles.includes(user.role)) {
    // you can send them to their own dashboard
    const fallback =
      user.role === "ADMIN" ? "/admin" : user.role === "DPO" ? "/dpo" : "/user";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
