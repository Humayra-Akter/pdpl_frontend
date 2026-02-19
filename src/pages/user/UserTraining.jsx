// src/pages/user/UserTraining.jsx
import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  GraduationCap,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { listMyTrainings } from "../../lib/user";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function SoftCard({ className = "", children }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function EndpointMissing() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
      <div>
        <div className="font-semibold text-slate-900">
          Training not connected
        </div>
        <div className="mt-0.5 text-xs text-slate-700/80">
          Endpoint missing — showing placeholder UI.
        </div>
      </div>
    </div>
  );
}

/** Screenshot-style stat card (pastel + progress) */
function StatCardPro({
  title,
  value,
  subtitle,
  progressLabel = "Progress",
  progressText = "",
  progressPct = 0,
  tone = "blue", // blue | orange | green | red
  icon: Icon,
}) {
  const toneMap = {
    blue: {
      card: "border-indigo-200 bg-indigo-50/60",
      iconBox: "text-indigo-600",
      bar: "bg-indigo-600",
      track: "bg-indigo-100/70",
    },
    orange: {
      card: "border-amber-200 bg-amber-50/60",
      iconBox: "text-orange-600",
      bar: "bg-orange-500",
      track: "bg-amber-100/70",
    },
    green: {
      card: "border-emerald-200 bg-emerald-50/60",
      iconBox: "text-emerald-600",
      bar: "bg-emerald-600",
      track: "bg-emerald-100/70",
    },
    red: {
      card: "border-rose-200 bg-rose-50/60",
      iconBox: "text-rose-600",
      bar: "bg-rose-600",
      track: "bg-rose-100/70",
    },
  };

  const t = toneMap[tone] || toneMap.blue;
  const pct = Math.max(0, Math.min(100, Number(progressPct) || 0));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5",
        "shadow-md hover:shadow-lg transition-shadow",
        t.card,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold capitalize tracking-wide text-slate-700/80">
            {title}
          </div>
          <div className="mt-2 text-4xl font-bold leading-none text-slate-900">
            {value}
          </div>
          <div className="mt-3 text-sm font-medium text-slate-600">
            {subtitle}
          </div>
        </div>

        <div className={cn(t.iconBox)}>
          {Icon ? <Icon className="h-6 w-6" /> : null}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <div className="font-semibold text-slate-700/80">{progressLabel}</div>
          <div className="font-medium text-slate-900">{progressText}</div>
        </div>
        <div className={cn("mt-2 h-2 w-full rounded-full", t.track)}>
          <div
            className={cn("h-2 rounded-full", t.bar)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ value }) {
  const v = String(value || "").toUpperCase();
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";
  if (v === "COMPLETED")
    return (
      <span
        className={cn(
          base,
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        )}
      >
        COMPLETED
      </span>
    );
  if (v === "IN_PROGRESS")
    return (
      <span className={cn(base, "border-amber-200 bg-amber-50 text-amber-900")}>
        IN_PROGRESS
      </span>
    );
  return (
    <span className={cn(base, "border-slate-200 bg-slate-50 text-slate-700")}>
      {value || "NOT_STARTED"}
    </span>
  );
}

function pctFromTraining(t) {
  // Try common fields first, fallback by status
  const p = Number(
    t.progressPct ?? t.progress ?? t.percent ?? t.completionPct ?? NaN,
  );
  if (Number.isFinite(p)) return Math.max(0, Math.min(100, p));

  const s = String(t.status || "").toUpperCase();
  if (s === "COMPLETED") return 100;
  if (s === "IN_PROGRESS") return 50;
  return 0;
}

function fmtDue(dueDate) {
  if (!dueDate) return "—";
  const d = new Date(dueDate);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function UserTraining() {
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [items, setItems] = useState([]);

  const [gdprMode, setGdprMode] = useState(false);

  async function load() {
    setLoading(true);
    const res = await listMyTrainings();
    setMissing(!!res.missing);
    setItems(res.ok ? res.data?.items || res.data || [] : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // placeholder if endpoint missing
  const placeholder = [
    {
      id: "p1",
      title: "Privacy Awareness Training",
      status: "NOT_STARTED",
      dueDate: null,
      progressPct: 0,
      lessonsCount: 6,
      quizRequired: true,
    },
    {
      id: "p2",
      title: "Incident Reporting Basics",
      status: "IN_PROGRESS",
      dueDate: null,
      progressPct: 55,
      lessonsCount: 4,
      quizRequired: true,
    },
    {
      id: "p3",
      title: "Handling Vendor Data",
      status: "COMPLETED",
      dueDate: null,
      progressPct: 100,
      lessonsCount: 5,
      quizRequired: true,
    },
  ];

  const list = missing ? placeholder : items;

  const stats = useMemo(() => {
    const total = list.length;
    const completed = list.filter(
      (x) => String(x.status || "").toUpperCase() === "COMPLETED",
    ).length;
    const inProgress = list.filter(
      (x) => String(x.status || "").toUpperCase() === "IN_PROGRESS",
    ).length;
    const notStarted = Math.max(0, total - completed - inProgress);

    const avgProgress =
      total === 0
        ? 0
        : Math.round(
            list.reduce((acc, t) => acc + pctFromTraining(t), 0) / total,
          );

    return { total, completed, inProgress, notStarted, avgProgress };
  }, [list]);

  const gdprUrl =
    "https://commission.europa.eu/law/law-topic/data-protection_en"; // official EU portal page

  return (
    <div className="space-y-5">
      {/* Modern hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <div className="absolute inset-0">
          <div className="absolute -top-28 -right-20 h-72 w-72 rounded-full bg-indigo-100 blur-3xl opacity-70" />
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-emerald-100 blur-3xl opacity-70" />
        </div>

        <div className="relative px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-3xl border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-slate-900">
                    Privacy Training
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Complete mandatory modules and quizzes to stay compliant.
                  </div>
                </div>
              </div>

              {/* GDPR toggle + link */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGdprMode((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                    gdprMode
                      ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-9 rounded-full border p-0.5 transition",
                      gdprMode
                        ? "border-indigo-200 bg-indigo-100"
                        : "border-slate-200 bg-slate-100",
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full bg-white shadow-sm transition",
                        gdprMode ? "translate-x-4" : "translate-x-0",
                      )}
                    />
                  </div>
                  GDPR mode
                </button>

                <a
                  href={gdprUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Open GDPR website <ExternalLink className="h-4 w-4" />
                </a>

                {gdprMode ? (
                  <span className="text-sm text-slate-600">
                    Showing GDPR-aligned principles and terminology.
                  </span>
                ) : (
                  <span className="text-sm text-slate-600">
                    Showing PDPL-aligned principles and terminology.
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>

          {/* Stats cards like your screenshot */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCardPro
              title="Total modules"
              value={stats.total}
              subtitle="All assigned trainings"
              progressText={`${stats.avgProgress}% average`}
              progressPct={stats.avgProgress}
              tone="blue"
              icon={GraduationCap}
            />
            <StatCardPro
              title="In progress"
              value={stats.inProgress}
              subtitle="Started, not yet completed"
              progressText={`${stats.total ? Math.round((stats.inProgress / stats.total) * 100) : 0}% of total`}
              progressPct={
                stats.total ? (stats.inProgress / stats.total) * 100 : 0
              }
              tone="orange"
              icon={Clock}
            />
            <StatCardPro
              title="Completed"
              value={stats.completed}
              subtitle="Marked complete"
              progressText={`${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% completion`}
              progressPct={
                stats.total ? (stats.completed / stats.total) * 100 : 0
              }
              tone="green"
              icon={CheckCircle2}
            />
            <StatCardPro
              title="Attention needed"
              value={stats.notStarted}
              subtitle="Not started yet"
              progressText={`${stats.total ? Math.round((stats.notStarted / stats.total) * 100) : 0}% remaining`}
              progressPct={
                stats.total ? (stats.notStarted / stats.total) * 100 : 0
              }
              tone="red"
              icon={ShieldAlert}
            />
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        {/* LEFT: modules */}
        <SoftCard className="p-5">
          {missing && (
            <div className="mb-4">
              <EndpointMissing />
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-900">
                Assigned modules
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Open a module, complete lessons, then pass the quiz (mandatory).
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {list.length} module{list.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-24 rounded-3xl bg-slate-100 animate-pulse" />
                <div className="h-24 rounded-3xl bg-slate-100 animate-pulse" />
                <div className="h-24 rounded-3xl bg-slate-100 animate-pulse" />
              </div>
            ) : list.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
                No trainings assigned.
              </div>
            ) : (
              <div className="space-y-3">
                {list.map((t) => {
                  const title = t.title || t.name || "Untitled module";
                  const due = fmtDue(t.dueDate);
                  const pct = pctFromTraining(t);

                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "group rounded-3xl border border-slate-200 bg-white p-4",
                        "transition hover:bg-slate-50",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {title}
                            </div>
                            <StatusPill value={t.status} />
                            {t.quizRequired ? (
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                                Quiz mandatory
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Due: <span className="font-semibold">{due}</span>
                            </span>
                            {Number.isFinite(Number(t.lessonsCount)) ? (
                              <span className="inline-flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" />
                                Lessons:{" "}
                                <span className="font-semibold">
                                  {t.lessonsCount}
                                </span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="min-w-[140px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-600">
                              Progress
                            </span>
                            <span className="font-bold text-slate-900">
                              {pct}%
                            </span>
                          </div>
                          <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100">
                            <div
                              className="h-2.5 rounded-full bg-indigo-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          disabled
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-400"
                          title="Wire module runner later"
                        >
                          Open module (placeholder)
                        </button>
                        <button
                          disabled
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-400"
                          title="Wire quiz runner later"
                        >
                          Take quiz (placeholder)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SoftCard>

        {/* RIGHT: PDPL theories / GDPR switch content */}
        <SoftCard className="p-5 bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-900">
                {gdprMode
                  ? "GDPR concepts (quick guide)"
                  : "PDPL concepts (quick guide)"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Static reference notes for training. Not legal advice.
              </div>
            </div>
          </div>

          {/* principles */}
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">
              Core principles
            </div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {gdprMode ? (
                <>
                  <li>• Lawfulness, fairness, and transparency</li>
                  <li>• Purpose limitation</li>
                  <li>• Data minimisation</li>
                  <li>• Accuracy</li>
                  <li>• Storage limitation</li>
                  <li>• Integrity and confidentiality</li>
                  <li>• Accountability</li>
                </>
              ) : (
                <>
                  <li>• Lawful and transparent processing</li>
                  <li>
                    • Purpose limitation (use data only for stated reasons)
                  </li>
                  <li>• Data minimisation (collect only what’s needed)</li>
                  <li>• Accuracy and keeping records up-to-date</li>
                  <li>• Security safeguards (technical + organisational)</li>
                  <li>• Retention limitation (don’t keep data forever)</li>
                  <li>• Accountability (prove compliance)</li>
                </>
              )}
            </ul>
          </div>

          {/* lawful bases / grounds */}
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">
              {gdprMode
                ? "Lawful bases (at a glance)"
                : "Lawful grounds (at a glance)"}
            </div>
            <div className="mt-2 text-sm text-slate-700 leading-relaxed">
              {gdprMode ? (
                <>
                  GDPR commonly relies on:{" "}
                  <span className="font-semibold">consent</span>,{" "}
                  <span className="font-semibold">contract</span>,{" "}
                  <span className="font-semibold">legal obligation</span>,{" "}
                  <span className="font-semibold">vital interests</span>,{" "}
                  <span className="font-semibold">public task</span>, and{" "}
                  <span className="font-semibold">legitimate interests</span>.
                </>
              ) : (
                <>
                  Many PDPL frameworks rely on:{" "}
                  <span className="font-semibold">consent</span>,{" "}
                  <span className="font-semibold">contract necessity</span>,{" "}
                  <span className="font-semibold">legal obligation</span>, and{" "}
                  <span className="font-semibold">
                    legitimate purpose / public interest
                  </span>{" "}
                  (exact wording varies by jurisdiction).
                </>
              )}
            </div>
          </div>

          {/* incident handling theory */}
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">
              Incident response theory
            </div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              <li>
                • <span className="font-semibold">Detect & contain:</span>{" "}
                isolate affected accounts/systems.
              </li>
              <li>
                • <span className="font-semibold">Assess impact:</span> what
                data, how many people, what risk.
              </li>
              <li>
                • <span className="font-semibold">Notify:</span> follow internal
                process and regulator rules where required.
              </li>
              <li>
                • <span className="font-semibold">Remediate:</span> patch,
                rotate keys, reset passwords, monitor.
              </li>
              <li>
                • <span className="font-semibold">Learn:</span> root cause +
                prevention plan.
              </li>
            </ul>
          </div>

          {/* mini CTA */}
          <div className="mt-4 rounded-3xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950">
            <div className="font-semibold">Practical tip</div>
            <div className="mt-1">
              If you’re unsure, treat it as sensitive: minimise sharing, use
              secure channels, and document what you did.
            </div>
          </div>

          <div className="mt-4">
            <a
              href={gdprUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
            >
              Learn more on the official GDPR portal{" "}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </SoftCard>
      </div>
    </div>
  );
}
