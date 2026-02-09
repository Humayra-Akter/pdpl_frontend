import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDpia, saveDpiaStep, submitDpia } from "../lib/admin";
import {
  ClipboardList,
  Database,
  ShieldAlert,
  SlidersHorizontal,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  ArrowLeft,
} from "lucide-react";

const STEPS = [
  { key: "OVERVIEW", label: "Overview", icon: ClipboardList },
  { key: "PROCESSING", label: "Processing", icon: Database },
  { key: "RISK", label: "Risk Analysis", icon: ShieldAlert },
  { key: "CONTROLS", label: "Controls", icon: SlidersHorizontal },
  { key: "SUMMARY", label: "Summary", icon: FileCheck2 },
];

function stepIndex(key) {
  const i = STEPS.findIndex((s) => s.key === key);
  return i >= 0 ? i : 0;
}

function statusBadge(status = "DRAFT") {
  const map = {
    DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
    IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-200",
    SUBMITTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    IN_REVIEW: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
    NEED_INFO: "bg-orange-50 text-orange-700 ring-orange-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  return map[status] || "bg-slate-100 text-slate-700 ring-slate-200";
}

function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200",
        "transition-all duration-200",
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
        "outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100",
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
        "outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100",
        props.className || "",
      ].join(" ")}
    />
  );
}

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
        "shadow-sm transition hover:opacity-95 disabled:opacity-60",
        "bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800",
        "transition hover:bg-slate-50 disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function DpiaWizard() {
  const { id } = useParams();
  const nav = useNavigate();

  const [dpia, setDpia] = useState(null);
  const [stepKey, setStepKey] = useState("OVERVIEW");
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // load DPIA
  useEffect(() => {
    let alive = true;
    setErr("");
    setDpia(null);

    getDpia(id)
      .then((res) => {
        if (!alive) return;
        const d = res?.dpia;
        setDpia(d);

        const initialStep = d?.currentStep || "OVERVIEW";
        setStepKey(initialStep);
        setForm(d?.formData?.[initialStep] || {});
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message || "Failed to load DPIA");
      });

    return () => {
      alive = false;
    };
  }, [id]);

  function gotoStep(nextKey) {
    if (!dpia) return;
    setStepKey(nextKey);
    setForm(dpia?.formData?.[nextKey] || {});
  }

  async function saveCurrentStep() {
    setBusy(true);
    setErr("");
    try {
      const res = await saveDpiaStep(id, stepKey, form);
      setDpia(res?.dpia);
    } catch (e) {
      setErr(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    const idx = stepIndex(stepKey);
    const nextKey = STEPS[Math.min(STEPS.length - 1, idx + 1)].key;
    await saveCurrentStep();
    gotoStep(nextKey);
  }

  function back() {
    const idx = stepIndex(stepKey);
    const prevKey = STEPS[Math.max(0, idx - 1)].key;
    gotoStep(prevKey);
  }

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const res = await submitDpia(id);
      setDpia(res?.dpia);
      gotoStep("SUMMARY");
    } catch (e) {
      setErr(e?.message || "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  if (!dpia && !err) {
    return (
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-48 rounded bg-slate-100" />
          <div className="h-8 w-2/3 rounded bg-slate-100" />
          <div className="h-24 w-full rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-rose-700">
              DPIA failed
            </div>
            <div className="mt-1 text-sm text-slate-600">{err}</div>
          </div>
          <SecondaryButton onClick={() => nav("/admin/dpia")}>
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </SecondaryButton>
        </div>
      </Card>
    );
  }

  const idx = stepIndex(stepKey);
  const isLast = stepKey === "SUMMARY";
  const progress = Math.max(0, Math.min(100, Number(dpia?.progress ?? 0)));

  const currentStepMeta = STEPS[idx];
  const CurrentIcon = currentStepMeta?.icon || ClipboardList;

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">DPIA Assessment</div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              DPIA for customer onboarding
            </h1>

            {/* Meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                Status: SUBMITTED
              </span>

              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-800">
                Progress: 100%
              </span>

              <span className="text-slate-500">Last updated: just now</span>
            </div>
          </div>

          <button
            onClick={() => nav("/admin/dpia")}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Back to list
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-800"
              style={{ width: "100%" }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            All steps completed and submitted
          </div>
        </div>
      </div>

      {/* Stepper */}
      <Card className="p-4">
        <div className="grid gap-2 md:grid-cols-5">
          {STEPS.map((s, i) => {
            const active = s.key === stepKey;
            const done = i < idx;
            const Icon = s.icon;

            return (
              <button
                key={s.key}
                onClick={() => gotoStep(s.key)}
                className={[
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-left",
                  "ring-1 transition",
                  active
                    ? "bg-indigo-50 ring-indigo-200"
                    : "bg-white ring-slate-200 hover:bg-slate-50",
                ].join(" ")}
              >
                <div
                  className={[
                    "grid h-10 w-10 place-items-center rounded-xl ring-1 transition",
                    active
                      ? "bg-indigo-600 text-white ring-indigo-700"
                      : done
                        ? "bg-emerald-600 text-white ring-emerald-700"
                        : "bg-slate-100 text-slate-700 ring-slate-200 group-hover:bg-slate-200",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="text-xs text-slate-500">Step {i + 1}</div>
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {s.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Content */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">Current step</div>
              <div className="text-lg font-bold text-slate-900">
                {currentStepMeta?.label}
              </div>
            </div>

            <span
              className={[
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                statusBadge(dpia?.status),
              ].join(" ")}
            >
              {dpia?.status || "DRAFT"}
            </span>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* OVERVIEW */}
          {stepKey === "OVERVIEW" && (
            <div className="grid gap-5">
              <Field
                label="DPIA Title"
                required
                hint="Give a short descriptive name"
              >
                <Input
                  placeholder="e.g., DPIA for Customer Onboarding"
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>

              <Field
                label="Project context"
                hint="What is the project and why is data processed?"
              >
                <Textarea
                  rows={5}
                  placeholder="Explain the purpose, scope, teams involved, and timeline..."
                  value={form.context || ""}
                  onChange={(e) =>
                    setForm({ ...form, context: e.target.value })
                  }
                />
              </Field>
            </div>
          )}

          {/* PROCESSING */}
          {stepKey === "PROCESSING" && (
            <div className="grid gap-5">
              <Field
                label="Processing purpose"
                hint="Why are you collecting/using this data?"
              >
                <Textarea
                  rows={4}
                  placeholder="Describe the lawful purpose and expected outcomes..."
                  value={form.purpose || ""}
                  onChange={(e) =>
                    setForm({ ...form, purpose: e.target.value })
                  }
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Data categories" hint="Comma separated">
                  <Input
                    placeholder="e.g., name, email, phone, address"
                    value={form.dataCategories || ""}
                    onChange={(e) =>
                      setForm({ ...form, dataCategories: e.target.value })
                    }
                  />
                </Field>

                <Field
                  label="Systems / apps involved"
                  hint="Where the data is processed"
                >
                  <Input
                    placeholder="e.g., CRM, onboarding portal, ticketing system"
                    value={form.systems || ""}
                    onChange={(e) =>
                      setForm({ ...form, systems: e.target.value })
                    }
                  />
                </Field>
              </div>
            </div>
          )}

          {/* RISK */}
          {stepKey === "RISK" && (
            <div className="grid gap-5">
              <Field
                label="Key risks"
                hint="What can go wrong for individuals?"
              >
                <Textarea
                  rows={5}
                  placeholder="List risks like unauthorized access, over-collection, misidentification..."
                  value={form.risks || ""}
                  onChange={(e) => setForm({ ...form, risks: e.target.value })}
                />
              </Field>

              <Field
                label="Likelihood / impact notes"
                hint="Explain severity and probability"
              >
                <Textarea
                  rows={4}
                  placeholder="Explain risk likelihood, impact, and which users could be affected..."
                  value={form.analysis || ""}
                  onChange={(e) =>
                    setForm({ ...form, analysis: e.target.value })
                  }
                />
              </Field>
            </div>
          )}

          {/* CONTROLS */}
          {stepKey === "CONTROLS" && (
            <div className="grid gap-5">
              <Field
                label="Mitigations / controls"
                hint="What controls reduce the risks?"
              >
                <Textarea
                  rows={5}
                  placeholder="e.g., role-based access, encryption, retention limits, audit logs..."
                  value={form.controls || ""}
                  onChange={(e) =>
                    setForm({ ...form, controls: e.target.value })
                  }
                />
              </Field>

              <Field
                label="Residual risk decision"
                hint="What is acceptable after controls?"
              >
                <Input
                  placeholder="e.g., Acceptable with monitoring / Needs redesign"
                  value={form.residual || ""}
                  onChange={(e) =>
                    setForm({ ...form, residual: e.target.value })
                  }
                />
              </Field>
            </div>
          )}

          {/* SUMMARY */}
          {stepKey === "SUMMARY" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-sm font-semibold text-slate-900">
                  Review snapshot
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Confirm the information below before final submission.
                </div>
              </div>

              <pre className="rounded-2xl bg-slate-900 p-4 text-xs text-slate-100 overflow-auto ring-1 ring-slate-800">
                {JSON.stringify(dpia.formData, null, 2)}
              </pre>

              <div className="text-xs text-slate-500">
                After submitting, status becomes <b>SUBMITTED</b> and progress
                becomes <b>100%</b>.
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

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={back}
          disabled={idx === 0 || busy}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          Back
        </button>

        <div className="flex gap-2">
          <button
            onClick={saveCurrentStep}
            disabled={busy}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Save
          </button>

          {!isLast ? (
            <button
              onClick={next}
              disabled={busy}
              className="rounded-xl bg-blue-800 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={busy || dpia.status === "SUBMITTED"}
              className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              Submitted
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
