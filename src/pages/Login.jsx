import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { apiPost } from "../lib/api";

function EyeIcon({ open }) {
  // minimal inline icon (no extra deps)
  return open ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M2.3 12s3.4-7 9.7-7 9.7 7 9.7 7-3.4 7-9.7 7S2.3 12 2.3 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.7a2.5 2.5 0 0 0 3.4 3.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M2.3 12s3.4-7 9.7-7c2 0 3.8.7 5.3 1.7M21.7 12s-3.4 7-9.7 7c-2 0-3.8-.7-5.3-1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState("admin@pdpl.local");
  const [password, setPassword] = useState("Admin@123");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () => email.trim() && password.trim(),
    [email, password],
  );

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;

    try {
      setLoading(true);
      const data = await apiPost("/auth/login", { email, password });

      // store token + user

      localStorage.setItem("pdpl_token", data.token);
      localStorage.setItem("pdpl_user", JSON.stringify(data.user));

      // redirect by role (backend already sends redirectTo)
      window.location.href = data.redirectTo || "/user";
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="absolute -bottom-40 right-0 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.12),transparent_45%),radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.12),transparent_45%)]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-2">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M8.8 12.2l2 2 4.4-4.6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">
                PDPL Secure Portal
              </div>
              <div className="text-sm text-white/60">
                Compliance & privacy operations
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Privacy governance,{" "}
              <span className="text-cyan-300">made operational</span>.
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70">
              Centralize DPIA, RoPA, Gap Assessments, policies and incident
              workflows — with role-based approvals and audit trails.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Role-based access",
                desc: "Admin, DPO, User dashboards",
              },
              { title: "Audit-ready", desc: "Actions tracked end-to-end" },
              { title: "Secure uploads", desc: "Evidence, reports, exports" },
              {
                title: "PDPL aligned",
                desc: "Processes designed for compliance",
              },
            ].map((x) => (
              <motion.div
                key={x.title}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur"
              >
                <div className="text-sm font-semibold">{x.title}</div>
                <div className="mt-1 text-sm text-white/60">{x.desc}</div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
            <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
              ISO 27001-ready
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
              SOC 2 practices
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
              PDPL workflows
            </span>
          </div>
        </motion.div>

        {/* Right */}
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="rounded-xl bg-white/6 p-8 ring-1 ring-white/12 backdrop-blur">
            <div className="mb-6">
              <div className="text-2xl font-semibold tracking-tight">
                Welcome back
              </div>
              <div className="mt-1 text-sm text-white/60">
                Sign in with your organization credentials.
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-white/70">Email</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-sm text-white/70">Password</label>

                <div className="relative mt-2">
                  <input
                    type={showPass ? "text" : "password"}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm outline-none placeholder:text-white/35 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-white/10"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm text-cyan-300 hover:text-cyan-200"
                >
                  Forgot password?
                </button>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-400 px-4 py-3 text-sm font-semibold text-slate-900 hover:opacity-95 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <div className="rounded-xl bg-white/5 p-4 text-xs text-white/60 ring-1 ring-white/10">
                By signing in, you agree to your organization’s data protection
                policies and usage monitoring for compliance.
              </div>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-white/45">
            © {new Date().getFullYear()} Your Company · PDPL Compliance Portal
          </div>
        </motion.div>
      </div>
    </div>
  );
}
