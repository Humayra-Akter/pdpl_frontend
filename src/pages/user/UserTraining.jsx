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
  HelpCircle,
  ClipboardList,
} from "lucide-react";
import { listMyTrainings } from "../../lib/user";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function SoftCard({ className = "", children }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]",
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
        <div className="font-semibold text-slate-700">
          Training not connected
        </div>
        <div className="mt-0.5 text-xs text-slate-600">
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
      iconBox: "text-indigo-700",
      bar: "bg-indigo-700",
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
        "shadow-sm hover:shadow-md transition-shadow",
        t.card,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold capitalize tracking-wide text-slate-600">
            {title}
          </div>
          <div className="mt-2 text-4xl font-semibold leading-none text-slate-700">
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
          <div className="font-semibold text-slate-600">{progressLabel}</div>
          <div className="font-semibold text-slate-700">{progressText}</div>
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
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        )}
      >
        COMPLETED
      </span>
    );

  if (v === "IN_PROGRESS")
    return (
      <span className={cn(base, "border-amber-200 bg-amber-50 text-amber-700")}>
        IN_PROGRESS
      </span>
    );

  return (
    <span
      className={cn(base, "border-indigo-200 bg-indigo-50 text-indigo-700")}
    >
      {value || "NOT_STARTED"}
    </span>
  );
}

function pctFromTraining(t) {
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

function rowToneByStatus(status) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETED")
    return {
      wrap: "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/60",
      accent: "bg-emerald-600",
      progress: "bg-emerald-600",
      track: "bg-emerald-100/70",
    };
  if (s === "IN_PROGRESS")
    return {
      wrap: "border-amber-200 bg-amber-50/40 hover:bg-amber-50/60",
      accent: "bg-amber-500",
      progress: "bg-amber-500",
      track: "bg-amber-100/70",
    };
  return {
    wrap: "border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/50",
    accent: "bg-indigo-700",
    progress: "bg-indigo-700",
    track: "bg-indigo-100/70",
  };
}

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-indigo-700 text-white shadow-sm"
          : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {label}
    </button>
  );
}

function MuteButton({ children, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "rounded-xl border px-3.5 py-2 text-sm font-semibold transition",
        disabled
          ? "border-slate-200 bg-slate-50 text-slate-400"
          : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50",
      )}
    >
      {children}
    </button>
  );
}

export default function UserTraining() {
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [items, setItems] = useState([]);

  const [gdprMode, setGdprMode] = useState(false);

  // Tabs: modules / mcq
  const [tab, setTab] = useState("MODULES"); // MODULES | MCQ

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
    "https://commission.europa.eu/law/law-topic/data-protection_en";

  // Simple MCQ placeholder list (until you wire backend)
  const mcqItems = useMemo(() => {
    // You can later replace this with an endpoint listMyMcq(), etc.
    return [
      {
        id: "q1",
        title: gdprMode ? "GDPR: Lawful bases" : "PDPL: Lawful grounds",
        questions: 10,
        status: "NOT_STARTED",
      },
      {
        id: "q2",
        title: "Incident response basics",
        questions: 8,
        status: "IN_PROGRESS",
      },
      {
        id: "q3",
        title: "Data minimisation & retention",
        questions: 12,
        status: "COMPLETED",
      },
    ];
  }, [gdprMode]);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <div className="absolute inset-0">
          <div className="absolute -top-28 -right-20 h-72 w-72 rounded-full bg-indigo-100 blur-3xl opacity-70" />
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-sky-100 blur-3xl opacity-70" />
        </div>

        <div className="relative px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-indigo-700">
                    Privacy Training
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Complete mandatory modules and MCQs to stay compliant.
                  </div>
                </div>
              </div>

              {/* Tabs: Modules / MCQ */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <TabButton
                  active={tab === "MODULES"}
                  icon={GraduationCap}
                  label="Modules"
                  onClick={() => setTab("MODULES")}
                />
                <TabButton
                  active={tab === "MCQ"}
                  icon={ClipboardList}
                  label="MCQ"
                  onClick={() => setTab("MCQ")}
                />
              </div>

              {/* GDPR toggle + link */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGdprMode((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                    "hover:shadow-sm",
                    gdprMode
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full p-1 transition",
                      gdprMode
                        ? "bg-gradient-to-r from-indigo-700 via-sky-600 to-emerald-600"
                        : "bg-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                        gdprMode ? "translate-x-5" : "translate-x-0",
                      )}
                    />
                  </span>

                  <span>GDPR mode</span>

                  {gdprMode ? (
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      ON
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      OFF
                    </span>
                  )}
                </button>

                <a
                  href={gdprUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                    "transition-all duration-200",
                    "border-indigo-200 bg-white text-indigo-700",
                    "hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-md",
                    "hover:ring-2 hover:ring-indigo-200/40",
                  )}
                >
                  Open GDPR website <ExternalLink className="h-4 w-4" />
                </a>

                <span className="text-sm text-slate-600">
                  {gdprMode
                    ? "Using GDPR-aligned terms."
                    : "Using PDPL-aligned terms."}
                </span>
              </div>
            </div>

            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>

          {/* Stat cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCardPro
              title="Total"
              value={stats.total}
              subtitle={
                tab === "MCQ" ? "All assigned MCQ sets" : "All assigned modules"
              }
              progressText={`${stats.avgProgress}% average`}
              progressPct={stats.avgProgress}
              tone="blue"
              icon={GraduationCap}
            />
            <StatCardPro
              title="In progress"
              value={stats.inProgress}
              subtitle="Started, not completed"
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
              title="Attention"
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

        <div className="h-1 bg-gradient-to-r from-indigo-700 via-sky-600 to-emerald-600" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        {/* LEFT */}
        <SoftCard className="p-5">
          {missing && (
            <div className="mb-4">
              <EndpointMissing />
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-indigo-700">
                {tab === "MCQ" ? "MCQ sets" : "Assigned modules"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {tab === "MCQ"
                  ? "Attempt MCQs after studying modules (mandatory)."
                  : "Open a module, complete lessons, then pass the quiz (mandatory)."}
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {tab === "MCQ" ? mcqItems.length : list.length} item
              {(tab === "MCQ" ? mcqItems.length : list.length) === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
              </div>
            ) : tab === "MCQ" ? (
              mcqItems.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  No MCQs assigned.
                </div>
              ) : (
                <div className="space-y-3">
                  {mcqItems.map((q) => {
                    const tone = rowToneByStatus(q.status);
                    const pct =
                      String(q.status || "").toUpperCase() === "COMPLETED"
                        ? 100
                        : String(q.status || "").toUpperCase() === "IN_PROGRESS"
                          ? 50
                          : 0;

                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "group relative overflow-hidden rounded-xl border p-4 transition",
                          tone.wrap,
                        )}
                      >
                        <div
                          className={cn(
                            "absolute left-0 top-0 h-full w-1.5",
                            tone.accent,
                          )}
                        />

                        <div className="pl-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-indigo-700">
                                  {q.title}
                                </div>
                                <StatusPill value={q.status} />
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  {q.questions} questions
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-slate-600">
                                MCQ is mandatory for every training.
                              </div>
                            </div>

                            <div className="min-w-[140px]">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-600">
                                  Progress
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {pct}%
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "mt-2 h-2.5 w-full rounded-full",
                                  tone.track,
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-2.5 rounded-full",
                                    tone.progress,
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <MuteButton disabled>
                              Start MCQ (placeholder)
                            </MuteButton>
                            <MuteButton disabled>
                              Review answers (placeholder)
                            </MuteButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : list.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No trainings assigned.
              </div>
            ) : (
              <div className="space-y-3">
                {list.map((t) => {
                  const title = t.title || t.name || "Untitled module";
                  const due = fmtDue(t.dueDate);
                  const pct = pctFromTraining(t);
                  const tone = rowToneByStatus(t.status);

                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border p-4 transition",
                        tone.wrap,
                      )}
                    >
                      <div
                        className={cn(
                          "absolute left-0 top-0 h-full w-1.5",
                          tone.accent,
                        )}
                      />

                      <div className="pl-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="truncate text-sm font-semibold text-indigo-700">
                                {title}
                              </div>
                              <StatusPill value={t.status} />
                              {t.quizRequired ? (
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  Quiz mandatory
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Due:{" "}
                                <span className="font-semibold">{due}</span>
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
                              <span className="font-semibold text-slate-700">
                                {pct}%
                              </span>
                            </div>
                            <div
                              className={cn(
                                "mt-2 h-2.5 w-full rounded-full",
                                tone.track,
                              )}
                            >
                              <div
                                className={cn(
                                  "h-2.5 rounded-full",
                                  tone.progress,
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <MuteButton disabled>
                            Open module (placeholder)
                          </MuteButton>
                          <MuteButton disabled>
                            Take quiz (placeholder)
                          </MuteButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SoftCard>

        {/* RIGHT: guide */}
        <SoftCard className="p-5 bg-slate-50">
          <div>
            <div className="text-lg font-semibold text-indigo-700">
              {gdprMode ? "GDPR quick guide" : "PDPL quick guide"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Static reference notes for training. Not legal advice.
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-700">
              Core principles
            </div>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
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
                  <li>• Purpose limitation</li>
                  <li>• Data minimisation</li>
                  <li>• Accuracy</li>
                  <li>• Security safeguards</li>
                  <li>• Retention limitation</li>
                  <li>• Accountability</li>
                </>
              )}
            </ul>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <HelpCircle className="h-4 w-4 text-indigo-700" />
              Practical tip
            </div>
            <div className="mt-2 text-sm text-slate-600 leading-relaxed">
              If you’re unsure, treat it as sensitive: minimise sharing, use
              secure channels, and document what you did.
            </div>
          </div>

          <div className="mt-4">
            <a
              href={gdprUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-700/90 transition"
            >
              Learn more (official GDPR portal){" "}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </SoftCard>
      </div>
    </div>
  );
}
