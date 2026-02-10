import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRopa, saveRopaStep, submitRopa } from "../lib/admin";
import {
  ClipboardList,
  Info,
  Target,
  Users,
  Database,
  FolderOpen,
  Share2,
  Clock,
  Globe,
  Shield,
  Hand,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  ArrowLeft,
} from "lucide-react";

/**
 * MUST match backend Prisma enum RopaStepKey:
 * INSTRUCTIONS, GENERAL, PURPOSE, DATA_SUBJECTS, PERSONAL_DATA, DATA_SOURCES,
 * RECIPIENTS, RETENTION, TRANSFERS, SECURITY, RIGHTS, REVIEW
 */

const STEPS = [
  { key: "INSTRUCTIONS", label: "Instructions", icon: Info },
  { key: "GENERAL", label: "General Information", icon: ClipboardList },
  { key: "PURPOSE", label: "Purpose of Processing", icon: Target },
  { key: "DATA_SUBJECTS", label: "Categories of Data Subjects", icon: Users },
  {
    key: "PERSONAL_DATA",
    label: "Categories of Personal Data",
    icon: Database,
  },
  { key: "DATA_SOURCES", label: "Data Sources", icon: FolderOpen },
  { key: "RECIPIENTS", label: "Data Recipients", icon: Share2 },
  { key: "RETENTION", label: "Retention Period", icon: Clock },
  { key: "TRANSFERS", label: "Cross-Border Transfers", icon: Globe },
  { key: "SECURITY", label: "Security Measures", icon: Shield },
  { key: "RIGHTS", label: "Data Subject Rights Handling", icon: Hand },
  { key: "REVIEW", label: "RoPA Review & Approval", icon: FileCheck2 },
];

// required fields per step (UPDATED)
const REQUIRED = {
  GENERAL: ["activityName"],
  PURPOSE: ["purposeSummary", "lawfulBasis"],
  DATA_SUBJECTS: ["primarySubjectGroups", "subjectCountEstimate"],
  PERSONAL_DATA: ["identifiers", "contactDetails", "accountData"],
  DATA_SOURCES: ["sourceSystems", "collectionMethod"],
  RECIPIENTS: ["internalRecipients"],
  RETENTION: ["retentionPeriod", "deletionMethod"],
  TRANSFERS: [], // optional (handled by UI)
  SECURITY: ["accessControls", "dataProtection"],
  RIGHTS: ["requestChannels", "verificationProcess", "responseTimeline"],
  // INSTRUCTIONS optional
  // REVIEW no required fields (submit action)
};

function stepIndex(key) {
  const i = STEPS.findIndex((s) => s.key === key);
  return i >= 0 ? i : 0;
}

function fmtDate(v) {
  try {
    if (!v) return "—";
    return new Date(v).toLocaleString();
  } catch {
    return "—";
  }
}

function clamp(n, a, b) {
  const x = Number(n);
  if (Number.isNaN(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function statusTone(status = "DRAFT") {
  const map = {
    DRAFT: "bg-slate-100 text-slate-800 ring-slate-200",
    IN_PROGRESS: "bg-amber-100 text-amber-900 ring-amber-200",
    SUBMITTED: "bg-indigo-100 text-indigo-900 ring-indigo-200",
    APPROVED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    REJECTED: "bg-rose-100 text-rose-900 ring-rose-200",
  };
  return map[status] || map.DRAFT;
}

function validateStep(stepKey, data) {
  const req = REQUIRED[stepKey] || [];
  const missing = req.filter((f) => !String(data?.[f] || "").trim());
  return { ok: missing.length === 0, missing };
}

// sequential: a step is “unlocked” only if ALL previous steps are complete
function isUnlocked(targetKey, completionByKey) {
  const targetIdx = stepIndex(targetKey);
  for (let i = 0; i < targetIdx; i++) {
    const prevKey = STEPS[i].key;
    if (!completionByKey[prevKey]) return false;
  }
  return true;
}

// progress: 12 parts
function progressFromCompleted(completionByKey, status) {
  if (status === "SUBMITTED" || status === "APPROVED") return 100;

  // count completed steps from the beginning until first incomplete
  let completedSequential = 0;
  for (let i = 0; i < STEPS.length; i++) {
    const k = STEPS[i].key;
    if (completionByKey[k]) completedSequential++;
    else break;
  }

  // 0..12 => 0..100
  const pct = Math.round((completedSequential / STEPS.length) * 100);

  // while working keep < 100 unless submitted/approved
  return clamp(Math.min(pct, 99), 0, 99);
}

function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">
          {label} {required ? <span className="text-rose-600">*</span> : null}
        </div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm",
        "outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm",
        "outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm",
        "outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100",
        props.className || "",
      ].join(" ")}
    />
  );
}

function SolidPrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2",
        "rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
        "bg-blue-700 hover:bg-blue-800",
        "shadow-sm transition disabled:opacity-60 disabled:hover:bg-blue-700",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SolidSecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2",
        "rounded-xl border border-slate-200 bg-white px-4 py-2.5",
        "text-sm font-semibold text-slate-800 hover:bg-slate-50",
        "transition disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function VerticalStepper({ stepKey, onGoto, completionByKey, status }) {
  const readOnly = status === "SUBMITTED" || status === "APPROVED";

  return (
    <Card className="p-4">
      <div className="space-y-2">
        {STEPS.map((s, i) => {
          const active = s.key === stepKey;
          const done = completionByKey[s.key];
          const unlocked = readOnly ? true : isUnlocked(s.key, completionByKey);
          const Icon = s.icon;

          return (
            <button
              key={s.key}
              onClick={() => unlocked && onGoto(s.key)}
              disabled={!unlocked}
              className={[
                "w-full group flex items-center gap-3 rounded-2xl px-3 py-3 text-left",
                "ring-1 transition disabled:opacity-60 disabled:cursor-not-allowed",
                active
                  ? "bg-blue-50 ring-blue-200"
                  : "bg-white ring-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              <div
                className={[
                  "grid h-10 w-10 place-items-center rounded-xl ring-1 transition shrink-0",
                  active
                    ? "bg-blue-700 text-white ring-blue-800"
                    : done
                      ? "bg-emerald-600 text-white ring-emerald-700"
                      : unlocked
                        ? "bg-slate-100 text-slate-700 ring-slate-200 group-hover:bg-slate-200"
                        : "bg-slate-50 text-slate-400 ring-slate-200",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-slate-500">
                  Page {i + 1} of {STEPS.length}
                </div>
                <div className="truncate text-sm font-semibold text-slate-900">
                  {s.label}
                </div>
              </div>

              {active ? (
                <span className="text-xs font-semibold text-blue-700">
                  Current
                </span>
              ) : done ? (
                <span className="text-xs font-semibold text-emerald-700">
                  Done
                </span>
              ) : unlocked ? (
                <span className="text-xs font-semibold text-slate-500">
                  Open
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-400">
                  Locked
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export default function RopaWizard() {
  const { id } = useParams();
  const nav = useNavigate();

  const [ropa, setRopa] = useState(null);
  const [stepKey, setStepKey] = useState("INSTRUCTIONS");
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const readOnly =
    (ropa?.status || "").toUpperCase() === "SUBMITTED" ||
    (ropa?.status || "").toUpperCase() === "APPROVED";

  useEffect(() => {
    let alive = true;
    setErr("");
    setRopa(null);

    getRopa(id)
      .then((res) => {
        if (!alive) return;
        const r = res?.ropa || res?.ropaActivity || res;
        setRopa(r);

        const backendStep = String(
          r?.currentStep || "INSTRUCTIONS",
        ).toUpperCase();
        const initial = STEPS.some((s) => s.key === backendStep)
          ? backendStep
          : "INSTRUCTIONS";

        setStepKey(initial);
        setForm(r?.formData?.[initial] || {});
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message || "Failed to load RoPA");
      });

    return () => {
      alive = false;
    };
  }, [id]);

  // compute completion using saved formData + current unsaved form (for current step)
  const completionByKey = useMemo(() => {
    const map = {};
    for (const s of STEPS) {
      const saved = ropa?.formData?.[s.key] || {};
      const current = s.key === stepKey ? form : saved;

      // Steps with no REQUIRED are always “complete”
      if (!REQUIRED[s.key] || REQUIRED[s.key].length === 0) {
        map[s.key] = true;
      } else {
        map[s.key] = validateStep(s.key, current).ok;
      }
    }
    return map;
  }, [ropa, stepKey, form]);

  const dynamicProgress = useMemo(() => {
    return progressFromCompleted(completionByKey, ropa?.status || "DRAFT");
  }, [completionByKey, ropa?.status]);

  function gotoStep(nextKey) {
    if (!ropa) return;

    const target = String(nextKey || "").toUpperCase();
    if (!STEPS.some((s) => s.key === target)) {
      setErr(`Invalid stepKey: ${target}`);
      return;
    }

    if (!readOnly) {
      const unlocked = isUnlocked(target, completionByKey);
      if (!unlocked) {
        setErr(
          "This step is locked. Please complete previous required steps first.",
        );
        return;
      }
    }

    setErr("");
    setStepKey(target);
    setForm(ropa?.formData?.[target] || {});
  }

  async function saveCurrentStep() {
    if (readOnly) {
      setErr("RoPA is submitted and cannot be edited");
      return false;
    }

    setBusy(true);
    setErr("");

    try {
      const res = await saveRopaStep(id, stepKey, form);
      const next = res?.ropa || res?.ropaActivity || res;
      setRopa(next);

      // refresh current form from server-normalized data (if any)
      setForm(next?.formData?.[stepKey] || form);
      return true;
    } catch (e) {
      setErr(e?.message || "Save failed");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (readOnly) return;

    const v = validateStep(stepKey, form);
    if (!v.ok) {
      setErr(`Please fill required: ${v.missing.join(", ")}`);
      return;
    }

    const ok = await saveCurrentStep();
    if (!ok) return; // IMPORTANT: do not navigate if save failed

    const idx = stepIndex(stepKey);
    const nextKey = STEPS[Math.min(STEPS.length - 1, idx + 1)].key;

    // still ensure it’s unlocked
    if (!isUnlocked(nextKey, { ...completionByKey, [stepKey]: true })) {
      setErr("Next step is locked (previous steps not completed).");
      return;
    }

    gotoStep(nextKey);
  }

  function back() {
    const idx = stepIndex(stepKey);
    const prevKey = STEPS[Math.max(0, idx - 1)].key;
    gotoStep(prevKey);
  }

  async function submit() {
    if (readOnly) return;

    // before submit, ensure ALL required steps are complete
    const missingSteps = Object.keys(REQUIRED).filter((k) => {
      const req = REQUIRED[k] || [];
      if (!req.length) return false;
      return !completionByKey[k];
    });

    if (missingSteps.length) {
      setErr(
        `Complete required steps before submit: ${missingSteps.join(", ")}`,
      );
      return;
    }

    setBusy(true);
    setErr("");
    try {
      const res = await submitRopa(id);
      const next = res?.ropa || res?.ropaActivity || res;
      setRopa(next);
      gotoStep("REVIEW");
    } catch (e) {
      setErr(e?.message || "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ropa && !err) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-56 rounded bg-slate-100" />
          <div className="h-8 w-2/3 rounded bg-slate-100" />
          <div className="h-24 w-full rounded bg-slate-100" />
        </div>
      </Card>
    );
  }

  if (err && !ropa) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-rose-700">
              RoPA failed
            </div>
            <div className="mt-1 text-sm text-slate-600">{err}</div>
          </div>
          <SolidSecondaryButton onClick={() => nav("/admin/ropa")}>
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </SolidSecondaryButton>
        </div>
      </Card>
    );
  }

  const idx = stepIndex(stepKey);
  const isLast = stepKey === "REVIEW";

  const title = ropa?.title || "Untitled RoPA";
  const status = ropa?.status || "DRAFT";
  const updatedAt = ropa?.updatedAt || ropa?.createdAt;

  const contentMaxH = "max-h-[62vh]";
  const BTN_W = "w-[150px]";

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">RoPA Activity</div>
            <div className="mt-0.5 truncate text-xl font-semibold text-slate-900">
              {title}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  statusTone(status),
                ].join(" ")}
              >
                Status: {status}
              </span>

              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-100">
                Progress: {dynamicProgress}%
              </span>

              <span className="text-xs text-slate-500">
                Updated:{" "}
                <span className="font-medium">{fmtDate(updatedAt)}</span>
              </span>

              {readOnly ? (
                <span className="text-xs font-semibold text-slate-500">
                  Read-only
                </span>
              ) : null}
            </div>
          </div>

          <SolidSecondaryButton
            onClick={() => nav("/admin/ropa")}
            className={BTN_W}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </SolidSecondaryButton>
        </div>

        <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-blue-700"
            style={{ width: `${dynamicProgress}%` }}
          />
        </div>
      </Card>

      {/* Main layout */}
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <VerticalStepper
          stepKey={stepKey}
          onGoto={gotoStep}
          completionByKey={completionByKey}
          status={status}
        />

        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500">Current page</div>
                <div className="text-lg font-bold text-slate-900">
                  {STEPS[idx]?.label}
                </div>
              </div>

              <span
                className={[
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  statusTone(status),
                ].join(" ")}
              >
                {status}
              </span>
            </div>
          </div>

          <div
            className={["p-6 space-y-5 overflow-auto", contentMaxH].join(" ")}
          >
            {/* Instructions */}
            {stepKey === "INSTRUCTIONS" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                  <div className="text-sm font-semibold text-blue-900">
                    Instructions for Using the RoPA Template
                  </div>
                  <div className="mt-1 text-sm text-blue-900/80">
                    Complete each page in sequence. Required fields must be
                    filled to unlock the next page. Submit only after review.
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Acknowledgement note" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., I have reviewed the instructions."
                      value={form.ack || ""}
                      onChange={(e) =>
                        setForm({ ...form, ack: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Prepared by" hint="Optional (name / team)">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Privacy Team"
                      value={form.preparedBy || ""}
                      onChange={(e) =>
                        setForm({ ...form, preparedBy: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* General */}
            {stepKey === "GENERAL" && (
              <div className="grid gap-5">
                <Field label="Activity name" required>
                  <Input
                    disabled={readOnly}
                    placeholder="e.g., CCTV monitoring"
                    value={form.activityName || ""}
                    onChange={(e) =>
                      setForm({ ...form, activityName: e.target.value })
                    }
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Business unit / owner" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Security / Facilities"
                      value={form.owner || ""}
                      onChange={(e) =>
                        setForm({ ...form, owner: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="System / application name" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Access Control System"
                      value={form.systemName || ""}
                      onChange={(e) =>
                        setForm({ ...form, systemName: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <Field label="Short description" hint="Optional">
                  <Textarea
                    disabled={readOnly}
                    rows={4}
                    placeholder="Describe the processing activity..."
                    value={form.description || ""}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}

            {/* Purpose */}
            {stepKey === "PURPOSE" && (
              <div className="grid gap-5">
                <Field
                  label="Purpose summary"
                  hint="Why is this processing needed?"
                  required
                >
                  <Textarea
                    disabled={readOnly}
                    rows={4}
                    placeholder="Briefly explain the business purpose and outcome..."
                    value={form.purposeSummary || ""}
                    onChange={(e) =>
                      setForm({ ...form, purposeSummary: e.target.value })
                    }
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Lawful basis" hint="Required" required>
                    <Select
                      disabled={readOnly}
                      value={form.lawfulBasis || ""}
                      onChange={(e) =>
                        setForm({ ...form, lawfulBasis: e.target.value })
                      }
                    >
                      <option value="">Select…</option>
                      <option value="CONSENT">Consent</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="LEGAL_OBLIGATION">Legal obligation</option>
                      <option value="VITAL_INTERESTS">Vital interests</option>
                      <option value="PUBLIC_TASK">Public task</option>
                      <option value="LEGITIMATE_INTERESTS">
                        Legitimate interests
                      </option>
                    </Select>
                  </Field>

                  <Field label="Processing frequency" hint="Optional">
                    <Select
                      disabled={readOnly}
                      value={form.processingFrequency || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          processingFrequency: e.target.value,
                        })
                      }
                    >
                      <option value="">Select…</option>
                      <option value="ONE_OFF">One-off</option>
                      <option value="AD_HOC">Ad hoc</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="CONTINUOUS">Continuous</option>
                    </Select>
                  </Field>
                </div>

                <Field label="Business benefit / outcome" hint="Optional">
                  <Input
                    disabled={readOnly}
                    placeholder="e.g., Improve security, prevent fraud, fulfil service…"
                    value={form.expectedOutcome || ""}
                    onChange={(e) =>
                      setForm({ ...form, expectedOutcome: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}

            {/* Data subjects */}
            {stepKey === "DATA_SUBJECTS" && (
              <div className="grid gap-5">
                <Field
                  label="Primary data subject groups"
                  hint="Who are the individuals?"
                  required
                >
                  <Input
                    disabled={readOnly}
                    placeholder="e.g., Employees, Customers, Visitors, Vendors"
                    value={form.primarySubjectGroups || ""}
                    onChange={(e) =>
                      setForm({ ...form, primarySubjectGroups: e.target.value })
                    }
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Estimated number of individuals"
                    hint="Rough estimate"
                    required
                  >
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., 2000 active customers"
                      value={form.subjectCountEstimate || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          subjectCountEstimate: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Geography" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Bangladesh only / Global / APAC"
                      value={form.subjectGeography || ""}
                      onChange={(e) =>
                        setForm({ ...form, subjectGeography: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Children involved?" hint="Optional">
                    <Select
                      disabled={readOnly}
                      value={form.childrenInvolved || ""}
                      onChange={(e) =>
                        setForm({ ...form, childrenInvolved: e.target.value })
                      }
                    >
                      <option value="">Select…</option>
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                      <option value="UNKNOWN">Unknown</option>
                    </Select>
                  </Field>

                  <Field label="Vulnerable individuals" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Patients, job applicants, minors…"
                      value={form.vulnerableGroups || ""}
                      onChange={(e) =>
                        setForm({ ...form, vulnerableGroups: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* Personal data (REPLACED with relevant fields) */}
            {stepKey === "PERSONAL_DATA" && (
              <div className="grid gap-5">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-sm font-semibold text-slate-900">
                    Personal Data Categories
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    List the exact personal data types (e.g., name, email,
                    address, phone). Keep it specific.
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Identifiers"
                    hint="Name, employee ID, username…"
                    required
                  >
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Full name, Employee ID"
                      value={form.identifiers || ""}
                      onChange={(e) =>
                        setForm({ ...form, identifiers: e.target.value })
                      }
                    />
                  </Field>

                  <Field
                    label="Contact details"
                    hint="Email, phone, address…"
                    required
                  >
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Email, Mobile number, Home address"
                      value={form.contactDetails || ""}
                      onChange={(e) =>
                        setForm({ ...form, contactDetails: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Account / relationship data"
                    hint="Customer number, access logs…"
                    required
                  >
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Customer ID, Access badge logs"
                      value={form.accountData || ""}
                      onChange={(e) =>
                        setForm({ ...form, accountData: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Location / device data" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., IP address, GPS, device ID"
                      value={form.deviceLocationData || ""}
                      onChange={(e) =>
                        setForm({ ...form, deviceLocationData: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Financial data" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Bank account, card last-4, invoices"
                      value={form.financialData || ""}
                      onChange={(e) =>
                        setForm({ ...form, financialData: e.target.value })
                      }
                    />
                  </Field>

                  <Field
                    label="Special category / sensitive data"
                    hint="Optional (health, biometrics, etc.)"
                  >
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., None / Health info / Biometrics"
                      value={form.sensitiveData || ""}
                      onChange={(e) =>
                        setForm({ ...form, sensitiveData: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <Field label="Free-text notes" hint="Optional">
                  <Textarea
                    disabled={readOnly}
                    rows={3}
                    placeholder="Any extra details or edge cases…"
                    value={form.personalDataNotes || ""}
                    onChange={(e) =>
                      setForm({ ...form, personalDataNotes: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}

            {/* Data sources */}
            {stepKey === "DATA_SOURCES" && (
              <div className="grid gap-5">
                <Field
                  label="Source systems / touchpoints"
                  hint="Where is data captured/stored?"
                  required
                >
                  <Input
                    disabled={readOnly}
                    placeholder="e.g., Web portal, HR system, CCTV, Call center"
                    value={form.sourceSystems || ""}
                    onChange={(e) =>
                      setForm({ ...form, sourceSystems: e.target.value })
                    }
                  />
                </Field>

                <Field
                  label="Collection method"
                  hint="How is it collected?"
                  required
                >
                  <Input
                    disabled={readOnly}
                    placeholder="e.g., User forms, automated logs, manual entry"
                    value={form.collectionMethod || ""}
                    onChange={(e) =>
                      setForm({ ...form, collectionMethod: e.target.value })
                    }
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Third-party sources" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Background check provider, partners"
                      value={form.thirdPartySources || ""}
                      onChange={(e) =>
                        setForm({ ...form, thirdPartySources: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Data quality checks" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Validation rules, periodic reviews"
                      value={form.dataQualityChecks || ""}
                      onChange={(e) =>
                        setForm({ ...form, dataQualityChecks: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* Recipients */}
            {stepKey === "RECIPIENTS" && (
              <div className="grid gap-5">
                <Field
                  label="Internal recipients"
                  hint="Teams/roles that access the data"
                  required
                >
                  <Input
                    disabled={readOnly}
                    placeholder="e.g., HR, Finance, Security Operations"
                    value={form.internalRecipients || ""}
                    onChange={(e) =>
                      setForm({ ...form, internalRecipients: e.target.value })
                    }
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="External recipients" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Regulators, auditors, partners"
                      value={form.externalRecipients || ""}
                      onChange={(e) =>
                        setForm({ ...form, externalRecipients: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Processors / vendors" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Cloud hosting provider, ticketing tool"
                      value={form.processors || ""}
                      onChange={(e) =>
                        setForm({ ...form, processors: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <Field label="Sharing details" hint="Optional">
                  <Textarea
                    disabled={readOnly}
                    rows={3}
                    placeholder="What is shared, under what contract, and for what purpose?"
                    value={form.recipientNotes || ""}
                    onChange={(e) =>
                      setForm({ ...form, recipientNotes: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}

            {/* Retention */}
            {stepKey === "RETENTION" && (
              <div className="grid gap-5">
                <Field
                  label="Retention period"
                  hint="How long is data kept?"
                  required
                >
                  <Input
                    disabled={readOnly}
                    placeholder="e.g., 30 days, then auto-deleted"
                    value={form.retentionPeriod || ""}
                    onChange={(e) =>
                      setForm({ ...form, retentionPeriod: e.target.value })
                    }
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Retention criteria" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Contract end + 7 years"
                      value={form.retentionCriteria || ""}
                      onChange={(e) =>
                        setForm({ ...form, retentionCriteria: e.target.value })
                      }
                    />
                  </Field>

                  <Field
                    label="Deletion / disposal method"
                    hint="How is it deleted?"
                    required
                  >
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Auto purge, secure wipe, shredding"
                      value={form.deletionMethod || ""}
                      onChange={(e) =>
                        setForm({ ...form, deletionMethod: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <Field label="Retention notes" hint="Optional">
                  <Textarea
                    disabled={readOnly}
                    rows={3}
                    placeholder="Exceptions, litigation hold, backups, etc."
                    value={form.retentionNotes || ""}
                    onChange={(e) =>
                      setForm({ ...form, retentionNotes: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}

            {/* Transfers (optional, but now multi-field) */}
            {stepKey === "TRANSFERS" && (
              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Are there cross-border transfers?"
                    hint="Optional"
                  >
                    <Select
                      disabled={readOnly}
                      value={form.hasTransfers || ""}
                      onChange={(e) =>
                        setForm({ ...form, hasTransfers: e.target.value })
                      }
                    >
                      <option value="">Select…</option>
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                      <option value="UNKNOWN">Unknown</option>
                    </Select>
                  </Field>

                  <Field label="Transfer mechanism" hint="Optional">
                    <Select
                      disabled={readOnly}
                      value={form.transferMechanism || ""}
                      onChange={(e) =>
                        setForm({ ...form, transferMechanism: e.target.value })
                      }
                    >
                      <option value="">Select…</option>
                      <option value="SCC">SCC / standard clauses</option>
                      <option value="ADEQUACY">Adequacy decision</option>
                      <option value="BCR">BCR</option>
                      <option value="CONSENT">Consent</option>
                      <option value="OTHER">Other</option>
                    </Select>
                  </Field>
                </div>

                <Field label="Countries / regions" hint="Optional">
                  <Input
                    disabled={readOnly}
                    placeholder="e.g., Singapore, EU, USA"
                    value={form.transferCountries || ""}
                    onChange={(e) =>
                      setForm({ ...form, transferCountries: e.target.value })
                    }
                  />
                </Field>

                <Field label="Safeguards" hint="Optional">
                  <Textarea
                    disabled={readOnly}
                    rows={3}
                    placeholder="Encryption, contractual clauses, access controls…"
                    value={form.transferSafeguards || ""}
                    onChange={(e) =>
                      setForm({ ...form, transferSafeguards: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}

            {/* Security */}
            {stepKey === "SECURITY" && (
              <div className="grid gap-5">
                <Field
                  label="Access controls"
                  hint="Who can access & how?"
                  required
                >
                  <Input
                    disabled={readOnly}
                    placeholder="e.g., RBAC, least privilege, MFA"
                    value={form.accessControls || ""}
                    onChange={(e) =>
                      setForm({ ...form, accessControls: e.target.value })
                    }
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Data protection" hint="Required" required>
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Encryption at rest/in transit"
                      value={form.dataProtection || ""}
                      onChange={(e) =>
                        setForm({ ...form, dataProtection: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Logging & monitoring" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Audit logs, SIEM alerts"
                      value={form.loggingMonitoring || ""}
                      onChange={(e) =>
                        setForm({ ...form, loggingMonitoring: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Physical security" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Badges, CCTV, locked server room"
                      value={form.physicalSecurity || ""}
                      onChange={(e) =>
                        setForm({ ...form, physicalSecurity: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Incident response" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., IR playbook, escalation process"
                      value={form.incidentResponse || ""}
                      onChange={(e) =>
                        setForm({ ...form, incidentResponse: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <Field label="Security notes" hint="Optional">
                  <Textarea
                    disabled={readOnly}
                    rows={3}
                    placeholder="Anything else important about controls…"
                    value={form.securityNotes || ""}
                    onChange={(e) =>
                      setForm({ ...form, securityNotes: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}

            {/* Rights */}
            {stepKey === "RIGHTS" && (
              <div className="grid gap-5">
                <Field
                  label="Request channels"
                  hint="How can individuals submit requests?"
                  required
                >
                  <Input
                    disabled={readOnly}
                    placeholder="e.g., Email, portal form, support ticket"
                    value={form.requestChannels || ""}
                    onChange={(e) =>
                      setForm({ ...form, requestChannels: e.target.value })
                    }
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Identity verification"
                    hint="How do you verify the requester?"
                    required
                  >
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., OTP + account checks, ID proof"
                      value={form.verificationProcess || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          verificationProcess: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field
                    label="Response timeline"
                    hint="Target response time"
                    required
                  >
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Within 30 days"
                      value={form.responseTimeline || ""}
                      onChange={(e) =>
                        setForm({ ...form, responseTimeline: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Responsible team" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., Privacy Office / Customer Support"
                      value={form.rightsOwnerTeam || ""}
                      onChange={(e) =>
                        setForm({ ...form, rightsOwnerTeam: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Escalation path" hint="Optional">
                    <Input
                      disabled={readOnly}
                      placeholder="e.g., DPO → Legal → Security"
                      value={form.escalationPath || ""}
                      onChange={(e) =>
                        setForm({ ...form, escalationPath: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <Field label="Rights handling notes" hint="Optional">
                  <Textarea
                    disabled={readOnly}
                    rows={3}
                    placeholder="Any exceptions, tooling, or process notes…"
                    value={form.rightsNotes || ""}
                    onChange={(e) =>
                      setForm({ ...form, rightsNotes: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}

            {/* Review */}
            {stepKey === "REVIEW" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-sm font-semibold text-slate-900">
                    RoPA Review & Approval
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Confirm all details before submission.
                  </div>
                </div>

                <pre className="rounded-2xl bg-slate-900 p-4 text-xs text-slate-100 overflow-auto ring-1 ring-slate-800">
                  {JSON.stringify(ropa?.formData || {}, null, 2)}
                </pre>

                <div className="text-xs text-slate-500">
                  After submitting, status becomes <b>SUBMITTED</b>.
                </div>
              </div>
            )}

            {err ? (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {err}
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="sticky bottom-3 z-10">
        <Card className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Page{" "}
              <span className="font-semibold text-slate-700">{idx + 1}</span> /{" "}
              {STEPS.length}
            </div>

            <div className="flex flex-wrap gap-2">
              <SolidSecondaryButton
                onClick={back}
                disabled={idx === 0 || busy}
                className="w-[150px]"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </SolidSecondaryButton>

              <SolidPrimaryButton
                onClick={saveCurrentStep}
                disabled={busy || readOnly}
                className="w-[150px]"
              >
                <Save className="h-4 w-4" />
                {busy ? "Saving..." : "Save"}
              </SolidPrimaryButton>

              {!isLast ? (
                <SolidPrimaryButton
                  onClick={next}
                  disabled={busy || readOnly}
                  className="w-[150px]"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </SolidPrimaryButton>
              ) : (
                <SolidPrimaryButton
                  onClick={submit}
                  disabled={busy || readOnly}
                  className="w-[150px]"
                >
                  <Send className="h-4 w-4" />
                  {readOnly ? "Submitted" : "Submit"}
                </SolidPrimaryButton>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
