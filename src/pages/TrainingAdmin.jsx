import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  X,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Activity,
  ClipboardList,
  GraduationCap,
  FileText,
  Link as LinkIcon,
  Video,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  Send,
  Settings,
  FileUp,
  PenTool,
  BadgeCheck,
  ChevronRight,
  Trash2,
  Edit3,
  ArrowUpRight,
} from "lucide-react";

import TrainingHeader from "../components/TrainingHeader";
import TrainingKpis from "../components/TrainingKpis";
import TrainingGraphs from "../components/TrainingGraphs";
import TrainingModulesPanel from "../components/TrainingModulesPanel";
import TrainingQuizBuilder from "../components/TrainingQuizBuilder";
import TrainingAssignmentsPanel from "../components/TrainingAssignmentsPanel";
import TrainingAuditPanel from "../components/TrainingAuditPanel";

/**
 * Privacy Training Admin (refactor)
 * - Tailwind only
 * - No root css
 * - Backend hooks are TODO
 */

export const CONTENT_TYPES = [
  { key: "DOC", label: "Document (PDF)", icon: FileText },
  { key: "LINK", label: "External Link", icon: LinkIcon },
  { key: "VIDEO", label: "Video (future)", icon: Video },
  { key: "ASSESSMENT", label: "Assessment (Quiz)", icon: ClipboardList },
];

export const DIFFICULTY = ["EASY", "MEDIUM", "HARD"];
export const STATUS = [
  "DRAFT",
  "PENDING_DPO_APPROVAL",
  "PUBLISHED",
  "ARCHIVED",
];
export const ASSIGNMENT_STATUS = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "OVERDUE",
];

/* ------------------ shared helpers (used by components) ------------------ */
export function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString();
}

export function clamp(n, a, b) {
  const x = Number(n);
  if (Number.isNaN(x)) return a;
  return Math.max(a, Math.min(b, x));
}

export function pillTone(key) {
  const s = String(key || "").toUpperCase();
  const map = {
    DRAFT: "bg-slate-100 text-slate-800 ring-slate-200",
    PENDING_DPO_APPROVAL: "bg-amber-100 text-amber-900 ring-amber-200",
    PUBLISHED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    ARCHIVED: "bg-slate-100 text-slate-600 ring-slate-200",

    NOT_STARTED: "bg-slate-100 text-slate-800 ring-slate-200",
    IN_PROGRESS: "bg-indigo-100 text-indigo-900 ring-indigo-200",
    COMPLETED: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    OVERDUE: "bg-rose-100 text-rose-900 ring-rose-200",

    HIGH: "bg-rose-100 text-rose-900 ring-rose-200",
    MEDIUM: "bg-amber-100 text-amber-900 ring-amber-200",
    LOW: "bg-slate-100 text-slate-800 ring-slate-200",
  };
  return map[s] || map.DRAFT;
}

/* ------------------ shared UI primitives (kept here; passed down) ------------------ */
export function Card({ children, className }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 text-xs font-semibold text-slate-500">
            {subtitle}
          </div>
        ) : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function KpiCard({ title, value, hint, tone, icon: Icon }) {
  const tones = {
    indigo: {
      wrap: "bg-indigo-50 ring-indigo-200 shadow-md hover:shadow-lg",
      title: "text-indigo-900",
      hint: "text-indigo-900/70",
      value: "text-indigo-950",
      iconWrap: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    },
    amber: {
      wrap: "bg-amber-50 ring-amber-200 shadow-md hover:shadow-lg",
      title: "text-amber-900",
      hint: "text-amber-900/70",
      value: "text-amber-950",
      iconWrap: "bg-amber-100 text-amber-700 ring-amber-200",
    },
    emerald: {
      wrap: "bg-emerald-50 ring-emerald-200 shadow-md hover:shadow-lg",
      title: "text-emerald-900",
      hint: "text-emerald-900/70",
      value: "text-emerald-950",
      iconWrap: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    },
    rose: {
      wrap: "bg-rose-50 ring-rose-200 shadow-md hover:shadow-lg",
      title: "text-rose-900",
      hint: "text-rose-900/70",
      value: "text-rose-950",
      iconWrap: "bg-rose-100 text-rose-700 ring-rose-200",
    },
    slate: {
      wrap: "bg-slate-50 ring-slate-200 shadow-md hover:shadow-lg",
      title: "text-slate-900",
      hint: "text-slate-600",
      value: "text-slate-950",
      iconWrap: "bg-white text-slate-700 ring-slate-200",
    },
  };
  const t = tones[tone] || tones.indigo;

  return (
    <div className={cn("rounded-3xl ring-1 p-4", t.wrap)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("text-xs font-bold", t.title)}>{title}</div>
          <div className={cn("mt-1 text-3xl font-bold", t.value)}>{value}</div>
          <div className={cn("mt-1 text-xs font-semibold", t.hint)}>{hint}</div>
        </div>
        <div
          className={cn(
            "h-11 w-11 rounded-2xl grid place-items-center ring-1",
            t.iconWrap,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function Drawer({ open, title, subtitle, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-lg font-bold text-slate-900">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {subtitle}
              </div>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
            type="button"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-[calc(100%-140px)] overflow-auto p-5">{children}</div>
        <div className="border-t border-slate-200 px-5 py-4">{footer}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="text-lg font-bold text-slate-900">{title}</div>
        <div className="mt-2 text-sm font-semibold text-slate-600">{body}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- mock data (replace with API) ---------------- */
function makeMock() {
  const trainings = [
    {
      id: "t-001",
      title: "PDPL Fundamentals 2025",
      status: "PUBLISHED",
      validityDays: 365,
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      createdBy: "Admin",
      approvedBy: "DPO",
      modules: [
        {
          id: "m1",
          title: "Intro to PDPL",
          contentType: "DOC",
          required: true,
        },
        {
          id: "m2",
          title: "Lawful Processing",
          contentType: "LINK",
          required: true,
        },
        {
          id: "m3",
          title: "Assessment Quiz",
          contentType: "ASSESSMENT",
          required: true,
        },
      ],
      quiz: { questionCount: 10, passScore: 70, attemptsAllowed: 3 },
      reminder: {
        enabled: true,
        everyDays: 3,
        beforeDueDays: 7,
        overdueEveryDays: 2,
        ccDpoOnOverdue: true,
      },
    },
    {
      id: "t-002",
      title: "Annual Refresher (Draft)",
      status: "DRAFT",
      validityDays: 365,
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      createdBy: "Admin",
      approvedBy: null,
      modules: [
        {
          id: "m1",
          title: "Refresher Deck",
          contentType: "DOC",
          required: true,
        },
      ],
      quiz: { questionCount: 5, passScore: 70, attemptsAllowed: 2 },
      reminder: {
        enabled: true,
        everyDays: 7,
        beforeDueDays: 7,
        overdueEveryDays: 2,
        ccDpoOnOverdue: true,
      },
    },
    {
      id: "t-003",
      title: "Vendor Handling & Incident Escalation",
      status: "PENDING_DPO_APPROVAL",
      validityDays: 180,
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      createdBy: "DPO",
      approvedBy: null,
      modules: [
        {
          id: "m1",
          title: "Incident basics",
          contentType: "DOC",
          required: true,
        },
        { id: "m2", title: "Quiz", contentType: "ASSESSMENT", required: true },
      ],
      quiz: { questionCount: 8, passScore: 70, attemptsAllowed: 3 },
      reminder: {
        enabled: true,
        everyDays: 2,
        beforeDueDays: 5,
        overdueEveryDays: 1,
        ccDpoOnOverdue: true,
      },
    },
  ];

  const users = [
    { id: "u1", name: "Arafat", dept: "IT", role: "USER" },
    { id: "u2", name: "Sadia", dept: "Business", role: "USER" },
    { id: "u3", name: "Nabil", dept: "Service", role: "USER" },
    { id: "u4", name: "DPO", dept: "Compliance", role: "DPO" },
  ];

  const assignments = [
    {
      id: "a1",
      trainingId: "t-001",
      userId: "u1",
      status: "COMPLETED",
      score: 86,
      completedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: "a2",
      trainingId: "t-001",
      userId: "u2",
      status: "IN_PROGRESS",
      score: null,
      completedAt: null,
    },
    {
      id: "a3",
      trainingId: "t-001",
      userId: "u3",
      status: "OVERDUE",
      score: null,
      completedAt: null,
    },
  ];

  const questionBank = [
    {
      id: "q1",
      text: "What is personal data under PDPL?",
      difficulty: "EASY",
      tags: ["fundamentals"],
      options: [
        "Any data related to an identified/identifiable person",
        "Only financial data",
        "Only health data",
        "Only email addresses",
      ],
      answerIndex: 0,
    },
    {
      id: "q2",
      text: "When should a breach be escalated to the DPO?",
      difficulty: "MEDIUM",
      tags: ["incident", "breach"],
      options: [
        "Only after 30 days",
        "Immediately when identified/confirmed",
        "Only if media reports it",
        "Only if customer complains",
      ],
      answerIndex: 1,
    },
  ];

  const audit = [
    {
      id: "l1",
      ts: new Date(Date.now() - 3600_000 * 7).toISOString(),
      actor: "Admin",
      action: "Created training",
      meta: "Annual Refresher (Draft)",
    },
    {
      id: "l2",
      ts: new Date(Date.now() - 3600_000 * 4).toISOString(),
      actor: "DPO",
      action: "Requested changes",
      meta: "Vendor Handling & Incident Escalation",
    },
    {
      id: "l3",
      ts: new Date(Date.now() - 3600_000 * 2).toISOString(),
      actor: "System",
      action: "Overdue reminder sent",
      meta: "PDPL Fundamentals 2025 → Nabil",
    },
  ];

  return { trainings, users, assignments, questionBank, audit };
}

export default function TrainingAdmin() {
  const [tab, setTab] = useState("DASH");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(() => makeMock());

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");

  // modals/drawers (kept here; you can split further later)
  const [confirmDelete, setConfirmDelete] = useState(null);

  // selection
  const [selectedTrainingId, setSelectedTrainingId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openBuilder, setOpenBuilder] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const trainingsFiltered = useMemo(() => {
    let xs = [...data.trainings];

    if (status !== "ALL") {
      xs = xs.filter(
        (t) => String(t.status).toUpperCase() === String(status).toUpperCase(),
      );
    }
    if (q.trim()) {
      xs = xs.filter((t) =>
        String(t.title).toLowerCase().includes(q.trim().toLowerCase()),
      );
    }

    xs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return xs;
  }, [data.trainings, q, status]);

  const assignmentsByTraining = useMemo(() => {
    const map = new Map();
    for (const a of data.assignments) {
      if (!map.has(a.trainingId)) map.set(a.trainingId, []);
      map.get(a.trainingId).push(a);
    }
    return map;
  }, [data.assignments]);

  const kpis = useMemo(() => {
    const published = data.trainings.filter(
      (t) => t.status === "PUBLISHED",
    ).length;
    const pending = data.trainings.filter(
      (t) => t.status === "PENDING_DPO_APPROVAL",
    ).length;

    const totalAssigned = data.assignments.length;
    const completed = data.assignments.filter(
      (a) => a.status === "COMPLETED",
    ).length;
    const overdue = data.assignments.filter(
      (a) => a.status === "OVERDUE",
    ).length;
    const inProgress = data.assignments.filter(
      (a) => a.status === "IN_PROGRESS",
    ).length;

    const completionRate = totalAssigned
      ? Math.round((completed / totalAssigned) * 100)
      : 0;
    const auditReady =
      overdue === 0 && totalAssigned > 0 && completed === totalAssigned;

    const publishedTrainings = data.trainings.filter(
      (t) => t.status === "PUBLISHED",
    );
    const nextDueAt = publishedTrainings
      .map((t) => t.dueAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

    return {
      published,
      pending,
      completionRate,
      completed,
      overdue,
      inProgress,
      auditReady,
      nextDueAt,
    };
  }, [data.trainings, data.assignments]);

  async function refresh() {
    setLoading(true);
    try {
      // TODO: API
      await new Promise((r) => setTimeout(r, 350));
      setData((d) => ({ ...d }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // TODO: initial API
  }, []);

  function selectedTraining() {
    return data.trainings.find((t) => t.id === selectedTrainingId) || null;
  }

  function updateTraining(id, patch) {
    setData((prev) => ({
      ...prev,
      trainings: prev.trainings.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      ),
    }));
  }

  function addAudit(actor, action, meta) {
    setData((prev) => ({
      ...prev,
      audit: [
        {
          id: `l-${Math.random().toString(16).slice(2)}`,
          ts: new Date().toISOString(),
          actor,
          action,
          meta,
        },
        ...prev.audit,
      ],
    }));
  }

  function deleteTraining(id) {
    setData((prev) => ({
      ...prev,
      trainings: prev.trainings.filter((t) => t.id !== id),
      assignments: prev.assignments.filter((a) => a.trainingId !== id),
    }));
  }

  // UI pack passed to components
  const ui = useMemo(
    () => ({
      cn,
      formatDate,
      clamp,
      pillTone,
      Card,
      SectionTitle,
      KpiCard,
      Drawer,
      ConfirmModal,
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <TrainingHeader
        ui={ui}
        lucide={{
          RefreshCw,
          Plus,
          Settings,
          Search,
          X,
          Activity,
          GraduationCap,
          PenTool,
          Users,
          BadgeCheck,
          FileUp,
        }}
        loading={loading}
        onRefresh={refresh}
        onNewTraining={() => setOpenCreate(true)}
        onOpenSettings={() => setOpenSettings(true)}
        tab={tab}
        onTabChange={setTab}
        q={q}
        onQChange={setQ}
        status={status}
        onStatusChange={setStatus}
      />

      <TrainingKpis
        ui={ui}
        lucide={{
          GraduationCap,
          Activity,
          ShieldAlert,
          ShieldCheck,
          ClipboardList,
        }}
        kpis={kpis}
        totalAssigned={data.assignments.length}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {tab === "DASH" ? (
            <TrainingGraphs
              ui={ui}
              lucide={{ Users, Calendar, Clock, CheckCircle2 }}
              trainings={data.trainings}
              assignments={data.assignments}
            />
          ) : null}

          {tab === "TRAININGS" ? (
            <TrainingModulesPanel
              ui={ui}
              lucide={{ GraduationCap, Clock, Edit3, ArrowUpRight, Trash2 }}
              trainings={trainingsFiltered}
              assignmentsByTraining={assignmentsByTraining}
              onOpenBuilder={(id) => {
                setSelectedTrainingId(id);
                setOpenBuilder(true);
              }}
              onOpenAssign={(id) => {
                setSelectedTrainingId(id);
                setOpenAssign(true);
              }}
              onDelete={(id) => setConfirmDelete({ id })}
            />
          ) : null}

          {tab === "QUESTIONS" ? (
            <TrainingQuizBuilder
              ui={ui}
              lucide={{ Plus, Search, X, PenTool }}
              difficultyEnums={DIFFICULTY}
              questionBank={data.questionBank}
              onUpsert={(qItem) => {
                setData((prev) => {
                  const exists = prev.questionBank.find(
                    (x) => x.id === qItem.id,
                  );
                  return {
                    ...prev,
                    questionBank: exists
                      ? prev.questionBank.map((x) =>
                          x.id === qItem.id ? qItem : x,
                        )
                      : [qItem, ...prev.questionBank],
                  };
                });
                addAudit("Admin", "Upsert question", qItem.text);
              }}
              onCreateNew={(qItem) => {
                setData((prev) => ({
                  ...prev,
                  questionBank: [
                    {
                      ...qItem,
                      id: `q-${Math.random().toString(16).slice(2)}`,
                    },
                    ...prev.questionBank,
                  ],
                }));
                addAudit("Admin", "Created question", qItem.text);
              }}
            />
          ) : null}

          {tab === "ASSIGNMENTS" ? (
            <TrainingAssignmentsPanel
              ui={ui}
              lucide={{ Search, X }}
              trainings={data.trainings}
              users={data.users}
              assignments={data.assignments}
              assignmentStatusEnums={ASSIGNMENT_STATUS}
            />
          ) : null}

          {tab === "AUDIT" ? (
            <TrainingAuditPanel ui={ui} audit={data.audit} />
          ) : null}

          {tab === "APPROVALS" ? (
            <ApprovalsPanel
              ui={ui}
              lucide={{
                ClipboardList,
                ShieldCheck,
                ArrowUpRight,
                CheckCircle2,
              }}
              trainings={data.trainings}
              onApprove={(id) => {
                updateTraining(id, { status: "PUBLISHED", approvedBy: "DPO" });
                addAudit(
                  "DPO",
                  "Approved training",
                  data.trainings.find((t) => t.id === id)?.title || id,
                );
              }}
              onReject={(id) => {
                updateTraining(id, { status: "DRAFT" });
                addAudit(
                  "DPO",
                  "Rejected training",
                  data.trainings.find((t) => t.id === id)?.title || id,
                );
              }}
              onOpenBuilder={(id) => {
                setSelectedTrainingId(id);
                setOpenBuilder(true);
              }}
            />
          ) : null}
        </div>

        <RightRail
          ui={ui}
          lucide={{
            ChevronRight,
            Plus,
            Send,
            BadgeCheck,
            FileUp,
            Users,
            Clock,
            Calendar,
            ShieldAlert,
            Settings,
          }}
          onNewTraining={() => setOpenCreate(true)}
          onJumpApprovals={() => setTab("APPROVALS")}
          onOpenSettings={() => setOpenSettings(true)}
          addAudit={addAudit}
        />
      </div>

      {/* --- Keep your existing drawers here. You can move them later if you want. --- */}
      {/* For brevity: I’m not duplicating all drawers again in this refactor snippet. */}
      {/* Drop in your CreateTrainingDrawer, TrainingBuilderDrawer, AssignTrainingDrawer, ReminderSettingsDrawer from your current file unchanged. */}

      <ConfirmModal
        open={Boolean(confirmDelete?.id)}
        title="Delete training?"
        body="This will remove the training and all assignment records for it. (Audit logs remain if you keep them.)"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const id = confirmDelete?.id;
          if (id) {
            const title = data.trainings.find((t) => t.id === id)?.title || id;
            deleteTraining(id);
            addAudit("Admin", "Deleted training", title);
          }
          setConfirmDelete(null);
        }}
        confirmText="Delete"
      />
    </div>
  );
}

/* ---------------- RIGHT RAIL (kept in page; optional to split later) ---------------- */

function ActionButton({ ui, icon: Icon, title, desc, tone, onClick }) {
  const { cn } = ui;
  const tones = {
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    amber: "bg-amber-600 hover:bg-amber-700",
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    slate: "bg-slate-800 hover:bg-slate-900",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl px-4 py-3 text-left text-white shadow-sm transition",
        tones[tone] || tones.indigo,
      )}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white/15 grid place-items-center ring-1 ring-white/25">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{title}</div>
          <div className="mt-1 text-xs font-semibold text-white/85">{desc}</div>
        </div>
        <ChevronRight className="h-5 w-5 opacity-80" />
      </div>
    </button>
  );
}

function RuleRow({ title, value, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-2xl bg-white grid place-items-center ring-1 ring-slate-200">
          <Icon className="h-4 w-4 text-slate-700" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900">{title}</div>
          <div className="mt-0.5 text-xs font-semibold text-slate-600">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function RightRail({
  ui,
  lucide,
  onNewTraining,
  onJumpApprovals,
  onOpenSettings,
  addAudit,
}) {
  const { Card, SectionTitle } = ui;
  const {
    Plus,
    Send,
    BadgeCheck,
    FileUp,
    Users,
    Clock,
    Calendar,
    ShieldAlert,
    Settings,
  } = lucide;

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          title="Quick Actions"
          subtitle="Most common admin controls"
          right={
            <span className="text-xs font-semibold text-slate-500">
              Admin/DPO
            </span>
          }
        />
        <div className="p-5 space-y-3">
          <ActionButton
            ui={ui}
            icon={Plus}
            title="Create Training"
            desc="Build a new training, modules & mandatory quiz"
            tone="indigo"
            onClick={onNewTraining}
          />
          <ActionButton
            ui={ui}
            icon={Send}
            title="Send Reminder Now"
            desc="Trigger reminder notifications to assignees + DPO"
            tone="amber"
            onClick={() => {
              addAudit("Admin", "Manual reminder triggered", "All assignments");
              alert("Hook this to your notification system (email).");
            }}
          />
          <ActionButton
            ui={ui}
            icon={BadgeCheck}
            title="Review DPO Approvals"
            desc="Publish requires DPO approval"
            tone="emerald"
            onClick={onJumpApprovals}
          />
          <ActionButton
            ui={ui}
            icon={FileUp}
            title="Export Evidence"
            desc="Completion + quiz results + audit logs"
            tone="slate"
            onClick={() => alert("TODO: export to CSV/PDF")}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Compliance Rules"
          subtitle="Based on your SG answers"
          right={
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              type="button"
            >
              <Settings className="h-4 w-4" />
              Rules
            </button>
          }
        />
        <div className="p-5 space-y-3">
          <RuleRow
            icon={Users}
            title="Assignment scope"
            value="Entire Organization (mandatory)"
          />
          <RuleRow
            icon={Clock}
            title="Multiple trainings"
            value="Not allowed concurrently (enforced)"
          />
          <RuleRow
            icon={BadgeCheck}
            title="Approval required"
            value="DPO must approve before publish"
          />
          <RuleRow
            icon={ShieldAlert}
            title="Overdue escalation"
            value="Notify DPO + configurable cadence"
          />
          <RuleRow
            icon={Calendar}
            title="Validity/expiry"
            value="Configurable per training"
          />
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Approvals panel kept here (optional split later) ---------------- */

function ApprovalsPanel({
  ui,
  lucide,
  trainings,
  onApprove,
  onReject,
  onOpenBuilder,
}) {
  const { Card, SectionTitle, cn, pillTone, formatDate } = ui;
  const { ClipboardList, ShieldCheck, ArrowUpRight, CheckCircle2 } = lucide;

  const pending = trainings.filter((t) => t.status === "PENDING_DPO_APPROVAL");

  return (
    <Card>
      <SectionTitle
        title="DPO Approval Queue"
        subtitle="Trainings must be approved by DPO before publishing"
      />
      <div className="p-5 space-y-4">
        {pending.length ? (
          pending.map((t) => (
            <div
              key={t.id}
              className="rounded-3xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {t.title}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-600">
                    Created by: {t.createdBy} • Due: {formatDate(t.dueAt)} •
                    Validity: {t.validityDays} days
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                        pillTone(t.status),
                      )}
                    >
                      {t.status}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      <ClipboardList className="h-4 w-4" />
                      Modules: {t.modules?.length || 0}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      <ShieldCheck className="h-4 w-4" />
                      Quiz: {t.quiz?.questionCount || 0} Qs • Pass{" "}
                      {t.quiz?.passScore || 0}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onOpenBuilder(t.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    type="button"
                  >
                    Review <ArrowUpRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onReject(t.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                    type="button"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => onApprove(t.id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    type="button"
                  >
                    Approve & Publish <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <div className="text-sm font-bold text-slate-900">
              No items pending approval
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-600">
              Draft trainings can be submitted for approval by Admin/DPO.
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-amber-50 via-white to-indigo-50 p-4">
          <div className="text-sm font-bold text-slate-900">Policy note</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Employees can start immediately after assignment (SG). Approval
            controls publishing only — not assignment scheduling.
          </div>
        </div>
      </div>
    </Card>
  );
}
