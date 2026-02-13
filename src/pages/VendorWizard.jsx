import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  CheckCircle2,
  Save,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getVendor, saveVendorStep, submitVendor } from "../lib/admin";
import { VENDOR_CHECKLIST } from "../lib/vendorChecklist";

/* ------------------ helpers ------------------ */
const SCORE_MAP = { COMPLIANT: 2, PARTIAL: 1, NON_COMPLIANT: 0, NA: 0 };

function riskFromScore(score) {
  const n = Number(score ?? 0) || 0;
  if (n <= 20) return "HIGH";
  if (n <= 36) return "MEDIUM";
  return "LOW";
}

function pill(kind) {
  const s = String(kind || "").toUpperCase();
  const map = {
    DRAFT: "bg-slate-100 text-slate-800 ring-slate-200",
    IN_PROGRESS: "bg-amber-100 text-amber-900 ring-amber-200",
    COMPLETED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    HIGH: "bg-rose-100 text-rose-900 ring-rose-200",
    MEDIUM: "bg-amber-100 text-amber-900 ring-amber-200",
    LOW: "bg-slate-100 text-slate-800 ring-slate-200",
  };
  return map[s] || map.DRAFT;
}

function Field({ label, error, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-slate-700">{label}</label>
        {hint ? (
          <div className="text-[11px] font-medium text-slate-500">{hint}</div>
        ) : null}
      </div>
      <div className="mt-1">{children}</div>
      {error ? (
        <div className="mt-1 text-xs font-medium text-rose-600">{error}</div>
      ) : null}
    </div>
  );
}

function StepItem({ active, done, title, subtitle, icon: Icon, onClick }) {
  const base =
    "w-full rounded-xl shadow-md border px-3 py-3 text-left transition flex items-center gap-4";
  const style = active
    ? "border-indigo-200 bg-indigo-50 ring-1 ring-indigo-100"
    : done
      ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-50/70"
      : "border-slate-200 bg-white hover:bg-slate-50";

  return (
    <button onClick={onClick} className={[base, style].join(" ")} type="button">
      <div
        className={[
          "h-10 w-10 rounded-xl grid place-items-center ring-1",
          active
            ? "bg-indigo-600 text-white ring-indigo-200"
            : done
              ? "bg-emerald-600 text-white ring-emerald-200"
              : "bg-slate-50 text-slate-700 ring-slate-200",
        ].join(" ")}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="mt-0.5 text-xs font-medium text-slate-500">
          {subtitle}
        </div>
      </div>

      {done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
    </button>
  );
}

/* ------------------ validation ------------------ */
function validateGeneral(g) {
  const e = {};
  if (!String(g.vendorName || "").trim())
    e.vendorName = "Vendor Name is required.";
  if (!String(g.vendorContactName || "").trim())
    e.vendorContactName = "Vendor Contact Name is required.";
  if (!String(g.email || "").trim()) e.email = "Email is required.";
  if (g.email && !/^\S+@\S+\.\S+$/.test(g.email))
    e.email = "Enter a valid email.";
  return e;
}

/* ------------------ page ------------------ */
export default function VendorWizard() {
  const { id } = useParams();
  const nav = useNavigate();

  const [item, setItem] = useState(null);
  const [step, setStep] = useState("GENERAL");
  const [saving, setSaving] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const [general, setGeneral] = useState({
    vendorName: "",
    vendorContactName: "",
    jobTitle: "",
    email: "",
    services: "",
    assessmentDate: "",
  });

  const [checklist, setChecklist] = useState({ answers: {} });

  const [decision, setDecision] = useState({
    compliantStatement: "",
    recommendations: [{ area: "", action: "", targetDate: "" }],
    notes: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      const data = await getVendor(id);
      setItem(data);
      setStep(data.currentStep || "GENERAL");

      const fd = data.formData || {};
      setGeneral(fd.general || general);
      setChecklist(fd.checklist || { answers: {} });
      setDecision(fd.decision || decision);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totalScore = useMemo(() => {
    const ans = checklist?.answers || {};
    return Object.values(ans).reduce(
      (sum, v) => sum + (SCORE_MAP[v?.status] ?? 0),
      0,
    );
  }, [checklist]);

  const risk = useMemo(() => riskFromScore(totalScore), [totalScore]);
  const status = String(item?.status || "DRAFT").toUpperCase();

  const doneMap = useMemo(() => {
    const d = {};
    d.GENERAL = Object.keys(validateGeneral(general)).length === 0;
    d.CHECKLIST = true; // allow partial completion
    d.DECISION = Boolean(String(decision.compliantStatement || "").trim());
    return d;
  }, [general, decision]);

  async function saveCurrent(nextStep) {
    setSaving(true);
    try {
      if (step === "GENERAL") {
        const e = validateGeneral(general);
        setErrors(e);
        if (Object.keys(e).length && nextStep) return;
        await saveVendorStep(id, "GENERAL", general);
      }
      if (step === "CHECKLIST") {
        await saveVendorStep(id, "CHECKLIST", checklist);
      }
      if (step === "DECISION") {
        await saveVendorStep(id, "DECISION", decision);
      }
      if (nextStep) setStep(nextStep);
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit() {
    setSaving(true);
    try {
      await saveVendorStep(id, "DECISION", decision);
      await submitVendor(id);
      const e = validateGeneral(general);
      setErrors(e);
      if (Object.keys(e).length) {
        setStep("GENERAL");
        return;
      }


      // redirect to list after submit (requested)
      nav("/admin/vendor");
    } finally {
      setSaving(false);
    }
  }

  if (!item) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-medium text-slate-500">Loading...</div>
      </div>
    );
  }

  const steps = [
    {
      key: "GENERAL",
      title: "General Information",
      subtitle: "Vendor identity & scope",
      icon: FileText,
    },
    {
      key: "CHECKLIST",
      title: "Assessment Checklist",
      subtitle: "Questions & scoring",
      icon: ClipboardList,
    },
    {
      key: "DECISION",
      title: "Decision",
      subtitle: "Outcome & actions",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      {/* topper */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-rose-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-2xl font-semibold">
                {item.title || "Third Party Agreement"}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1",
                    pill(status),
                  ].join(" ")}
                >
                  {status}
                </span>
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1",
                    pill(risk),
                  ].join(" ")}
                >
                  {risk} RISK
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25">
                  <ShieldAlert className="h-4 w-4" />
                  Score: {totalScore}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => nav("/admin/vendor")}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium ring-1 ring-white/30 hover:bg-white/20"
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-500 to-rose-600" />
      </div>

      {/* layout */}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* left stepper */}
        <div className="space-y-3">
          {steps?.map((s) => (
            <StepItem
              key={s.key}
              active={step === s.key}
              done={Boolean(doneMap[s.key])}
              title={s.title}
              subtitle={s.subtitle}
              icon={s.icon}
              onClick={() => setStep(s.key)}
            />
          ))}

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-indigo-800">
              Quick Summary
            </div>
            <div className="mt-2 grid gap-2 text-sm font-medium text-slate-600">
              <div className="flex items-center justify-between">
                <span>Total Score</span>
                <span className="font-bold text-slate-900">{totalScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Risk</span>
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1",
                    pill(risk),
                  ].join(" ")}
                >
                  {risk}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1",
                    pill(status),
                  ].join(" ")}
                >
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* right content */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
          {/* header */}
          <div className="flex items-center bg-indigo-600 justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <div className="text-sm font-bold text-white">
                {step === "GENERAL"
                  ? "General Information"
                  : step === "CHECKLIST"
                    ? "Assessment Checklist"
                    : "Decision"}
              </div>
              <div className="text-xs font-medium text-white/80">
                {step === "GENERAL"
                  ? "Capture vendor information before assessing controls."
                  : step === "CHECKLIST"
                    ? "Record responses and select compliance status."
                    : "Finalize compliance position and remediation actions."}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {step !== "GENERAL" ? (
                <button
                  onClick={() =>
                    setStep(step === "DECISION" ? "CHECKLIST" : "GENERAL")
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
              ) : null}

              {step !== "DECISION" ? (
                <button
                  onClick={() =>
                    saveCurrent(step === "GENERAL" ? "CHECKLIST" : "DECISION")
                  }
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-500 px-2 py-1 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {/* body */}
          <div className="p-5">
            {step === "GENERAL" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Vendor Name" error={errors.vendorName}>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                    value={general.vendorName}
                    onChange={(e) =>
                      setGeneral({ ...general, vendorName: e.target.value })
                    }
                  />
                </Field>

                <Field
                  label="Vendor Contact Name"
                  error={errors.vendorContactName}
                >
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                    value={general.vendorContactName}
                    onChange={(e) =>
                      setGeneral({
                        ...general,
                        vendorContactName: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Job Title">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                    value={general.jobTitle}
                    onChange={(e) =>
                      setGeneral({ ...general, jobTitle: e.target.value })
                    }
                  />
                </Field>

                <Field label="Email Address" error={errors.email}>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                    value={general.email}
                    onChange={(e) =>
                      setGeneral({ ...general, email: e.target.value })
                    }
                  />
                </Field>

                <Field label="Date of Assessment">
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                    value={general.assessmentDate}
                    onChange={(e) =>
                      setGeneral({
                        ...general,
                        assessmentDate: e.target.value,
                      })
                    }
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="Description of Services / Products Offered"
                    hint="Short, clear scope description"
                  >
                    <textarea
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                      value={general.services}
                      onChange={(e) =>
                        setGeneral({ ...general, services: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => saveCurrent()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>

                  <button
                    onClick={() => saveCurrent("CHECKLIST")}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {step === "CHECKLIST" ? (
              <div className="space-y-4">
                {VENDOR_CHECKLIST?.map((sec) => (
                  <div
                    key={sec.id}
                    className="overflow-hidden rounded-xl border border-slate-200"
                  >
                    <div className="border-b border-slate-200 bg-indigo-100 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {sec.title}
                      </div>
                      <div className="text-xs font-medium text-slate-500">
                        Fill vendor response and select compliance status.
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-100">
                          <tr className="text-left text-xs font-medium text-slate-600">
                            <th className="px-4 py-3 w-[34%]">Question</th>
                            <th className="px-4 py-3 w-[36%]">
                              Vendor Response
                            </th>
                            <th className="px-4 py-3 w-[20%]">
                              Status of Compliance
                            </th>
                            <th className="px-4 py-3 w-[10%]">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sec.questions.map((q) => {
                            const a = checklist.answers?.[q.id] || {};
                            const score = SCORE_MAP[a.status] ?? 0;

                            return (
                              <tr
                                key={q.id}
                                className="border-t border-slate-100 align-top hover:bg-slate-50/60"
                              >
                                <td className="px-4 py-4 text-sm font-medium text-slate-800">
                                  {q.text}
                                </td>

                                <td className="px-4 py-4">
                                  <textarea
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                                    value={a.vendorResponse || ""}
                                    onChange={(e) =>
                                      setChecklist((prev) => ({
                                        ...prev,
                                        answers: {
                                          ...(prev.answers || {}),
                                          [q.id]: {
                                            ...a,
                                            vendorResponse: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </td>

                                <td className="px-4 py-4">
                                  <select
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                                    value={a.status || ""}
                                    onChange={(e) =>
                                      setChecklist((prev) => ({
                                        ...prev,
                                        answers: {
                                          ...(prev.answers || {}),
                                          [q.id]: {
                                            ...a,
                                            status: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                  >
                                    <option value="">Select…</option>
                                    <option value="COMPLIANT">
                                      Compliant (2)
                                    </option>
                                    <option value="PARTIAL">
                                      Partially Compliant (1)
                                    </option>
                                    <option value="NON_COMPLIANT">
                                      Non-Compliant (0)
                                    </option>
                                    <option value="NA">N/A (0)</option>
                                  </select>

                                  <div className="mt-2 text-[11px] font-medium text-slate-500">
                                    Score is auto-calculated.
                                  </div>
                                </td>

                                <td className="px-4 py-4 text-sm font-bold text-slate-900">
                                  {score}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep("GENERAL")}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => saveCurrent("DECISION")}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {step === "DECISION" ? (
              <div className="space-y-4">
                <Field label="Compliance Statement" hint="Required">
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                    value={decision.compliantStatement || ""}
                    onChange={(e) =>
                      setDecision({
                        ...decision,
                        compliantStatement: e.target.value,
                      })
                    }
                  >
                    <option value="">Select…</option>
                    <option value="COMPLIANT">Compliant</option>
                    <option value="PARTIAL_OR_NON">
                      Partially Compliant / Non-Compliant
                    </option>
                  </select>
                </Field>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">
                    Recommendations / Required Actions
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    Track actions and target dates.
                  </div>

                  <div className="mt-3 space-y-2">
                    {(decision.recommendations || []).map((r, idx) => (
                      <div
                        key={idx}
                        className="grid gap-2 md:grid-cols-[1fr_2fr_180px_44px]"
                      >
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                          placeholder="Area of concern"
                          value={r.area}
                          onChange={(e) => {
                            const next = [...decision.recommendations];
                            next[idx] = { ...r, area: e.target.value };
                            setDecision({ ...decision, recommendations: next });
                          }}
                        />
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                          placeholder="Required action"
                          value={r.action}
                          onChange={(e) => {
                            const next = [...decision.recommendations];
                            next[idx] = { ...r, action: e.target.value };
                            setDecision({ ...decision, recommendations: next });
                          }}
                        />
                        <input
                          type="date"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                          value={r.targetDate}
                          onChange={(e) => {
                            const next = [...decision.recommendations];
                            next[idx] = { ...r, targetDate: e.target.value };
                            setDecision({ ...decision, recommendations: next });
                          }}
                        />
                        <button
                          onClick={() => {
                            const next = decision.recommendations.filter(
                              (_, i) => i !== idx,
                            );
                            setDecision({
                              ...decision,
                              recommendations: next.length
                                ? next
                                : [{ area: "", action: "", targetDate: "" }],
                            });
                          }}
                          className="grid place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          title="Remove row"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() =>
                        setDecision({
                          ...decision,
                          recommendations: [
                            ...(decision.recommendations || []),
                            { area: "", action: "", targetDate: "" },
                          ],
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      + Add row
                    </button>
                  </div>
                </div>

                <Field label="Notes">
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                    value={decision.notes || ""}
                    onChange={(e) =>
                      setDecision({ ...decision, notes: e.target.value })
                    }
                  />
                </Field>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep("CHECKLIST")}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveCurrent()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>

                    <button
                      onClick={onSubmit}
                      disabled={saving || status === "COMPLETED"}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* completed modal */}
      {showDone ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          onClick={() => setShowDone(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold text-slate-900">
              Agreement Completed
            </div>
            <div className="mt-1 text-sm font-medium text-slate-500">
              Your third-party agreement assessment has been completed.
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1",
                  pill("COMPLETED"),
                ].join(" ")}
              >
                COMPLETED
              </span>
              <span
                className={[
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1",
                  pill(risk),
                ].join(" ")}
              >
                {risk} RISK
              </span>
              <span className="text-sm font-bold text-slate-900">
                Score: {totalScore}
              </span>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => nav(`/admin/vendor`)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Back to list
              </button>
              <button
                onClick={() => setShowDone(false)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
