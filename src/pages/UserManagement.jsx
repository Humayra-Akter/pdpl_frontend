// src/pages/UserManagement.jsx
import { useEffect, useMemo, useState } from "react";
import {
  listUsers,
  usersSummary,
  createUser,
  updateUser,
  resetUserPassword,
  deactivateUser,
  activateUser,
} from "../lib/admin";
import { api } from "../lib/http";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Download,
  BarChart3,
  FileDown,
  Pencil,
  KeyRound,
  Power,
  Eye,
  Users as UsersIcon,
  ShieldCheck,
  UserCog,
  BadgeCheck,
  X,
} from "lucide-react";

/**
 * ✅ KPI updated to colorful + interactive (Incidents-style)
 * ✅ No black / no extra-bold (font-medium / font-semibold only)
 * ✅ rounded-xl everywhere
 * ✅ Tabs before table: ALL / ADMIN / USER / DPO
 * ✅ No refresh button
 * ✅ Top-right: 4 buttons in 2x2 grid
 * ✅ Analytics navigates to /admin/users/analytics
 */

const ROLES = [
  { value: "ALL", label: "All roles" },
  { value: "ADMIN", label: "ADMIN" },
  { value: "DPO", label: "DPO" },
  { value: "USER", label: "USER" },
];

const STATUSES = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "INACTIVE", label: "INACTIVE" },
];

const SORTS = [
  { label: "Newest", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Oldest", sortBy: "createdAt", sortOrder: "asc" },
  { label: "Name A → Z", sortBy: "fullName", sortOrder: "asc" },
  { label: "Name Z → A", sortBy: "fullName", sortOrder: "desc" },
  { label: "Email A → Z", sortBy: "email", sortOrder: "asc" },
  { label: "Email Z → A", sortBy: "email", sortOrder: "desc" },
];

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function safeNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function pctOf(value, total) {
  const t = Math.max(1, safeNumber(total, 0));
  const v = Math.max(0, safeNumber(value, 0));
  return Math.round((v / t) * 100);
}

// Date format: 2-February-2026
function formatDateLong(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = d.toLocaleString(undefined, { month: "long" });
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatDateTimeLong(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = d.toLocaleString(undefined, { month: "long" });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day}-${month}-${year} • ${time}`;
}

function roleTone(role) {
  if (role === "ADMIN") return "indigo";
  if (role === "DPO") return "amber";
  return "slate";
}
function statusTone(status) {
  return status === "ACTIVE" ? "emerald" : "rose";
}

function Badge({ tone = "slate", children }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <span
      className={cn(
        "inline-flex min-w-[86px] items-center justify-center rounded-full px-3 py-1 text-xs font-medium ring-1",
        tones[tone] || tones.slate,
      )}
    >
      {children}
    </span>
  );
}

/* =========================
   ✅ KPI (Incidents-style)
   ========================= */

function KpiCard({
  label,
  subtitle,
  value,
  percent,
  tone = "sky",
  icon: Icon,
  onClick,
}) {
  const tones = {
    sky: {
      wrap: "border-sky-200 bg-sky-50/60 hover:bg-sky-50 bg-gradient-to-tl from-sky-50 to-sky-200/80 ring-indigo-200 hover:border-sky-300",
      pill: "bg-sky-100 text-sky-700 ring-sky-200",
      bar: "bg-sky-600",
      pct: "text-sky-700",
    },
    amber: {
      wrap: "border-amber-200 bg-amber-50/60 hover:bg-amber-50 bg-gradient-to-tl from-amber-50 to-yellow-200/80 ring-amber-300 hover:border-amber-300",
      pill: "bg-amber-100 text-amber-700 ring-amber-200",
      bar: "bg-amber-600",
      pct: "text-amber-700",
    },
    indigo: {
      wrap: "border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 bg-gradient-to-tl from-indigo-50 to-indigo-200/80 ring-indigo-300 hover:border-indigo-300",
      pill: "bg-indigo-100 text-indigo-700 ring-indigo-200",
      bar: "bg-indigo-600",
      pct: "text-indigo-700",
    },
    rose: {
      wrap: "border-rose-200 bg-rose-50/60 hover:bg-rose-50 bg-gradient-to-tl from-rose-50 to-rose-200/80 ring-rose-300 hover:border-rose-300",
      pill: "bg-rose-100 text-rose-700 ring-rose-200",
      bar: "bg-rose-600",
      pct: "text-rose-700",
    },
    emerald: {
      wrap: "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 bg-gradient-to-tl from-emerald-50 to-emerald-200/80 ring-emerald-300 hover:border-emerald-300",
      pill: "bg-emerald-100 text-emerald-700 ring-emerald-200",
      bar: "bg-emerald-600",
      pct: "text-emerald-700",
    },
  };

  const t = tones[tone] || tones.sky;
  const p = Math.max(0, Math.min(100, safeNumber(percent, 0)));

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "w-full rounded-xl border p-4 text-left shadow-md transition-all",
        "hover:shadow-lg hover:-translate-y-[1px]",
        "focus:outline-none focus:ring-4 focus:ring-indigo-100",
        onClick ? "cursor-pointer" : "cursor-default",
        t.wrap,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          <div className="mt-1 text-sm font-medium text-slate-600">
            {subtitle}
          </div>
        </div>

        {Icon ? (
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl ring-1",
              t.pill,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-3xl font-semibold text-slate-900">{value}</div>
        <div className={cn("text-sm font-semibold", t.pct)}>{p}% of total</div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-xl bg-white/70 ring-1 ring-slate-200">
        <div
          className={cn("h-2 rounded-xl", t.bar)}
          style={{ width: `${p}%` }}
        />
      </div>
    </button>
  );
}

function KpiRow({ kpis, onPick }) {
  const total = safeNumber(kpis?.totalUsers, 0);
  const active = safeNumber(kpis?.activeUsers, 0);
  const inactive = safeNumber(kpis?.inactiveUsers, 0);
  const admins = safeNumber(kpis?.adminsCount, 0);
  const dpo = safeNumber(kpis?.dpoCount, 0);

  const cards = [
    {
      key: "TOTAL",
      label: "Total",
      subtitle: "All users",
      value: total,
      percent: 100,
      tone: "sky",
      icon: UsersIcon,
    },
    {
      key: "ACTIVE",
      label: "Active",
      subtitle: "Can log in",
      value: active,
      percent: pctOf(active, total),
      tone: "emerald",
      icon: ShieldCheck,
    },
    {
      key: "INACTIVE",
      label: "Inactive",
      subtitle: "Soft deactivated",
      value: inactive,
      percent: pctOf(inactive, total),
      tone: "rose",
      icon: Power,
    },
    {
      key: "ADMINS",
      label: "Admins",
      subtitle: "Full access",
      value: admins,
      percent: pctOf(admins, total),
      tone: "indigo",
      icon: UserCog,
    },
    {
      key: "DPO",
      label: "DPO",
      subtitle: "Read-only",
      value: dpo,
      percent: pctOf(dpo, total),
      tone: "amber",
      icon: BadgeCheck,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <KpiCard
          key={c.key}
          label={c.label}
          subtitle={c.subtitle}
          value={c.value}
          percent={c.percent}
          tone={c.tone}
          icon={c.icon}
          onClick={onPick ? () => onPick(c.key) : undefined}
        />
      ))}
    </div>
  );
}

/* =========================
   Modals / Drawer (unchanged)
   ========================= */

function Modal({ open, title, subtitle, children, footer, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 p-5">
            <div className="text-base font-semibold text-slate-900">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 text-sm font-medium text-slate-600">
                {subtitle}
              </div>
            ) : null}
          </div>
          <div className="p-5">{children}</div>
          {footer ? (
            <div className="border-t border-slate-200 p-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        {hint ? (
          <div className="text-xs font-medium text-slate-500">{hint}</div>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
      {error ? (
        <div className="mt-1 text-xs font-medium text-rose-600">{error}</div>
      ) : null}
    </div>
  );
}

function Confirm({
  open,
  title,
  message,
  confirmText = "Confirm",
  tone = "rose",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  const btnTone =
    tone === "rose"
      ? "bg-rose-600 hover:bg-rose-700"
      : tone === "amber"
        ? "bg-amber-600 hover:bg-amber-700"
        : "bg-indigo-600 hover:bg-indigo-700";

  return (
    <Modal
      open={open}
      title={title}
      subtitle={message}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium text-white",
              btnTone,
            )}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
        {message}
      </div>
    </Modal>
  );
}

function PasswordReveal({ value, onClose }) {
  if (!value) return null;
  return (
    <Modal
      open
      title="Temporary Password"
      subtitle="Copy this now. It will not be shown again."
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            type="button"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="text-xs font-semibold text-indigo-900">
          TEMP PASSWORD
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-indigo-100">
          <div className="select-all text-sm font-semibold text-slate-800">
            {value}
          </div>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(value);
              alert("Copied!");
            }}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
            type="button"
          >
            Copy
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UserEditorModal({ open, mode, initial, canWrite, onClose, onSaved }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [status, setStatus] = useState("ACTIVE");
  const [password, setPassword] = useState("");
  const [customFields, setCustomFields] = useState("{}");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSaving(false);

    if (mode === "edit" && initial) {
      setFullName(initial.fullName || "");
      setEmail(initial.email || "");
      setRole(initial.role || "USER");
      setStatus(initial.status || "ACTIVE");
      setPassword("");
      setCustomFields(JSON.stringify(initial.customFields || {}, null, 2));
      return;
    }

    setFullName("");
    setEmail("");
    setRole("USER");
    setStatus("ACTIVE");
    setPassword("");
    setCustomFields("{}");
  }, [open, mode, initial]);

  function validate() {
    const e = {};
    if (!fullName.trim()) e.fullName = "Full name is required.";

    if (mode === "create") {
      if (!email.trim()) e.email = "Email is required.";
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        e.email = "Invalid email format.";
    }

    try {
      const v = JSON.parse(customFields || "{}");
      if (v === null || Array.isArray(v) || typeof v !== "object")
        e.customFields = "customFields must be a JSON object.";
    } catch {
      e.customFields = "customFields must be valid JSON.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!canWrite) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const cf = JSON.parse(customFields || "{}");

      if (mode === "create") {
        const res = await createUser({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          role,
          status,
          password: password.trim() ? password.trim() : undefined,
          customFields: cf,
        });
        onSaved(res);
      } else {
        const res = await updateUser(initial.id, {
          fullName: fullName.trim(),
          role,
          status,
          customFields: cf,
        });
        onSaved(res);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Create User" : "Edit User"}
      subtitle={
        mode === "create"
          ? "Add a new account to the portal"
          : "Update role/status/profile safely"
      }
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canWrite || saving}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            type="button"
          >
            {saving ? "Saving..." : mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      }
    >
      {!canWrite ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          DPO access is read-only. User creation/editing is disabled.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full Name" error={errors.fullName}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        </Field>

        <Field
          label="Email"
          hint={mode === "edit" ? "Email cannot be changed here" : ""}
          error={errors.email}
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mode === "edit"}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
          />
        </Field>

        <Field label="Role">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="DPO">DPO</option>
            <option value="USER">USER</option>
          </select>
        </Field>

        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </Field>

        {mode === "create" ? (
          <div className="md:col-span-2">
            <Field
              label="Password (optional)"
              hint="Leave empty to auto-generate temp password"
            >
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </Field>
          </div>
        ) : null}

        <div className="md:col-span-2">
          <Field label="customFields (JSON)" error={errors.customFields}>
            <textarea
              value={customFields}
              onChange={(e) => setCustomFields(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function UserDetailsDrawer({
  open,
  user,
  canWrite,
  isMe,
  onClose,
  onEdit,
  onReset,
  onDeactivate,
  onActivate,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-500">
                User profile
              </div>
              <div className="mt-1 truncate text-lg font-semibold text-slate-900">
                {user?.fullName || "—"}
              </div>
              <div className="mt-1 truncate text-sm font-medium text-slate-600">
                {user?.email || "—"}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={roleTone(user?.role)}>{user?.role || "—"}</Badge>
                <Badge tone={statusTone(user?.status)}>
                  {user?.status || "—"}
                </Badge>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              type="button"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="h-[calc(100%-88px)] overflow-y-auto p-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-600">Created</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {formatDateTimeLong(user?.createdAt)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-600">Updated</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {formatDateTimeLong(user?.updatedAt)}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium text-slate-600">
              customFields
            </div>
            <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-800 ring-1 ring-slate-200">
              {JSON.stringify(user?.customFields || {}, null, 2)}
            </pre>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium text-slate-600 mb-3">
              Actions
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onEdit}
                disabled={!canWrite}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                type="button"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>

              <button
                onClick={onReset}
                disabled={!canWrite}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                type="button"
              >
                <KeyRound className="h-4 w-4" />
                Reset
              </button>

              {user?.status === "ACTIVE" ? (
                <button
                  onClick={onDeactivate}
                  disabled={!canWrite || isMe}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  type="button"
                  title={isMe ? "You cannot deactivate yourself" : ""}
                >
                  <Power className="h-4 w-4" />
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={onActivate}
                  disabled={!canWrite}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                  type="button"
                >
                  <Power className="h-4 w-4" />
                  Activate
                </button>
              )}
            </div>

            {!canWrite ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                DPO access is read-only (backend enforces).
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** CSV export for current page rows */
function exportCsv(filename, rows) {
  const esc = (v) => {
    const s = v === undefined || v === null ? "" : String(v);
    const needs = /[",\n]/.test(s);
    return needs ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const headers = ["fullName", "email", "role", "status", "createdAt"];
  const csv = [
    headers.join(","),
    ...(rows || []).map((r) =>
      [
        esc(r.fullName),
        esc(r.email),
        esc(r.role),
        esc(r.status),
        esc(formatDateLong(r.createdAt)),
      ].join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function UserManagement() {
  const navigate = useNavigate();

  // auth/me
  const [me, setMe] = useState({ id: null, role: null });
  const canWrite = me.role === "ADMIN";

  // server data
  const [kpis, setKpis] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // UI inputs (not auto-firing)
  const [qInput, setQInput] = useState("");
  const [roleInput, setRoleInput] = useState("ALL");
  const [statusInput, setStatusInput] = useState("ALL");
  const [sortKey, setSortKey] = useState(0);

  // applied filters
  const [filters, setFilters] = useState({ q: "", role: "ALL", status: "ALL" });

  // Tabs before table
  const [tab, setTab] = useState("ALL"); // ALL | ADMIN | USER | DPO

  const sort = SORTS[sortKey];
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [editing, setEditing] = useState(null);

  // confirms
  const [confirmReset, setConfirmReset] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  // temp password
  const [revealPassword, setRevealPassword] = useState("");

  // details drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState(null);

  async function loadMe() {
    try {
      const res = await api("/auth/me");
      setMe({ id: res?.user?.id || null, role: res?.user?.role || null });
    } catch {
      setMe({ id: null, role: null });
    }
  }

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const tabRole = tab !== "ALL" ? tab : "ALL";

      const roleEffective =
        tabRole !== "ALL"
          ? tabRole
          : filters.role !== "ALL"
            ? filters.role
            : "ALL";

      const [sum, list] = await Promise.all([
        usersSummary(),
        listUsers({
          page,
          pageSize,
          q: filters.q?.trim() ? filters.q.trim() : undefined,
          role: roleEffective !== "ALL" ? roleEffective : undefined,
          status: filters.status !== "ALL" ? filters.status : undefined,
          sortBy: sort.sortBy,
          sortOrder: sort.sortOrder,
        }),
      ]);

      setKpis(sum?.kpis || null);
      setItems(list?.items || []);
      setTotal(list?.total || 0);
    } catch (e) {
      setErr(e?.error || e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortKey, filters.role, filters.status, filters.q, tab]);

  function applyFilters() {
    setPage(1);
    setFilters({ q: qInput, role: roleInput, status: statusInput });
  }

  async function handleCreatedOrUpdated(res) {
    setEditorOpen(false);
    setEditing(null);
    if (res?.tempPassword) setRevealPassword(res.tempPassword);
    await load();
  }

  async function doResetPassword(id) {
    setConfirmReset(null);
    try {
      const res = await resetUserPassword(id);
      if (res?.tempPassword) setRevealPassword(res.tempPassword);
      await load();
    } catch (e) {
      setErr(e?.error || e?.message || "Failed to reset password");
    }
  }

  async function doDeactivate(id) {
    setConfirmDeactivate(null);
    try {
      await deactivateUser(id);
      await load();
    } catch (e) {
      setErr(e?.error || e?.message || "Failed to deactivate user");
    }
  }

  async function doActivate(u) {
    try {
      // await updateUser(u.id, {
      //   fullName: u.fullName,
      //   role: u.role,
      //   status: "ACTIVE",
      //   customFields: u.customFields || {},
      // });
      await activateUser(u.id);
      await load();
    } catch (e) {
      setErr(e?.error || e?.message || "Failed to activate user");
    }
  }

  function openDrawer(u) {
    setDrawerUser(u);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setDrawerUser(null);
  }

  function openEdit(u) {
    setEditorMode("edit");
    setEditing(u);
    setEditorOpen(true);
  }

  // ✅ KPI click behavior: quick filtering
  function onPickKpi(key) {
    setPage(1);

    if (key === "TOTAL") {
      setTab("ALL");
      setRoleInput("ALL");
      setStatusInput("ALL");
      setFilters((f) => ({ ...f, role: "ALL", status: "ALL" }));
      return;
    }

    if (key === "ADMINS") {
      setTab("ADMIN");
      return;
    }
    if (key === "DPO") {
      setTab("DPO");
      return;
    }

    if (key === "ACTIVE") {
      setStatusInput("ACTIVE");
      setFilters((f) => ({ ...f, status: "ACTIVE" }));
      return;
    }
    if (key === "INACTIVE") {
      setStatusInput("INACTIVE");
      setFilters((f) => ({ ...f, status: "INACTIVE" }));
      return;
    }
  }

  const exportRows = items;
  const exportFilenameBase = `users_${tab.toLowerCase()}_${Date.now()}`;

  return (
    <div className="space-y-5">
      {/* Header + top-right 2x2 buttons */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Admin Module
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                User Management
              </div>
              <div className="mt-2 max-w-2xl text-sm font-medium text-slate-600">
                Manage users safely • DPO read-only • audit-friendly •
                passwordHash never exposed
              </div>
            </div>

            {/* 2x2 grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setEditorMode("create");
                  setEditing(null);
                  setEditorOpen(true);
                }}
                disabled={!canWrite}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>

              <button
                onClick={() =>
                  exportCsv(`${exportFilenameBase}.csv`, exportRows)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                type="button"
              >
                <FileDown className="h-4 w-4" />
                Export CSV
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                type="button"
                title="Print / Save as PDF"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>

              <button
                onClick={() => navigate("/admin/users/analytics")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                type="button"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 flex gap-2">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              >
                {SORTS.map((s, idx) => (
                  <option key={s.label} value={idx}>
                    {s.label}
                  </option>
                ))}
              </select>

              <button
                onClick={applyFilters}
                className="h-11 shrink-0 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
                type="button"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-600" />
      </div>

      {err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
          {err}
        </div>
      ) : null}

      {/* ✅ Colorful KPI row (replaces kpiLite strip) */}
      <div className="mt-5">
        <KpiRow kpis={kpis} onPick={onPickKpi} />
      </div>
      {/* Tabs BEFORE table */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {[
            { key: "ALL", label: "All users" },
            { key: "ADMIN", label: "Admin" },
            { key: "USER", label: "User" },
            { key: "DPO", label: "DPO" },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-50",
                )}
                type="button"
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="text-sm font-medium text-slate-600">
          {total} user(s)
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">Users</div>
            <div className="mt-0.5 text-xs font-medium text-slate-600">
              {total} record(s) • soft deactivation supported
            </div>
          </div>
          <div className="text-xs font-medium text-slate-600">
            Page {page} / {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-sm font-medium text-slate-600">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-center">Role</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-center">Created</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-5 py-4" colSpan={5}>
                      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : items.length ? (
                items.map((u) => {
                  const isMe = me.id && u.id === me.id;
                  const canMutate = canWrite;

                  return (
                    <tr
                      key={u.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {u.fullName}
                          </div>
                          <div className="mt-0.5 truncate text-xs font-medium text-slate-600">
                            {u.email}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                      </td>

                      <td className="px-5 py-4 text-center text-sm font-medium text-slate-700">
                        {formatDateLong(u.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-wrap items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setDrawerUser(u);
                              setDrawerOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            type="button"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>

                          <button
                            onClick={() => openEdit(u)}
                            disabled={!canMutate}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            type="button"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            onClick={() => setConfirmReset(u)}
                            disabled={!canMutate}
                            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                            type="button"
                          >
                            <KeyRound className="h-4 w-4" />
                            Reset
                          </button>

                          {u.status === "ACTIVE" ? (
                            <button
                              onClick={() => setConfirmDeactivate(u)}
                              disabled={!canMutate || isMe}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                              type="button"
                              title={
                                isMe ? "You cannot deactivate yourself" : ""
                              }
                            >
                              <Power className="h-4 w-4" />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => doActivate(u)}
                              disabled={!canMutate}
                              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                              type="button"
                            >
                              <Power className="h-4 w-4" />
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10">
                    <div className="text-sm font-semibold text-slate-900">
                      No users found
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-600">
                      Try clearing filters or create a new user.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <div className="text-xs font-medium text-slate-600">
            {total ? (
              <>
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, total)} of {total}
              </>
            ) : (
              "Showing 0 of 0"
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              type="button"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserEditorModal
        open={editorOpen}
        mode={editorMode}
        initial={editing}
        canWrite={canWrite}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onSaved={handleCreatedOrUpdated}
      />

      <Confirm
        open={Boolean(confirmReset)}
        title="Reset password?"
        message={
          confirmReset
            ? `Reset password for ${confirmReset.fullName} (${confirmReset.email})? A temporary password will be generated.`
            : ""
        }
        confirmText="Reset"
        tone="amber"
        onCancel={() => setConfirmReset(null)}
        onConfirm={() => doResetPassword(confirmReset.id)}
      />

      <Confirm
        open={Boolean(confirmDeactivate)}
        title="Deactivate user?"
        message={
          confirmDeactivate
            ? `Deactivate ${confirmDeactivate.fullName} (${confirmDeactivate.email})? They will not be able to log in.`
            : ""
        }
        confirmText="Deactivate"
        tone="rose"
        onCancel={() => setConfirmDeactivate(null)}
        onConfirm={() => doDeactivate(confirmDeactivate.id)}
      />

      <PasswordReveal
        value={revealPassword}
        onClose={() => setRevealPassword("")}
      />

      {/* Inline details drawer */}
      <UserDetailsDrawer
        open={drawerOpen}
        user={drawerUser}
        canWrite={canWrite}
        isMe={Boolean(me.id && drawerUser?.id === me.id)}
        onClose={closeDrawer}
        onEdit={() => {
          if (!drawerUser) return;
          setEditorMode("edit");
          setEditing(drawerUser);
          setEditorOpen(true);
        }}
        onReset={() => {
          if (!drawerUser) return;
          setConfirmReset(drawerUser);
        }}
        onDeactivate={() => {
          if (!drawerUser) return;
          setConfirmDeactivate(drawerUser);
        }}
        onActivate={() => {
          if (!drawerUser) return;
          doActivate(drawerUser);
        }}
      />
    </div>
  );
}
