import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  listUsers,
  usersSummary,
  createUser,
  updateUser,
  resetUserPassword,
  deactivateUser,
} from "../lib/admin";
import { api } from "../lib/http";
import {
  Plus,
  Search,
  RefreshCw,
  UserCog,
  ShieldCheck,
  User,
  Mail,
  Pencil,
  KeyRound,
  Power,
  Eye,
} from "lucide-react";

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

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
}

function Badge({ tone = "slate", children }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    indigo: "bg-indigo-50 text-indigo-800 ring-indigo-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    rose: "bg-rose-50 text-rose-800 ring-rose-200",
    sky: "bg-sky-50 text-sky-800 ring-sky-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
        tones[tone],
      )}
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

function Modal({ open, title, subtitle, children, footer, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-200 p-5">
            <div className="text-lg font-extrabold text-slate-900">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-sm font-semibold text-slate-600">
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
        <label className="text-sm font-bold text-slate-900">{label}</label>
        {hint ? (
          <div className="text-xs font-semibold text-slate-500">{hint}</div>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
      {error ? (
        <div className="mt-1 text-xs font-bold text-rose-600">{error}</div>
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
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white",
              btnTone,
            )}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
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
            className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
            type="button"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="text-xs font-bold text-indigo-900">TEMP PASSWORD</div>
        <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-white p-3 ring-1 ring-indigo-100">
          <div className="select-all text-sm font-extrabold text-slate-900">
            {value}
          </div>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(value);
              alert("Copied!");
            }}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
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
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canWrite || saving}
            className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50"
            type="button"
          >
            {saving ? "Saving..." : mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      }
    >
      {!canWrite ? (
        <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          DPO access is read-only. User creation/editing is disabled.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full Name" error={errors.fullName}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
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
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
          />
        </Field>

        <Field label="Role">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
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
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
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
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function KpiCard({ label, value, hint, icon: Icon, tone = "slate" }) {
  const toneMap = {
    blue: "border-sky-200 bg-sky-50",
    green: "border-emerald-200 bg-emerald-50",
    rose: "border-rose-200 bg-rose-50",
    indigo: "border-indigo-200 bg-indigo-50",
    amber: "border-amber-200 bg-amber-50",
    slate: "border-slate-200 bg-slate-50",
  };
  const iconToneMap = {
    blue: "text-sky-700",
    green: "text-emerald-700",
    rose: "text-rose-700",
    indigo: "text-indigo-700",
    amber: "text-amber-700",
    slate: "text-slate-700",
  };
  return (
    <div
      className={cn("rounded-3xl border p-4", toneMap[tone] || toneMap.slate)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{label}</div>
          {hint ? (
            <div className="mt-0.5 text-xs font-semibold text-slate-600">
              {hint}
            </div>
          ) : null}
        </div>
        {Icon ? (
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1 ring-black/5">
            <Icon
              className={cn("h-5 w-5", iconToneMap[tone] || "text-slate-700")}
            />
          </div>
        ) : null}
      </div>
      <div className="mt-4 text-3xl font-black text-slate-900">
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function UserManagement() {
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
  const [filters, setFilters] = useState({
    q: "",
    role: "ALL",
    status: "ALL",
  });

  const sort = SORTS[sortKey];

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

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

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
      const [sum, list] = await Promise.all([
        usersSummary(),
        listUsers({
          page,
          pageSize,
          q: filters.q?.trim() ? filters.q.trim() : undefined,
          role: filters.role !== "ALL" ? filters.role : undefined,
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
  }, [page, sortKey, filters.role, filters.status, filters.q]);

  function applyFilters() {
    setPage(1);
    setFilters({
      q: qInput,
      role: roleInput,
      status: statusInput,
    });
  }

  const kpiCards = useMemo(() => {
    const k = kpis || {};
    return [
      {
        label: "Total",
        value: k.totalUsers ?? 0,
        hint: "All accounts",
        tone: "blue",
        icon: UserCog,
      },
      {
        label: "Active",
        value: k.activeUsers ?? 0,
        hint: "Can log in",
        tone: "green",
        icon: ShieldCheck,
      },
      {
        label: "Inactive",
        value: k.inactiveUsers ?? 0,
        hint: "Soft deactivated",
        tone: "rose",
        icon: Power,
      },
      {
        label: "Admins",
        value: k.adminsCount ?? 0,
        hint: "Full access",
        tone: "indigo",
        icon: User,
      },
      {
        label: "DPO",
        value: k.dpoCount ?? 0,
        hint: "Read-only",
        tone: "amber",
        icon: Mail,
      },
    ];
  }, [kpis]);

  async function handleCreatedOrUpdated(res) {
    setEditorOpen(false);
    setEditing(null);

    // backend may return temp password as: { tempPassword }
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
      await updateUser(u.id, {
        fullName: u.fullName,
        role: u.role,
        status: "ACTIVE",
        customFields: u.customFields || {},
      });
      await load();
    } catch (e) {
      setErr(e?.error || e?.message || "Failed to activate user");
    }
  }

  return (
    <div className="space-y-5">
      {/* Top module header (same style as Incidents page: soft gradients) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-500">
              Admin Module
            </div>
            <div className="mt-1 text-3xl font-black text-slate-900">
              User Management
            </div>
            <div className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
              Manage users safely • DPO read-only • audit-friendly •
              passwordHash never exposed
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={load}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              onClick={() => {
                setEditorMode("create");
                setEditing(null);
                setEditorOpen(true);
              }}
              disabled={!canWrite}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create User
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="mt-5 grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
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
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
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
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              {SORTS.map((s, idx) => (
                <option key={s.label} value={idx}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              onClick={applyFilters}
              className="h-11 shrink-0 rounded-2xl bg-indigo-600 px-5 text-sm font-extrabold text-white hover:bg-indigo-700"
              type="button"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      {err ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {err}
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Users</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-600">
              {total} record(s) • soft deactivation supported
            </div>
          </div>

          <div className="text-xs font-bold text-slate-600">
            Page {page} / {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-bold text-slate-600">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
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
                  const canMutate = canWrite; // backend also enforces

                  return (
                    <tr
                      key={u.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-slate-900">
                            {u.fullName}
                          </div>
                          <div className="mt-0.5 truncate text-xs font-semibold text-slate-600">
                            {u.email}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Link>

                          <button
                            onClick={() => {
                              setEditorMode("edit");
                              setEditing(u);
                              setEditorOpen(true);
                            }}
                            disabled={!canMutate}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                            type="button"
                            title={!canMutate ? "DPO read-only" : "Edit"}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            onClick={() => setConfirmReset(u)}
                            disabled={!canMutate}
                            className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                            type="button"
                            title={
                              !canMutate ? "DPO read-only" : "Reset password"
                            }
                          >
                            <KeyRound className="h-4 w-4" />
                            Reset
                          </button>

                          {u.status === "ACTIVE" ? (
                            <button
                              onClick={() => setConfirmDeactivate(u)}
                              disabled={!canMutate || isMe}
                              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                              type="button"
                              title={
                                isMe
                                  ? "You cannot deactivate yourself"
                                  : !canMutate
                                    ? "DPO read-only"
                                    : "Deactivate"
                              }
                            >
                              <Power className="h-4 w-4" />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => doActivate(u)}
                              disabled={!canMutate}
                              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                              type="button"
                              title={!canMutate ? "DPO read-only" : "Activate"}
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
                    <div className="text-sm font-extrabold text-slate-900">
                      No users found
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-600">
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
          <div className="text-xs font-semibold text-slate-600">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              type="button"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
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
    </div>
  );
}
