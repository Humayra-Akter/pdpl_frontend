// import { useEffect, useMemo, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   CheckCircle2,
//   ClipboardList,
//   Shield,
//   ShieldAlert,
//   Bell,
//   Activity,
//   MessageCircle,
//   Save,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import {
//   getIncident,
//   updateIncident,
//   closeIncident,
//   listIncidentComments,
//   addIncidentComment,
// } from "../lib/admin";

// /* ------------------ helpers ------------------ */
// function fmtDateOnly(v) {
//   try {
//     if (!v) return "—";
//     const d = new Date(v);
//     const parts = new Intl.DateTimeFormat("en-GB", {
//       day: "numeric",
//       month: "short",
//       year: "numeric",
//     }).formatToParts(d);
//     const day = parts.find((p) => p.type === "day")?.value ?? "";
//     const month = parts.find((p) => p.type === "month")?.value ?? "";
//     const year = parts.find((p) => p.type === "year")?.value ?? "";
//     return `${day}-${month}-${year}`;
//   } catch {
//     return "—";
//   }
// }

// function fmtTimeOnly(v) {
//   try {
//     if (!v) return "";
//     return new Date(v).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   } catch {
//     return "";
//   }
// }

// function toDatetimeLocalValue(v) {
//   // works with ISO date strings
//   try {
//     if (!v) return "";
//     const d = new Date(v);
//     const pad = (n) => String(n).padStart(2, "0");
//     const yyyy = d.getFullYear();
//     const mm = pad(d.getMonth() + 1);
//     const dd = pad(d.getDate());
//     const hh = pad(d.getHours());
//     const mi = pad(d.getMinutes());
//     return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
//   } catch {
//     return "";
//   }
// }

// function fromDatetimeLocalValue(v) {
//   // returns ISO string
//   try {
//     if (!v) return null;
//     const d = new Date(v);
//     return d.toISOString();
//   } catch {
//     return null;
//   }
// }

// function clampInt(v, min, max) {
//   const n = Number(v);
//   if (Number.isNaN(n)) return null;
//   return Math.max(min, Math.min(max, Math.trunc(n)));
// }

// function pillStatus(status = "DRAFT") {
//   const s = String(status).toUpperCase();
//   const map = {
//     DRAFT: "bg-slate-100 text-slate-800 ring-slate-200",
//     IN_PROGRESS: "bg-amber-100 text-amber-900 ring-amber-200",
//     IN_REVIEW: "bg-indigo-100 text-indigo-900 ring-indigo-200",
//     CLOSED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
//   };
//   return map[s] || map.DRAFT;
// }

// function pillSeverity(sev = "LOW") {
//   const s = String(sev).toUpperCase();
//   const map = {
//     LOW: "bg-slate-100 text-slate-800 ring-slate-200",
//     MEDIUM: "bg-amber-100 text-amber-900 ring-amber-200",
//     HIGH: "bg-orange-100 text-orange-900 ring-orange-200",
//     CRITICAL: "bg-rose-100 text-rose-900 ring-rose-200",
//   };
//   return map[s] || map.LOW;
// }

// /* ------------------ required validation per step ------------------ */
// function validateStep(stepKey, draft) {
//   const e = {};

//   const title = (draft.title || "").trim();
//   if (stepKey === "OVERVIEW") {
//     if (!title) e.title = "Title is required.";
//     if (!draft.category) e.category = "Category is required.";
//     if (!draft.severity) e.severity = "Severity is required.";

//     // Excel-style: reported date/time is important (at least for tracking)
//     if (!draft.reportedAt) e.reportedAt = "Reported date/time is required.";

//     // Numeric validation (number-only)
//     if (draft.affectedCount != null && draft.affectedCount !== "") {
//       const n = clampInt(draft.affectedCount, 0, 1000000000);
//       if (n == null) e.affectedCount = "Affected count must be a number.";
//     }
//   }

//   if (stepKey === "RISK") {
//     const impact = clampInt(draft.riskImpact, 1, 5);
//     const likelihood = clampInt(draft.riskLikelihood, 1, 5);

//     if (impact == null) e.riskImpact = "Impact must be a number (1–5).";
//     if (likelihood == null)
//       e.riskLikelihood = "Likelihood must be a number (1–5).";

//     if (!String(draft.riskRationale || "").trim()) {
//       e.riskRationale = "Rationale is required.";
//     }
//   }

//   if (stepKey === "MITIGATION") {
//     if (!String(draft.rootCause || "").trim())
//       e.rootCause = "Root cause is required.";
//     if (!String(draft.remediation || "").trim())
//       e.remediation = "Remediation/mitigation is required.";

//     // Containment actions should exist (at least 1)
//     const actions = Array.isArray(draft.actions) ? draft.actions : [];
//     if (actions.length === 0)
//       e.actions = "Add at least one containment action.";
//     else if (actions.some((a) => !String(a?.text || "").trim())) {
//       e.actions = "Containment action text cannot be empty.";
//     }
//   }

//   if (stepKey === "NOTIFICATIONS") {
//     // If breach + high/critical -> require reportedAt (already) AND regulator decision
//     const sev = String(draft.severity || "").toUpperCase();
//     if (draft.isBreach && (sev === "HIGH" || sev === "CRITICAL")) {
//       if (
//         draft.regulatorNotifiable !== true &&
//         draft.regulatorNotifiable !== false
//       ) {
//         e.regulatorNotifiable = "Select if regulator notification is required.";
//       }
//       if (draft.regulatorNotifiable === true && !draft.regulatorNotifiedAt) {
//         e.regulatorNotifiedAt = "Regulator notified date/time is required.";
//       }
//     }

//     // data subject notified requires date if yes
//     if (draft.dataSubjectsNotified === true && !draft.dataSubjectsNotifiedAt) {
//       e.dataSubjectsNotifiedAt =
//         "Data subjects notified date/time is required.";
//     }
//   }

//   return e;
// }

// /* ------------------ UI atoms ------------------ */
// function Field({ label, error, children, hint }) {
//   return (
//     <div>
//       <div className="flex items-center justify-between gap-3">
//         <label className="text-xs font-bold text-slate-700">{label}</label>
//         {hint ? (
//           <div className="text-[11px] font-semibold text-slate-500">{hint}</div>
//         ) : null}
//       </div>
//       <div className="mt-1">{children}</div>
//       {error ? (
//         <div className="mt-1 text-xs font-bold text-rose-600">{error}</div>
//       ) : null}
//     </div>
//   );
// }

// function StepItem({
//   active,
//   done,
//   title,
//   subtitle,
//   icon: Icon,
//   onClick,
//   disabled,
// }) {
//   const base =
//     "w-full rounded-2xl border px-4 py-4 text-left transition flex items-center gap-4";
//   const style = disabled
//     ? "border-slate-200 bg-white/60 opacity-60 cursor-not-allowed"
//     : active
//       ? "border-indigo-200 bg-indigo-50 ring-4 ring-indigo-100"
//       : done
//         ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-50/70"
//         : "border-slate-200 bg-white hover:bg-slate-50";

//   return (
//     <button
//       onClick={disabled ? undefined : onClick}
//       className={[base, style].join(" ")}
//       type="button"
//     >
//       <div
//         className={[
//           "h-12 w-12 rounded-2xl grid place-items-center ring-1",
//           active
//             ? "bg-indigo-600 text-white ring-indigo-200"
//             : done
//               ? "bg-emerald-600 text-white ring-emerald-200"
//               : "bg-slate-50 text-slate-700 ring-slate-200",
//         ].join(" ")}
//       >
//         <Icon className="h-5 w-5" />
//       </div>

//       <div className="min-w-0 flex-1">
//         <div className="text-sm font-bold text-slate-900">{title}</div>
//         <div className="text-xs font-semibold text-slate-600">{subtitle}</div>
//       </div>

//       <div className="text-right">
//         {done ? (
//           <div className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
//             <CheckCircle2 className="h-4 w-4" />
//             Done
//           </div>
//         ) : null}
//       </div>
//     </button>
//   );
// }

// /* ------------------ page ------------------ */
// export default function IncidentDetails() {
//   const nav = useNavigate();
//   const { id } = useParams();

//   const STEPS = useMemo(
//     () => [
//       {
//         key: "OVERVIEW",
//         title: "Step 1 • Overview",
//         subtitle: "Core incident info",
//         icon: ClipboardList,
//       },
//       {
//         key: "RISK",
//         title: "Step 2 • Risk",
//         subtitle: "Impact & likelihood",
//         icon: Shield,
//       },
//       {
//         key: "MITIGATION",
//         title: "Step 3 • Mitigation",
//         subtitle: "Containment & remediation",
//         icon: ShieldAlert,
//       },
//       {
//         key: "NOTIFICATIONS",
//         title: "Step 4 • Notifications",
//         subtitle: "Channels & dates",
//         icon: Bell,
//       },
//       {
//         key: "AUDIT",
//         title: "Step 5 • Audit",
//         subtitle: "Timeline (read-only)",
//         icon: Activity,
//       },
//       {
//         key: "COMMENTS",
//         title: "Step 6 • Comments",
//         subtitle: "Internal discussion",
//         icon: MessageCircle,
//       },
//     ],
//     [],
//   );

//   const [incident, setIncident] = useState(null);
//   const [activeStep, setActiveStep] = useState("OVERVIEW");

//   const [draft, setDraft] = useState({
//     title: "",
//     category: "OTHER",
//     severity: "LOW",
//     status: "DRAFT",
//     isBreach: false,

//     occurredAt: "",
//     detectedAt: "",
//     reportedAt: "",
//     dueAt: "",

//     systemsAffected: "",
//     affectedCount: "",

//     // risk (excel: impact/likelihood)
//     riskImpact: 3,
//     riskLikelihood: 3,
//     riskRationale: "",

//     // mitigation/containment (excel-like)
//     rootCause: "",
//     remediation: "",
//     lessonsLearned: "",
//     actions: [{ text: "", done: false }],

//     // notifications + requests
//     regulatorNotifiable: null, // null until chosen
//     regulatorNotifiedAt: "",
//     dataSubjectsNotified: false,
//     dataSubjectsNotifiedAt: "",
//     requestId: "", // “Request” visibility
//   });

//   const [stepErrors, setStepErrors] = useState({});
//   const [busy, setBusy] = useState(false);
//   const [err, setErr] = useState("");

//   const [comments, setComments] = useState([]);
//   const [commentText, setCommentText] = useState("");
//   const [commentBusy, setCommentBusy] = useState(false);

//   const stepIndex = STEPS.findIndex((s) => s.key === activeStep);
//   const isFirst = stepIndex <= 0;
//   const isLast = stepIndex >= STEPS.length - 1;

//   const breachWarning = useMemo(() => {
//     const s = String(draft.severity || "").toUpperCase();
//     return (
//       Boolean(draft.isBreach) &&
//       (s === "HIGH" || s === "CRITICAL") &&
//       !draft.reportedAt
//     );
//   }, [draft.isBreach, draft.severity, draft.reportedAt]);

//   const stepDone = useMemo(() => {
//     // completion = validation passes (no errors) for that step
//     const map = {};
//     for (const st of STEPS) {
//       const e = validateStep(st.key, draft);
//       map[st.key] = Object.keys(e).length === 0;
//     }
//     return map;
//   }, [STEPS, draft]);

//   const maxClickableIndex = useMemo(() => {
//     // You can click up to the first NOT-done step + current
//     let i = 0;
//     for (; i < STEPS.length; i++) {
//       if (!stepDone[STEPS[i].key]) break;
//     }
//     return Math.min(i + 1, STEPS.length - 1);
//   }, [STEPS, stepDone]);

//   async function load() {
//     setBusy(true);
//     setErr("");
//     try {
//       const res = await getIncident(id);
//       const inc = res?.incident || res;
//       setIncident(inc);

//       const risk = inc?.risk || {};
//       const containment = inc?.containment || {};
//       const notifications = inc?.notifications || {};

//       setDraft((d) => ({
//         ...d,
//         title: inc?.title || "",
//         category: inc?.category || "OTHER",
//         severity: inc?.severity || "LOW",
//         status: inc?.status || "DRAFT",
//         isBreach: Boolean(inc?.isBreach),

//         occurredAt: toDatetimeLocalValue(inc?.occurredAt),
//         detectedAt: toDatetimeLocalValue(inc?.detectedAt),
//         reportedAt: toDatetimeLocalValue(inc?.reportedAt),
//         dueAt: toDatetimeLocalValue(inc?.dueAt),

//         systemsAffected: inc?.systemsAffected || "",
//         affectedCount: inc?.affectedCount ?? "",

//         riskImpact: risk?.impact ?? 3,
//         riskLikelihood: risk?.likelihood ?? 3,
//         riskRationale: risk?.rationale ?? "",

//         rootCause: containment?.rootCause ?? "",
//         remediation: containment?.remediation ?? "",
//         lessonsLearned: containment?.lessonsLearned ?? "",
//         actions:
//           Array.isArray(containment?.actions) && containment.actions.length
//             ? containment.actions
//             : [{ text: "", done: false }],

//         regulatorNotifiable: notifications?.regulatorNotifiable ?? null,
//         regulatorNotifiedAt: toDatetimeLocalValue(
//           notifications?.regulatorNotifiedAt,
//         ),
//         dataSubjectsNotified: Boolean(notifications?.dataSubjectsNotified),
//         dataSubjectsNotifiedAt: toDatetimeLocalValue(
//           notifications?.dataSubjectsNotifiedAt,
//         ),
//         requestId: notifications?.requestId ?? "",
//       }));

//       // comments
//       try {
//         const cr = await listIncidentComments(id);
//         setComments(cr?.items || cr?.comments || []);
//       } catch {
//         setComments([]);
//       }
//     } catch (e) {
//       setErr(e?.message || "Failed to load incident");
//     } finally {
//       setBusy(false);
//     }
//   }

//   useEffect(() => {
//     load();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id]);

//   async function saveCurrentStep() {
//     const e = validateStep(activeStep, draft);
//     setStepErrors(e);
//     if (Object.keys(e).length > 0) return false;

//     setBusy(true);
//     setErr("");
//     try {
//       const payload = {
//         title: draft.title.trim(),
//         category: draft.category,
//         severity: draft.severity,
//         isBreach: Boolean(draft.isBreach),

//         occurredAt: fromDatetimeLocalValue(draft.occurredAt),
//         detectedAt: fromDatetimeLocalValue(draft.detectedAt),
//         reportedAt: fromDatetimeLocalValue(draft.reportedAt),
//         dueAt: fromDatetimeLocalValue(draft.dueAt),

//         systemsAffected: draft.systemsAffected || null,
//         affectedCount:
//           draft.affectedCount === "" || draft.affectedCount == null
//             ? null
//             : clampInt(draft.affectedCount, 0, 1000000000),

//         risk: {
//           impact: clampInt(draft.riskImpact, 1, 5),
//           likelihood: clampInt(draft.riskLikelihood, 1, 5),
//           rationale: String(draft.riskRationale || ""),
//         },

//         containment: {
//           rootCause: String(draft.rootCause || ""),
//           remediation: String(draft.remediation || ""),
//           lessonsLearned: String(draft.lessonsLearned || ""),
//           actions: (Array.isArray(draft.actions) ? draft.actions : []).map(
//             (a) => ({
//               text: String(a?.text || ""),
//               done: Boolean(a?.done),
//             }),
//           ),
//           done: (Array.isArray(draft.actions) ? draft.actions : []).every((a) =>
//             Boolean(a?.done),
//           ),
//         },

//         notifications: {
//           regulatorNotifiable: draft.regulatorNotifiable,
//           regulatorNotifiedAt: fromDatetimeLocalValue(
//             draft.regulatorNotifiedAt,
//           ),
//           dataSubjectsNotified: Boolean(draft.dataSubjectsNotified),
//           dataSubjectsNotifiedAt: fromDatetimeLocalValue(
//             draft.dataSubjectsNotifiedAt,
//           ),
//           requestId: String(draft.requestId || ""),
//         },
//       };

//       const res = await updateIncident(id, payload);
//       const inc = res?.incident || res;
//       setIncident(inc);
//       return true;
//     } catch (e2) {
//       setErr(e2?.message || "Save failed");
//       return false;
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function goNext() {
//     const ok = await saveCurrentStep();
//     if (!ok) return;
//     const next = STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]?.key;
//     if (next) setActiveStep(next);
//   }

//   async function goPrev() {
//     const prev = STEPS[Math.max(stepIndex - 1, 0)]?.key;
//     if (prev) setActiveStep(prev);
//   }

//   async function doClose() {
//     setBusy(true);
//     setErr("");
//     try {
//       await closeIncident(id);
//       await load();
//       setActiveStep("AUDIT");
//     } catch (e) {
//       setErr(e?.message || "Failed to close incident");
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function submitComment() {
//     const msg = commentText.trim();
//     if (!msg) return;
//     setCommentBusy(true);
//     setErr("");
//     try {
//       await addIncidentComment(id, { message: msg });
//       setCommentText("");
//       const cr = await listIncidentComments(id);
//       setComments(cr?.items || cr?.comments || []);
//     } catch (e) {
//       setErr(e?.message || "Failed to add comment");
//     } finally {
//       setCommentBusy(false);
//     }
//   }

//   const readOnly = String(draft.status || "").toUpperCase() === "CLOSED";

//   return (
//     <div className="space-y-4">
//       {/* Top header */}
//       <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
//         <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-rose-50">
//           <div className="flex flex-wrap items-start justify-between gap-4">
//             <div className="min-w-0">
//               <div className="text-sm text-slate-500">Incident</div>
//               <div className="mt-1 text-2xl font-bold text-slate-900 truncate">
//                 {draft.title || incident?.id || "Incident"}
//               </div>

//               <div className="mt-2 flex flex-wrap items-center gap-2">
//                 <span
//                   className={[
//                     "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
//                     pillStatus(draft.status),
//                   ].join(" ")}
//                 >
//                   Status: {draft.status}
//                 </span>
//                 <span
//                   className={[
//                     "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
//                     pillSeverity(draft.severity),
//                   ].join(" ")}
//                 >
//                   Severity: {draft.severity}
//                 </span>
//                 {draft.isBreach ? (
//                   <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-900 ring-1 ring-rose-200 px-3 py-1 text-xs font-bold">
//                     Breach: YES
//                   </span>
//                 ) : (
//                   <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 ring-1 ring-slate-200 px-3 py-1 text-xs font-bold">
//                     Breach: NO
//                   </span>
//                 )}

//                 <span className="text-xs font-semibold text-slate-600">
//                   Updated:{" "}
//                   {incident?.updatedAt
//                     ? `${fmtDateOnly(incident.updatedAt)} • ${fmtTimeOnly(incident.updatedAt)}`
//                     : "—"}
//                 </span>

//                 {readOnly ? (
//                   <span className="inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
//                     Read-only
//                   </span>
//                 ) : null}
//               </div>

//               {breachWarning ? (
//                 <div className="mt-3 rounded-xl bg-amber-50 text-amber-900 ring-1 ring-amber-200 px-4 py-3 text-sm font-semibold">
//                   Regulator notification required: Breach + HIGH/CRITICAL needs
//                   reported date/time and notification decision.
//                 </div>
//               ) : null}

//               {err ? (
//                 <div className="mt-3 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 px-4 py-3 text-sm font-semibold">
//                   {err}
//                 </div>
//               ) : null}
//             </div>

//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => nav("/admin/incidents")}
//                 className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
//               >
//                 <ArrowLeft className="h-4 w-4" />
//                 Back
//               </button>

//               {!readOnly ? (
//                 <>
//                   <button
//                     onClick={saveCurrentStep}
//                     disabled={busy}
//                     className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
//                   >
//                     <Save className="h-4 w-4" />
//                     Save
//                   </button>

//                   <button
//                     onClick={doClose}
//                     disabled={busy}
//                     className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
//                   >
//                     Close Incident
//                   </button>
//                 </>
//               ) : null}
//             </div>
//           </div>
//         </div>

//         <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-500 to-rose-600" />
//       </div>

//       {/* Main layout: left wizard + right content */}
//       <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
//         {/* Left wizard */}
//         <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4 space-y-3">
//           {STEPS.map((s, idx) => {
//             const disabled = idx > maxClickableIndex; // enforce progression
//             return (
//               <StepItem
//                 key={s.key}
//                 active={activeStep === s.key}
//                 done={Boolean(stepDone[s.key])}
//                 title={s.title}
//                 subtitle={s.subtitle}
//                 icon={s.icon}
//                 disabled={disabled}
//                 onClick={() => setActiveStep(s.key)}
//               />
//             );
//           })}
//         </div>

//         {/* Right content */}
//         <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
//           <div className="p-6">
//             {activeStep === "OVERVIEW" ? (
//               <div className="space-y-4">
//                 <div className="text-lg font-bold text-slate-900">Overview</div>
//                 <div className="grid gap-4 md:grid-cols-2">
//                   <Field label="Title *" error={stepErrors.title}>
//                     <input
//                       value={draft.title}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({ ...d, title: e.target.value }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                       placeholder="e.g. Customer DB unauthorized access"
//                     />
//                   </Field>

//                   <div className="grid gap-4 md:grid-cols-2">
//                     <Field label="Category *" error={stepErrors.category}>
//                       <select
//                         value={draft.category}
//                         disabled={readOnly}
//                         onChange={(e) =>
//                           setDraft((d) => ({ ...d, category: e.target.value }))
//                         }
//                         className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
//                       >
//                         <option value="SECURITY">Security</option>
//                         <option value="PRIVACY">Privacy</option>
//                         <option value="OPERATIONAL">Operational</option>
//                         <option value="VENDOR">Vendor</option>
//                         <option value="OTHER">Other</option>
//                       </select>
//                     </Field>

//                     <Field label="Severity *" error={stepErrors.severity}>
//                       <select
//                         value={draft.severity}
//                         disabled={readOnly}
//                         onChange={(e) =>
//                           setDraft((d) => ({ ...d, severity: e.target.value }))
//                         }
//                         className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
//                       >
//                         <option value="LOW">Low</option>
//                         <option value="MEDIUM">Medium</option>
//                         <option value="HIGH">High</option>
//                         <option value="CRITICAL">Critical</option>
//                       </select>
//                     </Field>
//                   </div>

//                   <Field
//                     label="Breach (personal data)?"
//                     hint="Excel: Incident/Breach"
//                   >
//                     <label className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-bold text-slate-900">
//                           {draft.isBreach ? "Yes" : "No"}
//                         </div>
//                         <div className="text-xs font-semibold text-slate-500">
//                           Toggle if this is a personal data breach
//                         </div>
//                       </div>

//                       <button
//                         type="button"
//                         disabled={readOnly}
//                         onClick={() =>
//                           setDraft((d) => ({ ...d, isBreach: !d.isBreach }))
//                         }
//                         className={[
//                           "relative inline-flex h-8 w-14 items-center rounded-full transition disabled:opacity-60",
//                           draft.isBreach ? "bg-rose-600" : "bg-slate-200",
//                         ].join(" ")}
//                       >
//                         <span
//                           className={[
//                             "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
//                             draft.isBreach ? "translate-x-7" : "translate-x-1",
//                           ].join(" ")}
//                         />
//                       </button>
//                     </label>
//                   </Field>

//                   <Field
//                     label="Reported at *"
//                     error={stepErrors.reportedAt}
//                     hint="Excel: Date & time reported"
//                   >
//                     <input
//                       type="datetime-local"
//                       value={draft.reportedAt}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({ ...d, reportedAt: e.target.value }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                     />
//                   </Field>

//                   <Field label="Occurred at" hint="Optional">
//                     <input
//                       type="datetime-local"
//                       value={draft.occurredAt}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({ ...d, occurredAt: e.target.value }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                     />
//                   </Field>

//                   <Field label="Detected at" hint="Optional">
//                     <input
//                       type="datetime-local"
//                       value={draft.detectedAt}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({ ...d, detectedAt: e.target.value }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                     />
//                   </Field>

//                   <Field label="Due at" hint="Excel: Target closure date">
//                     <input
//                       type="datetime-local"
//                       value={draft.dueAt}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({ ...d, dueAt: e.target.value }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                     />
//                   </Field>

//                   <Field label="Systems affected" hint="Short text">
//                     <input
//                       value={draft.systemsAffected}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({
//                           ...d,
//                           systemsAffected: e.target.value,
//                         }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                       placeholder="CRM, DB, Ticketing..."
//                     />
//                   </Field>

//                   <Field
//                     label="Affected people (estimate)"
//                     error={stepErrors.affectedCount}
//                     hint="Numbers only"
//                   >
//                     <input
//                       type="number"
//                       inputMode="numeric"
//                       min={0}
//                       max={1000000000}
//                       value={draft.affectedCount}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({
//                           ...d,
//                           affectedCount: e.target.value,
//                         }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                       placeholder="0"
//                     />
//                   </Field>
//                 </div>
//               </div>
//             ) : null}

//             {activeStep === "RISK" ? (
//               <div className="space-y-4">
//                 <div className="text-lg font-bold text-slate-900">
//                   Risk Assessment
//                 </div>

//                 <div className="grid gap-4 md:grid-cols-3">
//                   <Field label="Impact (1–5) *" error={stepErrors.riskImpact}>
//                     <input
//                       type="number"
//                       inputMode="numeric"
//                       min={1}
//                       max={5}
//                       value={draft.riskImpact}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({ ...d, riskImpact: e.target.value }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                     />
//                   </Field>

//                   <Field
//                     label="Likelihood (1–5) *"
//                     error={stepErrors.riskLikelihood}
//                   >
//                     <input
//                       type="number"
//                       inputMode="numeric"
//                       min={1}
//                       max={5}
//                       value={draft.riskLikelihood}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({
//                           ...d,
//                           riskLikelihood: e.target.value,
//                         }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                     />
//                   </Field>

//                   <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
//                     <div className="text-xs font-bold text-slate-600">
//                       Risk score (simple)
//                     </div>
//                     <div className="mt-2 text-3xl font-bold text-slate-900">
//                       {clampInt(draft.riskImpact, 1, 5) &&
//                       clampInt(draft.riskLikelihood, 1, 5)
//                         ? clampInt(draft.riskImpact, 1, 5) *
//                           clampInt(draft.riskLikelihood, 1, 5)
//                         : "—"}
//                     </div>
//                     <div className="mt-1 text-xs font-semibold text-slate-500">
//                       Impact × Likelihood
//                     </div>
//                   </div>
//                 </div>

//                 <Field
//                   label="Rationale *"
//                   error={stepErrors.riskRationale}
//                   hint="Excel: Severity / summary reasoning"
//                 >
//                   <textarea
//                     value={draft.riskRationale}
//                     disabled={readOnly}
//                     onChange={(e) =>
//                       setDraft((d) => ({ ...d, riskRationale: e.target.value }))
//                     }
//                     className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                     placeholder="Explain why impact/likelihood were chosen..."
//                   />
//                 </Field>
//               </div>
//             ) : null}

//             {activeStep === "MITIGATION" ? (
//               <div className="space-y-4">
//                 <div className="text-lg font-bold text-slate-900">
//                   Containment & Mitigation
//                 </div>

//                 <div className="grid gap-4 md:grid-cols-2">
//                   <Field
//                     label="Root cause *"
//                     error={stepErrors.rootCause}
//                     hint="Excel: Root cause summary"
//                   >
//                     <textarea
//                       value={draft.rootCause}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({ ...d, rootCause: e.target.value }))
//                       }
//                       className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                       placeholder="Describe root cause..."
//                     />
//                   </Field>

//                   <Field
//                     label="Remediation / mitigation *"
//                     error={stepErrors.remediation}
//                     hint="Excel: Remediation actions"
//                   >
//                     <textarea
//                       value={draft.remediation}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({ ...d, remediation: e.target.value }))
//                       }
//                       className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                       placeholder="What are you doing to fix and prevent repeat?"
//                     />
//                   </Field>

//                   <Field label="Lessons learned" hint="Excel: Lessons learned">
//                     <textarea
//                       value={draft.lessonsLearned}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({
//                           ...d,
//                           lessonsLearned: e.target.value,
//                         }))
//                       }
//                       className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                       placeholder="Optional"
//                     />
//                   </Field>

//                   <div className="space-y-2">
//                     <div className="text-xs font-bold text-slate-700">
//                       Containment actions *{" "}
//                       <span className="text-slate-500">(checklist)</span>
//                     </div>

//                     {stepErrors.actions ? (
//                       <div className="rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 px-4 py-3 text-sm font-semibold">
//                         {stepErrors.actions}
//                       </div>
//                     ) : null}

//                     <div className="space-y-2">
//                       {draft.actions.map((a, idx) => (
//                         <div
//                           key={idx}
//                           className="rounded-2xl border border-slate-200 bg-white p-3 flex items-start gap-3"
//                         >
//                           <button
//                             type="button"
//                             disabled={readOnly}
//                             onClick={() =>
//                               setDraft((d) => {
//                                 const next = [...d.actions];
//                                 next[idx] = {
//                                   ...next[idx],
//                                   done: !next[idx].done,
//                                 };
//                                 return { ...d, actions: next };
//                               })
//                             }
//                             className={[
//                               "mt-0.5 h-6 w-6 rounded-lg ring-1 grid place-items-center transition disabled:opacity-60",
//                               a.done
//                                 ? "bg-emerald-600 text-white ring-emerald-200"
//                                 : "bg-white text-slate-500 ring-slate-200",
//                             ].join(" ")}
//                           >
//                             <CheckCircle2 className="h-4 w-4" />
//                           </button>

//                           <input
//                             value={a.text}
//                             disabled={readOnly}
//                             onChange={(e) =>
//                               setDraft((d) => {
//                                 const next = [...d.actions];
//                                 next[idx] = {
//                                   ...next[idx],
//                                   text: e.target.value,
//                                 };
//                                 return { ...d, actions: next };
//                               })
//                             }
//                             className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                             placeholder={`Action ${idx + 1}`}
//                           />

//                           {!readOnly ? (
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 setDraft((d) => ({
//                                   ...d,
//                                   actions: d.actions.filter(
//                                     (_, i) => i !== idx,
//                                   ),
//                                 }))
//                               }
//                               className="rounded-xl px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
//                             >
//                               Remove
//                             </button>
//                           ) : null}
//                         </div>
//                       ))}
//                     </div>

//                     {!readOnly ? (
//                       <button
//                         type="button"
//                         onClick={() =>
//                           setDraft((d) => ({
//                             ...d,
//                             actions: [...d.actions, { text: "", done: false }],
//                           }))
//                         }
//                         className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
//                       >
//                         + Add action
//                       </button>
//                     ) : null}
//                   </div>
//                 </div>
//               </div>
//             ) : null}

//             {activeStep === "NOTIFICATIONS" ? (
//               <div className="space-y-4">
//                 <div className="text-lg font-bold text-slate-900">
//                   Notifications & Requests
//                 </div>

//                 <div className="grid gap-4 md:grid-cols-2">
//                   <Field
//                     label="Request ID (optional)"
//                     hint="Excel: request / tracking"
//                   >
//                     <input
//                       value={draft.requestId}
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({ ...d, requestId: e.target.value }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                       placeholder="e.g. INC-REQ-00012"
//                     />
//                   </Field>

//                   <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
//                     <div className="text-xs font-bold text-slate-700">
//                       Breach rule
//                     </div>
//                     <div className="mt-1 text-sm font-semibold text-slate-600">
//                       If Breach + HIGH/CRITICAL → regulator decision is
//                       mandatory.
//                     </div>
//                   </div>

//                   <Field
//                     label="Regulator notification required?"
//                     error={stepErrors.regulatorNotifiable}
//                   >
//                     <select
//                       value={
//                         draft.regulatorNotifiable === null
//                           ? ""
//                           : draft.regulatorNotifiable
//                             ? "true"
//                             : "false"
//                       }
//                       disabled={readOnly}
//                       onChange={(e) =>
//                         setDraft((d) => ({
//                           ...d,
//                           regulatorNotifiable:
//                             e.target.value === ""
//                               ? null
//                               : e.target.value === "true",
//                         }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
//                     >
//                       <option value="">Select…</option>
//                       <option value="true">Yes</option>
//                       <option value="false">No</option>
//                     </select>
//                   </Field>

//                   <Field
//                     label="Regulator notified at"
//                     error={stepErrors.regulatorNotifiedAt}
//                   >
//                     <input
//                       type="datetime-local"
//                       value={draft.regulatorNotifiedAt}
//                       disabled={readOnly || draft.regulatorNotifiable !== true}
//                       onChange={(e) =>
//                         setDraft((d) => ({
//                           ...d,
//                           regulatorNotifiedAt: e.target.value,
//                         }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                     />
//                   </Field>

//                   <Field label="Data subjects notified?">
//                     <label className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-bold text-slate-900">
//                           {draft.dataSubjectsNotified ? "Yes" : "No"}
//                         </div>
//                         <div className="text-xs font-semibold text-slate-500">
//                           Excel: Data subjects notified
//                         </div>
//                       </div>

//                       <button
//                         type="button"
//                         disabled={readOnly}
//                         onClick={() =>
//                           setDraft((d) => ({
//                             ...d,
//                             dataSubjectsNotified: !d.dataSubjectsNotified,
//                           }))
//                         }
//                         className={[
//                           "relative inline-flex h-8 w-14 items-center rounded-full transition disabled:opacity-60",
//                           draft.dataSubjectsNotified
//                             ? "bg-indigo-600"
//                             : "bg-slate-200",
//                         ].join(" ")}
//                       >
//                         <span
//                           className={[
//                             "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
//                             draft.dataSubjectsNotified
//                               ? "translate-x-7"
//                               : "translate-x-1",
//                           ].join(" ")}
//                         />
//                       </button>
//                     </label>
//                   </Field>

//                   <Field
//                     label="Data subjects notified at"
//                     error={stepErrors.dataSubjectsNotifiedAt}
//                   >
//                     <input
//                       type="datetime-local"
//                       value={draft.dataSubjectsNotifiedAt}
//                       disabled={readOnly || !draft.dataSubjectsNotified}
//                       onChange={(e) =>
//                         setDraft((d) => ({
//                           ...d,
//                           dataSubjectsNotifiedAt: e.target.value,
//                         }))
//                       }
//                       className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
//                     />
//                   </Field>
//                 </div>
//               </div>
//             ) : null}

//             {activeStep === "AUDIT" ? (
//               <div className="space-y-3">
//                 <div className="text-lg font-bold text-slate-900">
//                   Timeline / Audit
//                 </div>
//                 <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
//                   <div className="text-sm font-semibold text-slate-900">
//                     Backend note
//                   </div>
//                   <div className="mt-1 text-sm text-slate-600">
//                     If you already have an Audit module endpoint, you can load
//                     it here. For now this step is visible (not missing), and you
//                     can wire it later.
//                   </div>
//                 </div>
//               </div>
//             ) : null}

//             {activeStep === "COMMENTS" ? (
//               <div className="space-y-4">
//                 <div className="text-lg font-bold text-slate-900">Comments</div>

//                 {!readOnly ? (
//                   <div className="rounded-2xl border border-slate-200 bg-white p-4">
//                     <div className="text-xs font-bold text-slate-700 mb-2">
//                       Add comment
//                     </div>
//                     <textarea
//                       value={commentText}
//                       onChange={(e) => setCommentText(e.target.value)}
//                       className="min-h-[90px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
//                       placeholder="Write an internal note..."
//                     />
//                     <div className="mt-3 flex justify-end">
//                       <button
//                         onClick={submitComment}
//                         disabled={commentBusy}
//                         className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
//                       >
//                         {commentBusy ? "Posting..." : "Post"}
//                       </button>
//                     </div>
//                   </div>
//                 ) : null}

//                 <div className="space-y-2">
//                   {(comments || []).length === 0 ? (
//                     <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-5">
//                       <div className="text-sm font-semibold text-slate-900">
//                         No comments yet
//                       </div>
//                       <div className="text-sm text-slate-600">
//                         Add an internal discussion note.
//                       </div>
//                     </div>
//                   ) : (
//                     comments.map((c) => (
//                       <div
//                         key={c.id}
//                         className="rounded-2xl border border-slate-200 bg-white p-4"
//                       >
//                         <div className="flex items-center justify-between gap-3">
//                           <div className="text-sm font-bold text-slate-900">
//                             {c.author?.fullName || "User"}
//                           </div>
//                           <div className="text-xs font-semibold text-slate-500">
//                             {c.createdAt
//                               ? `${fmtDateOnly(c.createdAt)} • ${fmtTimeOnly(c.createdAt)}`
//                               : ""}
//                           </div>
//                         </div>
//                         <div className="mt-2 text-sm font-semibold text-slate-700 whitespace-pre-wrap">
//                           {c.message}
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>
//             ) : null}
//           </div>

//           {/* Bottom nav */}
//           <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
//             <button
//               onClick={goPrev}
//               disabled={isFirst}
//               className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
//             >
//               <ChevronLeft className="h-4 w-4" />
//               Back
//             </button>

//             <div className="text-xs font-bold text-slate-500">
//               Step {stepIndex + 1} / {STEPS.length}
//             </div>

//             <button
//               onClick={goNext}
//               disabled={isLast || readOnly}
//               className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50"
//             >
//               Next
//               <ChevronRight className="h-4 w-4" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {busy ? (
//         <div className="text-xs font-semibold text-slate-500">Working…</div>
//       ) : null}
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Shield,
  ShieldAlert,
  Bell,
  Activity,
  MessageCircle,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getIncident,
  updateIncident,
  closeIncident,
  listIncidentComments,
  addIncidentComment,
} from "../lib/admin";

/* ------------------ constants ------------------ */
const STEPS = [
  {
    key: "OVERVIEW",
    title: "Step 1 • Overview",
    subtitle: "Core incident info",
    icon: ClipboardList,
  },
  {
    key: "RISK",
    title: "Step 2 • Risk",
    subtitle: "Impact & likelihood",
    icon: Shield,
  },
  {
    key: "MITIGATION",
    title: "Step 3 • Mitigation",
    subtitle: "Containment & remediation",
    icon: ShieldAlert,
  },
  {
    key: "NOTIFICATIONS",
    title: "Step 4 • Notifications",
    subtitle: "Channels & dates",
    icon: Bell,
  },
  {
    key: "AUDIT",
    title: "Step 5 • Audit",
    subtitle: "Timeline (read-only)",
    icon: Activity,
  },
  {
    key: "COMMENTS",
    title: "Step 6 • Comments",
    subtitle: "Internal discussion",
    icon: MessageCircle,
  },
];

/* ------------------ helpers ------------------ */
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
    return `${day}-${month}-${year}`;
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

function toDatetimeLocalValue(v) {
  try {
    if (!v) return "";
    const d = new Date(v);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return "";
  }
}

function fromDatetimeLocalValue(v) {
  try {
    if (!v) return null;
    const d = new Date(v);
    return d.toISOString();
  } catch {
    return null;
  }
}

function clampInt(v, min, max) {
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function pillStatus(status = "DRAFT") {
  const s = String(status).toUpperCase();
  const map = {
    DRAFT: "bg-slate-100 text-slate-800 ring-slate-200",
    IN_PROGRESS: "bg-amber-100 text-amber-900 ring-amber-200",
    IN_REVIEW: "bg-indigo-100 text-indigo-900 ring-indigo-200",
    CLOSED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  };
  return map[s] || map.DRAFT;
}

function pillSeverity(sev = "LOW") {
  const s = String(sev).toUpperCase();
  const map = {
    LOW: "bg-slate-100 text-slate-800 ring-slate-200",
    MEDIUM: "bg-amber-100 text-amber-900 ring-amber-200",
    HIGH: "bg-orange-100 text-orange-900 ring-orange-200",
    CRITICAL: "bg-rose-100 text-rose-900 ring-rose-200",
  };
  return map[s] || map.LOW;
}

/* ------------------ required validation per step ------------------ */
function validateStep(stepKey, draft) {
  const e = {};
  const title = (draft.title || "").trim();

  if (stepKey === "OVERVIEW") {
    if (!title) e.title = "Title is required.";
    if (!draft.category) e.category = "Category is required.";
    if (!draft.severity) e.severity = "Severity is required.";
    if (!draft.reportedAt) e.reportedAt = "Reported date/time is required.";

    if (draft.affectedCount != null && draft.affectedCount !== "") {
      const n = clampInt(draft.affectedCount, 0, 1000000000);
      if (n == null) e.affectedCount = "Affected count must be a number.";
    }
  }

  if (stepKey === "RISK") {
    const impact = clampInt(draft.riskImpact, 1, 5);
    const likelihood = clampInt(draft.riskLikelihood, 1, 5);

    if (impact == null) e.riskImpact = "Impact must be a number (1–5).";
    if (likelihood == null)
      e.riskLikelihood = "Likelihood must be a number (1–5).";

    if (!String(draft.riskRationale || "").trim())
      e.riskRationale = "Rationale is required.";
  }

  if (stepKey === "MITIGATION") {
    if (!String(draft.rootCause || "").trim())
      e.rootCause = "Root cause is required.";
    if (!String(draft.remediation || "").trim())
      e.remediation = "Remediation/mitigation is required.";

    const actions = Array.isArray(draft.actions) ? draft.actions : [];
    if (actions.length === 0)
      e.actions = "Add at least one containment action.";
    else if (actions.some((a) => !String(a?.text || "").trim()))
      e.actions = "Containment action text cannot be empty.";
  }

  if (stepKey === "NOTIFICATIONS") {
    const sev = String(draft.severity || "").toUpperCase();
    if (draft.isBreach && (sev === "HIGH" || sev === "CRITICAL")) {
      if (
        draft.regulatorNotifiable !== true &&
        draft.regulatorNotifiable !== false
      ) {
        e.regulatorNotifiable = "Select if regulator notification is required.";
      }
      if (draft.regulatorNotifiable === true && !draft.regulatorNotifiedAt) {
        e.regulatorNotifiedAt = "Regulator notified date/time is required.";
      }
    }
    if (draft.dataSubjectsNotified === true && !draft.dataSubjectsNotifiedAt) {
      e.dataSubjectsNotifiedAt =
        "Data subjects notified date/time is required.";
    }
  }

  // AUDIT + COMMENTS have no mandatory fields
  return e;
}

/* ------------------ UI atoms ------------------ */
function Field({ label, required, error, children, hint }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold text-slate-700">
          {label}{" "}
          {required ? (
            <span className="text-rose-600 font-bold" title="Required">
              *
            </span>
          ) : null}
        </label>
        {hint ? (
          <div className="text-[11px] font-semibold text-slate-500">{hint}</div>
        ) : null}
      </div>
      <div className="mt-1">{children}</div>
      {error ? (
        <div className="mt-1 text-xs font-semibold text-rose-600">{error}</div>
      ) : null}
    </div>
  );
}

function StepItem({ active, done, title, subtitle, icon: Icon, onClick }) {
  const base =
    "w-full rounded-2xl border px-4 py-4 text-left transition flex items-center gap-4";

  const style = active
    ? "border-indigo-200 bg-indigo-50 ring-4 ring-indigo-100"
    : done
      ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-50/70"
      : "border-slate-200 bg-white hover:bg-slate-50";

  return (
    <button onClick={onClick} className={[base, style].join(" ")} type="button">
      <div
        className={[
          "h-12 w-12 rounded-2xl grid place-items-center ring-1",
          active
            ? "bg-indigo-600 text-white ring-indigo-200"
            : done
              ? "bg-emerald-600 text-white ring-emerald-200"
              : "bg-sky-50 text-sky-700 ring-sky-200",
        ].join(" ")}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <div className="text-xs font-semibold text-slate-600">{subtitle}</div>
      </div>

      {done ? (
        <div className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
          <CheckCircle2 className="h-4 w-4" />
          Done
        </div>
      ) : null}
    </button>
  );
}

/* ------------------ page ------------------ */
export default function IncidentDetails() {
  const nav = useNavigate();
  const { id } = useParams();

  const [incident, setIncident] = useState(null);
  const [activeStep, setActiveStep] = useState("OVERVIEW");

  // Progress control:
  // - completedSteps = steps that were successfully saved (so “Done” is real)
  // - unlockedIndex = highest step index user can access (sequential)
  const [completedSteps, setCompletedSteps] = useState({});
  const [unlockedIndex, setUnlockedIndex] = useState(0);

  const [draft, setDraft] = useState({
    title: "",
    category: "OTHER",
    severity: "LOW",
    status: "DRAFT",
    isBreach: false,

    occurredAt: "",
    detectedAt: "",
    reportedAt: "",
    dueAt: "",

    systemsAffected: "",
    affectedCount: "",

    riskImpact: 3,
    riskLikelihood: 3,
    riskRationale: "",

    rootCause: "",
    remediation: "",
    lessonsLearned: "",
    actions: [{ text: "", done: false }],

    regulatorNotifiable: null,
    regulatorNotifiedAt: "",
    dataSubjectsNotified: false,
    dataSubjectsNotifiedAt: "",
    requestId: "",
  });

  const [stepErrors, setStepErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  const stepIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === activeStep),
  );
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= STEPS.length - 1;

  const readOnly = String(draft.status || "").toUpperCase() === "CLOSED";

  const breachWarning = (() => {
    const s = String(draft.severity || "").toUpperCase();
    return (
      Boolean(draft.isBreach) &&
      (s === "HIGH" || s === "CRITICAL") &&
      !draft.reportedAt
    );
  })();

  async function load() {
    setBusy(true);
    setErr("");
    try {
      const res = await getIncident(id);
      const inc = res?.incident || res;
      setIncident(inc);

      const risk = inc?.risk || {};
      const containment = inc?.containment || {};
      const notifications = inc?.notifications || {};

      setDraft((d) => ({
        ...d,
        title: inc?.title || "",
        category: inc?.category || "OTHER",
        severity: inc?.severity || "LOW",
        status: inc?.status || "DRAFT",
        isBreach: Boolean(inc?.isBreach),

        occurredAt: toDatetimeLocalValue(inc?.occurredAt),
        detectedAt: toDatetimeLocalValue(inc?.detectedAt),
        reportedAt: toDatetimeLocalValue(inc?.reportedAt),
        dueAt: toDatetimeLocalValue(inc?.dueAt),

        systemsAffected: inc?.systemsAffected || "",
        affectedCount: inc?.affectedCount ?? "",

        riskImpact: risk?.impact ?? 3,
        riskLikelihood: risk?.likelihood ?? 3,
        riskRationale: risk?.rationale ?? "",

        rootCause: containment?.rootCause ?? "",
        remediation: containment?.remediation ?? "",
        lessonsLearned: containment?.lessonsLearned ?? "",
        actions:
          Array.isArray(containment?.actions) && containment.actions.length
            ? containment.actions
            : [{ text: "", done: false }],

        regulatorNotifiable: notifications?.regulatorNotifiable ?? null,
        regulatorNotifiedAt: toDatetimeLocalValue(
          notifications?.regulatorNotifiedAt,
        ),
        dataSubjectsNotified: Boolean(notifications?.dataSubjectsNotified),
        dataSubjectsNotifiedAt: toDatetimeLocalValue(
          notifications?.dataSubjectsNotifiedAt,
        ),
        requestId: notifications?.requestId ?? "",
      }));

      // comments
      try {
        const cr = await listIncidentComments(id);
        setComments(cr?.items || cr?.comments || []);
      } catch {
        setComments([]);
      }

      // IMPORTANT:
      // Do NOT mark steps "Done" automatically on load.
      // Start unlocked at Overview only.
      setCompletedSteps({});
      setUnlockedIndex(0);
      setActiveStep("OVERVIEW");
    } catch (e) {
      setErr(e?.message || "Failed to load incident");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function isStepAlwaysOpen(stepKey) {
    return stepKey === "AUDIT" || stepKey === "COMMENTS";
  }

  function isStepClickable(idx, stepKey) {
    if (isStepAlwaysOpen(stepKey)) return true;
    return idx <= unlockedIndex;
  }

  function isStepDone(stepKey) {
    return Boolean(completedSteps[stepKey]);
  }

  async function saveCurrentStep() {
    const e = validateStep(activeStep, draft);
    setStepErrors(e);
    if (Object.keys(e).length > 0) return false;

    setBusy(true);
    setErr("");
    try {
      const payload = {
        title: draft.title.trim(),
        category: draft.category,
        severity: draft.severity,
        isBreach: Boolean(draft.isBreach),

        occurredAt: fromDatetimeLocalValue(draft.occurredAt),
        detectedAt: fromDatetimeLocalValue(draft.detectedAt),
        reportedAt: fromDatetimeLocalValue(draft.reportedAt),
        dueAt: fromDatetimeLocalValue(draft.dueAt),

        systemsAffected: draft.systemsAffected || null,
        affectedCount:
          draft.affectedCount === "" || draft.affectedCount == null
            ? null
            : clampInt(draft.affectedCount, 0, 1000000000),

        risk: {
          impact: clampInt(draft.riskImpact, 1, 5),
          likelihood: clampInt(draft.riskLikelihood, 1, 5),
          rationale: String(draft.riskRationale || ""),
        },

        containment: {
          rootCause: String(draft.rootCause || ""),
          remediation: String(draft.remediation || ""),
          lessonsLearned: String(draft.lessonsLearned || ""),
          actions: (Array.isArray(draft.actions) ? draft.actions : []).map(
            (a) => ({
              text: String(a?.text || ""),
              done: Boolean(a?.done),
            }),
          ),
          done: (Array.isArray(draft.actions) ? draft.actions : []).every((a) =>
            Boolean(a?.done),
          ),
        },

        notifications: {
          regulatorNotifiable: draft.regulatorNotifiable,
          regulatorNotifiedAt: fromDatetimeLocalValue(
            draft.regulatorNotifiedAt,
          ),
          dataSubjectsNotified: Boolean(draft.dataSubjectsNotified),
          dataSubjectsNotifiedAt: fromDatetimeLocalValue(
            draft.dataSubjectsNotifiedAt,
          ),
          requestId: String(draft.requestId || ""),
        },
      };

      const res = await updateIncident(id, payload);
      const inc = res?.incident || res;
      setIncident(inc);

      // Mark current step as completed ONLY after successful save
      setCompletedSteps((m) => ({ ...m, [activeStep]: true }));

      return true;
    } catch (e2) {
      setErr(e2?.message || "Save failed");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function goNext() {
    // Save + validate mandatory fields first
    const ok = await saveCurrentStep();
    if (!ok) return;

    // Unlock next step (sequential)
    const nextIdx = Math.min(stepIndex + 1, STEPS.length - 1);
    setUnlockedIndex((n) => Math.max(n, nextIdx));

    const next = STEPS[nextIdx]?.key;
    if (next) setActiveStep(next);
  }

  function goPrev() {
    const prevIdx = Math.max(stepIndex - 1, 0);
    const prev = STEPS[prevIdx]?.key;
    if (prev) setActiveStep(prev);
  }

  async function doClose() {
    setBusy(true);
    setErr("");
    try {
      await closeIncident(id);
      await load();
      setActiveStep("AUDIT");
    } catch (e) {
      setErr(e?.message || "Failed to close incident");
    } finally {
      setBusy(false);
    }
  }

  async function submitComment() {
    const msg = commentText.trim();
    if (!msg) return;
    setCommentBusy(true);
    setErr("");
    try {
      await addIncidentComment(id, { message: msg });
      setCommentText("");
      const cr = await listIncidentComments(id);
      setComments(cr?.items || cr?.comments || []);
    } catch (e) {
      setErr(e?.message || "Failed to add comment");
    } finally {
      setCommentBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Top header */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-sky-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-500">Incident</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 truncate">
                {draft.title || incident?.id || "Incident"}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
                    pillStatus(draft.status),
                  ].join(" ")}
                >
                  Status: {draft.status}
                </span>

                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1",
                    pillSeverity(draft.severity),
                  ].join(" ")}
                >
                  Severity: {draft.severity}
                </span>

                {draft.isBreach ? (
                  <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-900 ring-1 ring-rose-200 px-3 py-1 text-xs font-bold">
                    Breach: YES
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 ring-1 ring-slate-200 px-3 py-1 text-xs font-bold">
                    Breach: NO
                  </span>
                )}

                <span className="text-xs font-semibold text-slate-600">
                  Updated:{" "}
                  {incident?.updatedAt
                    ? `${fmtDateOnly(incident.updatedAt)} • ${fmtTimeOnly(
                        incident.updatedAt,
                      )}`
                    : "—"}
                </span>

                {readOnly ? (
                  <span className="inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
                    Read-only
                  </span>
                ) : null}
              </div>

              {breachWarning ? (
                <div className="mt-3 rounded-xl bg-amber-50 text-amber-900 ring-1 ring-amber-200 px-4 py-3 text-sm font-semibold">
                  Breach + HIGH/CRITICAL: regulator decision is mandatory and
                  Reported date/time must be filled.
                </div>
              ) : null}

              {err ? (
                <div className="mt-3 rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 px-4 py-3 text-sm font-semibold">
                  {err}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => nav("/admin/incidents")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {!readOnly ? (
                <>
                  <button
                    onClick={saveCurrentStep}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-800 hover:bg-indigo-100 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>

                  <button
                    onClick={doClose}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Close Incident
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500" />
      </div>

      {/* Main layout */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Left wizard */}
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4 space-y-3">
          {STEPS.map((s, idx) => {
            const clickable = isStepClickable(idx, s.key);

            return (
              <div key={s.key} className={!clickable ? "opacity-60" : ""}>
                <StepItem
                  active={activeStep === s.key}
                  done={isStepDone(s.key)}
                  title={s.title}
                  subtitle={s.subtitle}
                  icon={s.icon}
                  onClick={() => {
                    if (!clickable) return;
                    setActiveStep(s.key);
                  }}
                />
                {!clickable ? (
                  <div className="mt-1 px-2 text-[11px] font-semibold text-slate-500">
                    Complete previous steps to unlock
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Right content */}
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="p-6">
            {/* ---------------- OVERVIEW ---------------- */}
            {activeStep === "OVERVIEW" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      Overview
                    </div>
                    <div className="text-sm font-semibold text-slate-500">
                      Fill the required fields to unlock the next step.
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-2 rounded-2xl bg-sky-50 ring-1 ring-sky-200 px-4 py-2">
                    <div className="text-xs font-semibold text-sky-800">
                      Excel aligned fields
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-sky-50 ring-1 ring-slate-200 p-4">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                      <Field label="Title" required error={stepErrors.title}>
                        <input
                          value={draft.title}
                          disabled={readOnly}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, title: e.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                          placeholder="e.g. Unauthorized user"
                        />
                      </Field>
                    </div>

                    <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
                      <Field
                        label="Category"
                        required
                        error={stepErrors.category}
                      >
                        <select
                          value={draft.category}
                          disabled={readOnly}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              category: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
                        >
                          <option value="SECURITY">Security</option>
                          <option value="PRIVACY">Privacy</option>
                          <option value="OPERATIONAL">Operational</option>
                          <option value="VENDOR">Vendor</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </Field>

                      <Field
                        label="Severity"
                        required
                        error={stepErrors.severity}
                      >
                        <select
                          value={draft.severity}
                          disabled={readOnly}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              severity: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                      <Field
                        label="Breach (personal data)?"
                        hint="Excel: Incident/Breach"
                      >
                        <label className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {draft.isBreach ? "Yes" : "No"}
                            </div>
                            <div className="text-xs font-semibold text-slate-500">
                              Toggle if this is a personal data breach
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() =>
                              setDraft((d) => ({ ...d, isBreach: !d.isBreach }))
                            }
                            className={[
                              "relative inline-flex h-8 w-14 items-center rounded-full transition disabled:opacity-60",
                              draft.isBreach ? "bg-rose-600" : "bg-slate-200",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
                                draft.isBreach
                                  ? "translate-x-7"
                                  : "translate-x-1",
                              ].join(" ")}
                            />
                          </button>
                        </label>
                      </Field>
                    </div>

                    <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
                      <Field
                        label="Reported at"
                        required
                        error={stepErrors.reportedAt}
                        hint="Excel: Date & time reported"
                      >
                        <input
                          type="datetime-local"
                          value={draft.reportedAt}
                          disabled={readOnly}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              reportedAt: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                        />
                      </Field>

                      <Field label="Due at" hint="Excel: Target closure date">
                        <input
                          type="datetime-local"
                          value={draft.dueAt}
                          disabled={readOnly}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, dueAt: e.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label="Occurred at" hint="Optional">
                      <input
                        type="datetime-local"
                        value={draft.occurredAt}
                        disabled={readOnly}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            occurredAt: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                      />
                    </Field>

                    <Field label="Detected at" hint="Optional">
                      <input
                        type="datetime-local"
                        value={draft.detectedAt}
                        disabled={readOnly}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            detectedAt: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                      />
                    </Field>

                    <Field label="Systems affected" hint="Short text">
                      <input
                        value={draft.systemsAffected}
                        disabled={readOnly}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            systemsAffected: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                        placeholder="CRM, DB, Ticketing..."
                      />
                    </Field>

                    <Field
                      label="Affected people (estimate)"
                      error={stepErrors.affectedCount}
                      hint="Numbers only"
                    >
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={1000000000}
                        value={draft.affectedCount}
                        disabled={readOnly}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            affectedCount: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                        placeholder="0"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ---------------- RISK ---------------- */}
            {activeStep === "RISK" ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-slate-900">
                  Risk Assessment
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Impact (1–5)"
                    required
                    error={stepErrors.riskImpact}
                  >
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={5}
                      value={draft.riskImpact}
                      disabled={readOnly}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, riskImpact: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </Field>

                  <Field
                    label="Likelihood (1–5)"
                    required
                    error={stepErrors.riskLikelihood}
                  >
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={5}
                      value={draft.riskLikelihood}
                      disabled={readOnly}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          riskLikelihood: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </Field>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                    <div className="text-xs font-semibold text-sky-700">
                      Risk score (simple)
                    </div>
                    <div className="mt-2 text-3xl font-bold text-slate-900">
                      {clampInt(draft.riskImpact, 1, 5) &&
                      clampInt(draft.riskLikelihood, 1, 5)
                        ? clampInt(draft.riskImpact, 1, 5) *
                          clampInt(draft.riskLikelihood, 1, 5)
                        : "—"}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      Impact × Likelihood
                    </div>
                  </div>
                </div>

                <Field
                  label="Rationale"
                  required
                  error={stepErrors.riskRationale}
                  hint="Excel: Severity / summary reasoning"
                >
                  <textarea
                    value={draft.riskRationale}
                    disabled={readOnly}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        riskRationale: e.target.value,
                      }))
                    }
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                    placeholder="Explain why impact/likelihood were chosen..."
                  />
                </Field>
              </div>
            ) : null}

            {/* ---------------- MITIGATION ---------------- */}
            {activeStep === "MITIGATION" ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-slate-900">
                  Containment & Mitigation
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Root cause"
                    required
                    error={stepErrors.rootCause}
                  >
                    <textarea
                      value={draft.rootCause}
                      disabled={readOnly}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, rootCause: e.target.value }))
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                      placeholder="Describe root cause..."
                    />
                  </Field>

                  <Field
                    label="Remediation / mitigation"
                    required
                    error={stepErrors.remediation}
                  >
                    <textarea
                      value={draft.remediation}
                      disabled={readOnly}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          remediation: e.target.value,
                        }))
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                      placeholder="What are you doing to fix and prevent repeat?"
                    />
                  </Field>

                  <Field label="Lessons learned" hint="Optional">
                    <textarea
                      value={draft.lessonsLearned}
                      disabled={readOnly}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          lessonsLearned: e.target.value,
                        }))
                      }
                      className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                      placeholder="Optional"
                    />
                  </Field>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700">
                      Containment actions{" "}
                      <span className="text-rose-600 font-bold">*</span>
                      <span className="text-slate-500"> (checklist)</span>
                    </div>

                    {stepErrors.actions ? (
                      <div className="rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 px-4 py-3 text-sm font-semibold">
                        {stepErrors.actions}
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      {draft.actions.map((a, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl border border-slate-200 bg-white p-3 flex items-start gap-3"
                        >
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() =>
                              setDraft((d) => {
                                const next = [...d.actions];
                                next[idx] = {
                                  ...next[idx],
                                  done: !next[idx].done,
                                };
                                return { ...d, actions: next };
                              })
                            }
                            className={[
                              "mt-0.5 h-6 w-6 rounded-lg ring-1 grid place-items-center transition disabled:opacity-60",
                              a.done
                                ? "bg-emerald-600 text-white ring-emerald-200"
                                : "bg-white text-slate-500 ring-slate-200",
                            ].join(" ")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>

                          <input
                            value={a.text}
                            disabled={readOnly}
                            onChange={(e) =>
                              setDraft((d) => {
                                const next = [...d.actions];
                                next[idx] = {
                                  ...next[idx],
                                  text: e.target.value,
                                };
                                return { ...d, actions: next };
                              })
                            }
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                            placeholder={`Action ${idx + 1}`}
                          />

                          {!readOnly ? (
                            <button
                              type="button"
                              onClick={() =>
                                setDraft((d) => ({
                                  ...d,
                                  actions: d.actions.filter(
                                    (_, i) => i !== idx,
                                  ),
                                }))
                              }
                              className="rounded-xl px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            actions: [...d.actions, { text: "", done: false }],
                          }))
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-900 hover:bg-sky-100"
                      >
                        + Add action
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {/* ---------------- NOTIFICATIONS ---------------- */}
            {activeStep === "NOTIFICATIONS" ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-slate-900">
                  Notifications & Requests
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Request ID"
                    hint="Optional (Excel: request/tracking)"
                  >
                    <input
                      value={draft.requestId}
                      disabled={readOnly}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, requestId: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                      placeholder="e.g. INC-REQ-00012"
                    />
                  </Field>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-xs font-bold text-amber-900">
                      Breach rule
                    </div>
                    <div className="mt-1 text-sm font-semibold text-amber-900/80">
                      If Breach + HIGH/CRITICAL → regulator decision is
                      mandatory.
                    </div>
                  </div>

                  <Field
                    label="Regulator notification required?"
                    error={stepErrors.regulatorNotifiable}
                  >
                    <select
                      value={
                        draft.regulatorNotifiable === null
                          ? ""
                          : draft.regulatorNotifiable
                            ? "true"
                            : "false"
                      }
                      disabled={readOnly}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          regulatorNotifiable:
                            e.target.value === ""
                              ? null
                              : e.target.value === "true",
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
                    >
                      <option value="">Select…</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </Field>

                  <Field
                    label="Regulator notified at"
                    error={stepErrors.regulatorNotifiedAt}
                  >
                    <input
                      type="datetime-local"
                      value={draft.regulatorNotifiedAt}
                      disabled={readOnly || draft.regulatorNotifiable !== true}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          regulatorNotifiedAt: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </Field>

                  <Field label="Data subjects notified?">
                    <label className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {draft.dataSubjectsNotified ? "Yes" : "No"}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          Excel: Data subjects notified
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            dataSubjectsNotified: !d.dataSubjectsNotified,
                          }))
                        }
                        className={[
                          "relative inline-flex h-8 w-14 items-center rounded-full transition disabled:opacity-60",
                          draft.dataSubjectsNotified
                            ? "bg-indigo-600"
                            : "bg-slate-200",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
                            draft.dataSubjectsNotified
                              ? "translate-x-7"
                              : "translate-x-1",
                          ].join(" ")}
                        />
                      </button>
                    </label>
                  </Field>

                  <Field
                    label="Data subjects notified at"
                    error={stepErrors.dataSubjectsNotifiedAt}
                  >
                    <input
                      type="datetime-local"
                      value={draft.dataSubjectsNotifiedAt}
                      disabled={readOnly || !draft.dataSubjectsNotified}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          dataSubjectsNotifiedAt: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            {/* ---------------- AUDIT ---------------- */}
            {activeStep === "AUDIT" ? (
              <div className="space-y-3">
                <div className="text-lg font-bold text-slate-900">
                  Timeline / Audit
                </div>

               

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    For now you can use “Updated at” and status changes from
                    backend logs.
                  </div>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3">
                      <div className="text-sm font-bold text-slate-900">
                        Last updated
                      </div>
                      <div className="text-sm font-semibold text-slate-600">
                        {incident?.updatedAt
                          ? `${fmtDateOnly(incident.updatedAt)} • ${fmtTimeOnly(incident.updatedAt)}`
                          : "—"}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3">
                      <div className="text-sm font-bold text-slate-900">
                        Created
                      </div>
                      <div className="text-sm font-semibold text-slate-600">
                        {incident?.createdAt
                          ? `${fmtDateOnly(incident.createdAt)} • ${fmtTimeOnly(incident.createdAt)}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ---------------- COMMENTS ---------------- */}
            {activeStep === "COMMENTS" ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-slate-900">Comments</div>

                {!readOnly ? (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                    <div className="text-xs font-semibold text-indigo-700 mb-2">
                      Add comment
                    </div>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[90px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      placeholder="Write an internal note..."
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={submitComment}
                        disabled={commentBusy}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {commentBusy ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  {(comments || []).length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-5">
                      <div className="text-sm font-bold text-slate-900">
                        No comments yet
                      </div>
                      <div className="text-sm font-semibold text-slate-600">
                        Add an internal discussion note.
                      </div>
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-bold text-slate-900">
                            {c.author?.fullName || "User"}
                          </div>
                          <div className="text-xs font-semibold text-slate-500">
                            {c.createdAt
                              ? `${fmtDateOnly(c.createdAt)} • ${fmtTimeOnly(c.createdAt)}`
                              : ""}
                          </div>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-700 whitespace-pre-wrap">
                          {c.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom nav */}
          <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={isFirst}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <div className="text-xs font-semibold text-slate-500">
              Step {stepIndex + 1} / {STEPS.length}
            </div>

            <button
              onClick={goNext}
              disabled={isLast || readOnly}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {busy ? (
        <div className="text-xs font-semibold text-slate-500">Working…</div>
      ) : null}
    </div>
  );
}
