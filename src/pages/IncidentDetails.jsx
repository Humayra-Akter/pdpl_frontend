import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  MessageCircle,
  ListChecks,
  Bell,
  Activity,
  ClipboardList,
  Plus,
  X,
} from "lucide-react";
import {
  getIncident,
  updateIncident,
  closeIncident,
  listIncidentComments,
  addIncidentComment,
} from "../lib/admin";

// ---------- utils ----------
function clampInt(v, min, max) {
  const n = Number.parseInt(v ?? "", 10);
  if (Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
}

function fmtDateOnly(v) {
  try {
    if (!v) return "—";
    const d = new Date(v);
    const parts = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).formatToParts(d);
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const year = parts.find((p) => p.type === "year")?.value ?? "";
    return `${day}-${month}-${year}`; // 2-Feb-2026
  } catch {
    return "—";
  }
}

function fmtTimeOnly(v) {
  try {
    if (!v) return "";
    return new Date(v).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function pillBase(tone) {
  const map = {
    slate: "bg-slate-100 text-slate-800 ring-slate-200",
    amber: "bg-amber-100 text-amber-900 ring-amber-200",
    indigo: "bg-indigo-100 text-indigo-900 ring-indigo-200",
    rose: "bg-rose-100 text-rose-900 ring-rose-200",
    emerald: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  };
  return map[tone] || map.slate;
}

function statusPill(status = "DRAFT") {
  const s = String(status).toUpperCase();
  const map = {
    DRAFT: pillBase("slate"),
    IN_PROGRESS: pillBase("amber"),
    IN_REVIEW: pillBase("indigo"),
    CLOSED: pillBase("emerald"),
  };
  return map[s] || map.DRAFT;
}

function severityPill(sev = "LOW") {
  const s = String(sev).toUpperCase();
  const map = {
    LOW: pillBase("slate"),
    MEDIUM: pillBase("amber"),
    HIGH: "bg-orange-100 text-orange-900 ring-orange-200",
    CRITICAL: pillBase("rose"),
  };
  return map[s] || map.LOW;
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <div className="flex items-end justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {hint ? (
          <div className="text-xs font-semibold text-slate-500">{hint}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Card({ title, icon: Icon, children, right }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-2">
          {Icon ? (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
              <Icon className="h-5 w-5 text-slate-700" />
            </span>
          ) : null}
          <div className="text-sm font-bold text-slate-900">{title}</div>
        </div>
        {right || null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StepItem({ active, title, subtitle, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left rounded-2xl p-4 ring-1 transition",
        active
          ? "bg-indigo-50 ring-indigo-200 shadow-sm"
          : "bg-white ring-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            "grid h-10 w-10 place-items-center rounded-2xl ring-1",
            active
              ? "bg-indigo-600 text-white ring-indigo-600"
              : "bg-slate-50 text-slate-700 ring-slate-200",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900 truncate">
            {title}
          </div>
          <div className="text-xs font-semibold text-slate-500 truncate">
            {subtitle}
          </div>
        </div>
      </div>
    </button>
  );
}

// ---------- page ----------
export default function IncidentDetails() {
  const nav = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [err, setErr] = useState("");

  const [incident, setIncident] = useState(null);

  // comments
  const [comments, setComments] = useState([]);
  const [commentMsg, setCommentMsg] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  // left wizard step
  const STEPS = useMemo(
    () => [
      {
        key: "OVERVIEW",
        title: "Overview",
        subtitle: "Core incident info",
        icon: ClipboardList,
      },
      {
        key: "RISK",
        title: "Risk",
        subtitle: "Impact & likelihood",
        icon: ShieldAlert,
      },
      {
        key: "CONTAINMENT",
        title: "Containment",
        subtitle: "Actions & status",
        icon: ListChecks,
      },
      {
        key: "NOTIFICATIONS",
        title: "Notifications",
        subtitle: "Channels & dates",
        icon: Bell,
      },
      {
        key: "AUDIT",
        title: "Audit",
        subtitle: "Timeline (read-only)",
        icon: Activity,
      },
      {
        key: "COMMENTS",
        title: "Comments",
        subtitle: "Internal discussion",
        icon: MessageCircle,
      },
    ],
    [],
  );

  const [activeStep, setActiveStep] = useState("OVERVIEW");

  const breachWarning = useMemo(() => {
    const s = String(incident?.severity || "").toUpperCase();
    return (
      Boolean(incident?.isBreach) &&
      (s === "HIGH" || s === "CRITICAL") &&
      !incident?.reportedAt
    );
  }, [incident]);

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const res = await getIncident(id);
      const inc = res?.incident || res;
      setIncident(inc);

      // comments optional
      try {
        const cr = await listIncidentComments(id);
        setComments(cr?.items || cr?.comments || []);
      } catch {
        // ignore if not wired yet
        setComments([]);
      }
    } catch (e) {
      setErr(e?.message || "Failed to load incident");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function patchIncident(patch) {
    setIncident((prev) => ({ ...(prev || {}), ...patch }));
  }

  async function onSave() {
    if (!incident) return;
    setSaving(true);
    setErr("");
    try {
      // Build a safe PATCH payload (only allowed fields)
      const payload = {
        title: (incident.title || "").trim(),
        category: incident.category,
        status: incident.status,
        severity: incident.severity,
        isBreach: Boolean(incident.isBreach),

        occurredAt: incident.occurredAt || null,
        detectedAt: incident.detectedAt || null,
        reportedAt: incident.reportedAt || null,
        dueAt: incident.dueAt || null,

        description: incident.description || null,
        systemsAffected: incident.systemsAffected || null,
        affectedCount:
          incident.affectedCount === "" ||
          incident.affectedCount === null ||
          incident.affectedCount === undefined
            ? null
            : clampInt(incident.affectedCount, 0, 1000000000),

        risk: incident.risk || null,
        containment: incident.containment || null,
        notifications: incident.notifications || null,

        assignedToId: incident.assignedToId || null,
      };

      const res = await updateIncident(id, payload);
      const inc = res?.incident || res;
      setIncident(inc);
    } catch (e) {
      setErr(e?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function onCloseIncident() {
    setClosing(true);
    setErr("");
    try {
      await closeIncident(id);
      await loadAll();
    } catch (e) {
      setErr(e?.message || "Failed to close incident");
    } finally {
      setClosing(false);
    }
  }

  async function onAddComment() {
    const msg = (commentMsg || "").trim();
    if (!msg) return;
    setCommentBusy(true);
    setErr("");
    try {
      await addIncidentComment(id, { message: msg });
      setCommentMsg("");
      const cr = await listIncidentComments(id);
      setComments(cr?.items || cr?.comments || []);
      setActiveStep("COMMENTS");
    } catch (e) {
      setErr(e?.message || "Failed to add comment");
    } finally {
      setCommentBusy(false);
    }
  }

  // ----- step renderers -----
  function OverviewStep() {
    return (
      <div className="space-y-4">
        {breachWarning ? (
          <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 ring-1 ring-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-800" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-amber-900">
                  Regulator notification might be required
                </div>
                <div className="mt-1 text-sm text-amber-900/80">
                  This is flagged as a breach and severity is{" "}
                  {String(incident?.severity || "").toUpperCase()}. Add{" "}
                  <span className="font-semibold">Reported at</span> or review
                  your response workflow.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <Card title="Incident basics" icon={ClipboardList}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                value={incident?.title || ""}
                onChange={(e) => patchIncident({ title: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="e.g., Unauthorized access to customer DB"
              />
            </Field>

            <Field label="Category">
              <select
                value={incident?.category || "OTHER"}
                onChange={(e) => patchIncident({ category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900"
              >
                <option value="SECURITY">Security</option>
                <option value="PRIVACY">Privacy</option>
                <option value="OPERATIONAL">Operational</option>
                <option value="VENDOR">Vendor</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                value={incident?.status || "DRAFT"}
                onChange={(e) => patchIncident({ status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900"
              >
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="IN_REVIEW">In review</option>
                <option value="CLOSED">Closed</option>
              </select>
            </Field>

            <Field label="Severity">
              <select
                value={incident?.severity || "LOW"}
                onChange={(e) => patchIncident({ severity: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </Field>

            <Field label="Breach flag" hint="Personal data breach?">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                <input
                  type="checkbox"
                  checked={Boolean(incident?.isBreach)}
                  onChange={(e) =>
                    patchIncident({ isBreach: e.target.checked })
                  }
                />
                <span className="text-sm font-semibold text-slate-900">
                  Is breach
                </span>
              </label>
            </Field>

            <Field label="Affected count" hint="Numbers only">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={incident?.affectedCount ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  patchIncident({
                    affectedCount: v === "" ? "" : clampInt(v, 0, 1000000000),
                  });
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="e.g., 1200"
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Systems affected">
              <input
                value={incident?.systemsAffected || ""}
                onChange={(e) =>
                  patchIncident({ systemsAffected: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="e.g., CRM, DB cluster, Ticketing"
              />
            </Field>

            <Field label="Internal deadline (Due)">
              <input
                type="datetime-local"
                value={
                  incident?.dueAt
                    ? new Date(incident.dueAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  patchIncident({
                    dueAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900"
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Occurred at">
              <input
                type="datetime-local"
                value={
                  incident?.occurredAt
                    ? new Date(incident.occurredAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  patchIncident({
                    occurredAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900"
              />
            </Field>

            <Field label="Detected at">
              <input
                type="datetime-local"
                value={
                  incident?.detectedAt
                    ? new Date(incident.detectedAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  patchIncident({
                    detectedAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900"
              />
            </Field>

            <Field label="Reported at">
              <input
                type="datetime-local"
                value={
                  incident?.reportedAt
                    ? new Date(incident.reportedAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  patchIncident({
                    reportedAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Description">
              <textarea
                value={incident?.description || ""}
                onChange={(e) => patchIncident({ description: e.target.value })}
                className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="What happened, how detected, immediate observations..."
              />
            </Field>
          </div>
        </Card>
      </div>
    );
  }

  function RiskStep() {
    const risk =
      incident?.risk && typeof incident.risk === "object" ? incident.risk : {};
    const impact = clampInt(risk.impact, 1, 5) ?? 1;
    const likelihood = clampInt(risk.likelihood, 1, 5) ?? 1;

    function setRisk(next) {
      patchIncident({ risk: { ...risk, ...next } });
    }

    const score = impact * likelihood;

    return (
      <div className="space-y-4">
        <Card title="Risk assessment" icon={ShieldAlert}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Impact (1–5)" hint="Numbers only">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={5}
                value={impact}
                onChange={(e) =>
                  setRisk({ impact: clampInt(e.target.value, 1, 5) ?? 1 })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold"
              />
            </Field>

            <Field label="Likelihood (1–5)" hint="Numbers only">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={5}
                value={likelihood}
                onChange={(e) =>
                  setRisk({ likelihood: clampInt(e.target.value, 1, 5) ?? 1 })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold"
              />
            </Field>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Risk score
              </div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">
                {score}
              </div>
            </div>
            <div className="w-[220px]">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Low</span>
                <span>High</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-indigo-600"
                  style={{
                    width: `${Math.min(100, Math.round((score / 25) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Field label="Rationale">
              <textarea
                value={risk.rationale || ""}
                onChange={(e) => setRisk({ rationale: e.target.value })}
                className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="Explain why impact/likelihood are selected..."
              />
            </Field>
          </div>
        </Card>
      </div>
    );
  }

  function ContainmentStep() {
    const containment =
      incident?.containment && typeof incident.containment === "object"
        ? incident.containment
        : { actions: [], done: false };

    const actions = Array.isArray(containment.actions)
      ? containment.actions
      : [];
    const done = Boolean(containment.done);

    function setContainment(next) {
      patchIncident({ containment: { ...containment, ...next } });
    }

    return (
      <div className="space-y-4">
        <Card
          title="Containment actions"
          icon={ListChecks}
          right={
            <label className="inline-flex items-center gap-2 rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2">
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => setContainment({ done: e.target.checked })}
              />
              <span className="text-xs font-bold text-slate-800">
                Marked done
              </span>
            </label>
          }
        >
          <div className="space-y-3">
            {actions.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 text-sm text-slate-600">
                No actions yet. Add your first containment action.
              </div>
            ) : null}

            {actions.map((a, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 rounded-2xl bg-white ring-1 ring-slate-200 p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 break-words">
                    {String(a || "")}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = actions.filter((_, i) => i !== idx);
                    setContainment({ actions: next });
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-50 text-slate-600"
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              onClick={() => setContainment({ actions: [...actions, ""] })}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Add action
            </button>

            {actions.length > 0 ? (
              <div className="space-y-2">
                {actions.map((a, idx) => (
                  <input
                    key={`edit-${idx}`}
                    value={String(a || "")}
                    onChange={(e) => {
                      const next = [...actions];
                      next[idx] = e.target.value;
                      setContainment({ actions: next });
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    placeholder={`Action #${idx + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  function NotificationsStep() {
    const notifications = Array.isArray(incident?.notifications)
      ? incident.notifications
      : [];
    function setNotifications(next) {
      patchIncident({ notifications: next });
    }

    return (
      <div className="space-y-4">
        <Card title="Notifications log" icon={Bell}>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 text-sm text-slate-600">
                No notifications yet. Add entries when you notify regulator,
                data subjects, or internal stakeholders.
              </div>
            ) : null}

            {notifications.map((n, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white ring-1 ring-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">
                      {String(n?.channel || "INTERNAL")}
                      <span className="text-slate-400"> • </span>
                      {n?.date ? fmtDateOnly(n.date) : "—"}{" "}
                      <span className="text-slate-400">
                        {n?.date ? fmtTimeOnly(n.date) : ""}
                      </span>
                    </div>
                    {n?.note ? (
                      <div className="mt-1 text-sm text-slate-700 break-words">
                        {String(n.note)}
                      </div>
                    ) : null}
                  </div>

                  <button
                    onClick={() =>
                      setNotifications(
                        notifications.filter((_, i) => i !== idx),
                      )
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-50 text-slate-600"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() =>
                setNotifications([
                  ...notifications,
                  {
                    channel: "INTERNAL",
                    date: new Date().toISOString(),
                    note: "",
                  },
                ])
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Add notification
            </button>

            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((n, idx) => (
                  <div
                    key={`edit-n-${idx}`}
                    className="grid gap-2 md:grid-cols-3"
                  >
                    <select
                      value={n?.channel || "INTERNAL"}
                      onChange={(e) => {
                        const next = [...notifications];
                        next[idx] = {
                          ...(next[idx] || {}),
                          channel: e.target.value,
                        };
                        setNotifications(next);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                    >
                      <option value="EMAIL">Email</option>
                      <option value="REGULATOR">Regulator</option>
                      <option value="DATA_SUBJECT">Data subject</option>
                      <option value="INTERNAL">Internal</option>
                    </select>

                    <input
                      type="datetime-local"
                      value={
                        n?.date
                          ? new Date(n.date).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const next = [...notifications];
                        next[idx] = {
                          ...(next[idx] || {}),
                          date: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        };
                        setNotifications(next);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                    />

                    <input
                      value={String(n?.note || "")}
                      onChange={(e) => {
                        const next = [...notifications];
                        next[idx] = {
                          ...(next[idx] || {}),
                          note: e.target.value,
                        };
                        setNotifications(next);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
                      placeholder="Note (optional)"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  function AuditStep() {
    // If you already have an audit endpoint, we can wire it later.
    return (
      <div className="space-y-4">
        <Card title="Audit timeline" icon={Activity}>
          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 text-sm text-slate-700">
            <div className="font-bold text-slate-900">Current snapshot</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Created
                </div>
                <div className="text-sm font-semibold">
                  {fmtDateOnly(incident?.createdAt)}{" "}
                  <span className="text-slate-500">
                    {fmtTimeOnly(incident?.createdAt)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Updated
                </div>
                <div className="text-sm font-semibold">
                  {fmtDateOnly(incident?.updatedAt)}{" "}
                  <span className="text-slate-500">
                    {fmtTimeOnly(incident?.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              If you want the full audit list here, tell me your audit endpoint
              shape and I’ll plug it in.
            </div>
          </div>
        </Card>
      </div>
    );
  }

  function CommentsStep() {
    return (
      <div className="space-y-4">
        <Card title="Comments" icon={MessageCircle}>
          <div className="flex gap-2">
            <input
              value={commentMsg}
              onChange={(e) => setCommentMsg(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              placeholder="Write a comment..."
            />
            <button
              onClick={onAddComment}
              disabled={commentBusy || !commentMsg.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {comments.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 text-sm text-slate-600">
                No comments yet.
              </div>
            ) : null}

            {comments.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-white ring-1 ring-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">
                      {c?.author?.fullName || "User"}
                      <span className="text-slate-400"> • </span>
                      <span className="text-slate-600">
                        {fmtDateOnly(c?.createdAt)} {fmtTimeOnly(c?.createdAt)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-800 break-words">
                      {c?.message}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const stepContent = useMemo(() => {
    if (!incident) return null;
    switch (activeStep) {
      case "OVERVIEW":
        return <OverviewStep />;
      case "RISK":
        return <RiskStep />;
      case "CONTAINMENT":
        return <ContainmentStep />;
      case "NOTIFICATIONS":
        return <NotificationsStep />;
      case "AUDIT":
        return <AuditStep />;
      case "COMMENTS":
        return <CommentsStep />;
      default:
        return <OverviewStep />;
    }
  }, [activeStep, incident, comments, commentMsg, commentBusy, breachWarning]);

  return (
    <div className="space-y-5">
      {/* top header */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-rose-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Dashboard <span className="text-slate-300">›</span> Incidents{" "}
                <span className="text-slate-300">›</span>{" "}
                <span className="text-slate-700">{id}</span>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">
                {incident?.title || "Incident"}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
                    statusPill(incident?.status),
                  ].join(" ")}
                >
                  Status: {incident?.status || "DRAFT"}
                </span>
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
                    severityPill(incident?.severity),
                  ].join(" ")}
                >
                  Severity: {incident?.severity || "LOW"}
                </span>
                {incident?.isBreach ? (
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 bg-rose-100 text-rose-900 ring-rose-200">
                    Breach flagged
                  </span>
                ) : null}

                <span className="text-xs font-semibold text-slate-600">
                  Updated: {fmtDateOnly(incident?.updatedAt)}{" "}
                  {fmtTimeOnly(incident?.updatedAt)}
                </span>
              </div>

              {err ? (
                <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
                  {err}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 w-[340px] max-w-full">
              <button
                onClick={() => nav("/admin/incidents")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={loadAll}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>

                <button
                  onClick={onSave}
                  disabled={saving || loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              <button
                onClick={onCloseIncident}
                disabled={
                  closing ||
                  loading ||
                  String(incident?.status).toUpperCase() === "CLOSED"
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {closing ? "Closing..." : "Close incident"}
              </button>
            </div>
          </div>
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-500 to-rose-600" />
      </div>

      {/* body: left wizard + right content */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          {STEPS.map((s, idx) => (
            <StepItem
              key={s.key}
              active={activeStep === s.key}
              title={`Step ${idx + 1} • ${s.title}`}
              subtitle={s.subtitle}
              icon={s.icon}
              onClick={() => setActiveStep(s.key)}
            />
          ))}
        </div>

        <div className="min-w-0">
          {loading ? (
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-48 rounded bg-slate-100" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
                <div className="h-4 w-2/3 rounded bg-slate-100" />
              </div>
            </div>
          ) : !incident ? (
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 text-sm text-slate-700">
              Incident not found.
            </div>
          ) : (
            stepContent
          )}
        </div>
      </div>
    </div>
  );
}
