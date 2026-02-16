import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Activity,
  ClipboardList,
  GraduationCap,
  Users,
  Send,
  Settings,
  FileUp,
  PenTool,
  BadgeCheck,
  ArrowUpRight,
  Trash2,
  Edit3,
  Clock,
  Calendar,
} from "lucide-react";

import { cn, formatDate, existsIn } from "./trainingAdmin/utils";

import {
  listTrainings,
  createTraining,
  getTraining,
  updateTraining as updateTrainingApi,
  submitTraining,
  approveTraining,
  publishTraining,
  archiveTraining,
  addTrainingModule,
  updateTrainingModule,
  deleteTrainingModule,
  addTrainingQuestion,
  assignTrainingAll,
  listTrainingAssignments,
  updateTrainingQuestion,
  deleteTrainingQuestion,
} from "../lib/admin";

import { Card, SectionTitle } from "./trainingAdmin/ui/atoms";
import { Tabs } from "./trainingAdmin/ui/atoms";
import { KpiCard } from "./trainingAdmin/ui/atoms";
import { ConfirmModal } from "./trainingAdmin/ui/atoms";
import { ActionButton } from "./trainingAdmin/ui/atoms";
import { RuleRow } from "./trainingAdmin/ui/atoms";
import { deleteTraining as deleteTrainingApi } from "../lib/admin";
import { DashboardPanel } from "./trainingAdmin/panels/DashboardPanel";
import { TrainingsPanel } from "./trainingAdmin/panels/TrainingsPanel";
import { QuestionBankPanel } from "./trainingAdmin/panels/QuestionBankPanel";
import { AssignmentsPanel } from "./trainingAdmin/panels/AssignmentsPanel";
import { ApprovalsPanel } from "./trainingAdmin/panels/ApprovalsPanel";
import { AuditPanel } from "./trainingAdmin/panels/AuditPanel";

import { CreateTrainingDrawer } from "./trainingAdmin/drawers/CreateTrainingDrawer";
import { TrainingBuilderDrawer } from "./trainingAdmin/drawers/TrainingBuilderDrawer";
import { QuestionDrawer } from "./trainingAdmin/drawers/QuestionDrawer";
import { AssignTrainingDrawer } from "./trainingAdmin/drawers/AssignTrainingDrawer";
import { ReminderSettingsDrawer } from "./trainingAdmin/drawers/ReminderSettingsDrawer";

/**
 * Privacy Training Admin
 * - Tailwind only
 * - No root css
 * - UI is deep/controlled, backend hooks are TODO
 */

/* ---------------- main page ---------------- */

export default function TrainingAdmin() {
  const [tab, setTab] = useState("DASH");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(() => ({
    trainings: [],
    users: [], // optional: add users endpoint later
    assignments: [],
    questionBank: [],
    audit: [], // still local for now unless you add audit endpoint
  }));

  // top filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");

  // drawers/modals
  const [openCreate, setOpenCreate] = useState(false);
  const [openBuilder, setOpenBuilder] = useState(false);
  const [openQuestion, setOpenQuestion] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // selected training in builder/assign
  const [selectedTrainingId, setSelectedTrainingId] = useState(null);

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

    // newest first
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

  useEffect(() => {
    if (tab !== "QUESTIONS") return;

    (async () => {
      try {
        // If no trainings, nothing to load
        if (!data.trainings.length) {
          setData((p) => ({ ...p, questionBank: [] }));
          return;
        }

        // Fetch details for trainings (so we get questions)
        const details = await Promise.all(
          data.trainings.map((t) => getTraining(t.id).catch(() => null)),
        );

        const all = [];
        for (const full of details) {
          if (!full) continue;
          for (const q of full.questions || []) {
            all.push({
              id: q.id,
              trainingId: full.id, // IMPORTANT so edit/delete works
              text: q.prompt,
              difficulty: "EASY",
              tags: [],
              type: q.type,
              options: (q.options || []).map((o) => o.text),
              answerIndex: q.correctOptionId
                ? (q.options || []).findIndex((o) => o.id === q.correctOptionId)
                : 0,
            });
          }
        }

        setData((p) => ({ ...p, questionBank: all }));
      } catch (e) {
        console.error(e);
        alert(e?.message || "Failed to load question bank");
      }
    })();
  }, [tab, data.trainings]);


  const kpis = useMemo(() => {
    const published = data.trainings.filter(
      (t) => t.status === "PUBLISHED",
    ).length;

    const pending = data.trainings.filter(
      (t) => t.status === "PENDING_DPO_APPROVAL",
    ).length;

    // organization-wide compliance based on active published training(s)
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

    // next expiry = earliest due date among published trainings
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
      // Optional: server-side filter + search
      const params = {};
      if (status !== "ALL") params.status = uiStatusToDb(status);
      if (q.trim()) params.search = q.trim();

      const res = await listTrainings(params); // { items }
      const items = res.items || [];

      // list endpoint doesn't include createdBy/modules/questions, so map minimal
      const trainingsUi = items.map((t) =>
        trainingDbToUi({
          ...t,
          createdBy: null,
          approvedBy: null,
          modules: [],
          questions: [],
        }),
      );

      // Fetch assignments only for PUBLISHED trainings so KPIs work
      const publishedIds = items
        .filter((t) => t.status === "PUBLISHED")
        .map((t) => t.id);

      const assignmentsChunks = await Promise.all(
        publishedIds.map((id) =>
          listTrainingAssignments(id).catch(() => ({ items: [] })),
        ),
      );

      const assignmentsFlat = assignmentsChunks
        .flatMap((x) => x.items || [])
        .map((a) => ({
          id: a.id,
          trainingId: a.trainingId,
          userId: a.userId,
          status: a.status === "ASSIGNED" ? "NOT_STARTED" : a.status,
          score: a.score,
          completedAt: a.completedAt,
          dueAt: a.dueAt,
          user: a.user, // backend include user
        }));

      setData((prev) => ({
        ...prev,
        trainings: trainingsUi,
        assignments: assignmentsFlat,
      }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function mapDbQuestionToUi(q) {
    return {
      id: q.id,
      text: q.prompt,
      difficulty: "EASY",
      tags: [],
      type: q.type,
      options: (q.options || []).map((o) => o.text),
      answerIndex: q.correctOptionId
        ? (q.options || []).findIndex((o) => o.id === q.correctOptionId)
        : 0,
    };
  }

  async function openTrainingBuilder(trainingId) {
    setSelectedTrainingId(trainingId);
    setOpenBuilder(true);

    try {
      const full = await getTraining(trainingId); // includes modules/questions/createdBy/approvedBy
      const ui = trainingDbToUi(full);

      setData((prev) => ({
        ...prev,
        trainings: prev.trainings.map((t) => (t.id === trainingId ? ui : t)),
        // OPTIONAL: build question bank from this training’s questions when builder opened
        questionBank: (full.questions || []).map((q) => ({
          id: q.id,
          text: q.prompt,
          difficulty: "EASY",
          tags: [],
          type: q.type,
          options: (q.options || []).map((o) => o.text),
          answerIndex: q.correctOptionId
            ? (q.options || []).findIndex((o) => o.id === q.correctOptionId)
            : 0,
        })),
      }));
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to load training");
    }
  }

  function openAssignment(trainingId) {
    setSelectedTrainingId(trainingId);
    setOpenAssign(true);
  }

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

  function addTraining(newT) {
    setData((prev) => ({ ...prev, trainings: [newT, ...prev.trainings] }));
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

  function uiStatusToDb(status) {
    if (status === "PENDING_DPO_APPROVAL") return "PENDING_APPROVAL";
    return status;
  }
  function dbStatusToUi(status) {
    if (status === "PENDING_APPROVAL") return "PENDING_DPO_APPROVAL";
    return status;
  }

  function uiModuleTypeToDb(contentType) {
    if (contentType === "DOC") return "DOCUMENT";
    return contentType; // LINK, VIDEO, ASSESSMENT
  }
  function dbModuleTypeToUi(type) {
    if (type === "DOCUMENT") return "DOC";
    return type;
  }

  function trainingDbToUi(t) {
    return {
      id: t.id,
      title: t.title,
      description: t.description || "",
      status: dbStatusToUi(t.status),
      startAt: t.startAt,
      dueAt: t.dueAt,
      validityDays: t.validityDays ?? 365,

      // UI expects reminder object (your DB has reminderEveryDays)
      reminder: {
        enabled: true,
        everyDays: t.reminderEveryDays ?? 7,
        beforeDueDays: 7,
        overdueEveryDays: 2,
        ccDpoOnOverdue: true,
      },

      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      approvedAt: t.approvedAt || null,
      approvedBy: t.approvedBy?.fullName || null,
      createdBy: t.createdBy?.fullName || "—",

      totalUsersAssigned: t.totalUsersAssigned ?? 0,
      totalCompleted: t.totalCompleted ?? 0,

      modules: Array.isArray(t.modules)
        ? t.modules.map((m) => ({
            id: m.id,
            title: m.title,
            contentType: dbModuleTypeToUi(m.type),
            required: true, // DB doesn't store this
            description: m.description || "",
            externalUrl: m.externalUrl || "",
            fileAssetId: m.fileAssetId || null,
            sortOrder: m.sortOrder ?? 0,
          }))
        : [],

      // Keep raw questions so we can show counts / build question bank later
      questions: Array.isArray(t.questions) ? t.questions : [],

      // Your UI expects a quiz object; backend actually uses questions list
      quiz: {
        questionCount: Array.isArray(t.questions) ? t.questions.length : 0,
        passScore: 70,
        attemptsAllowed: 3,
      },
    };
  }

  function trainingUiToDbPatch(ui) {
    return {
      title: ui.title,
      description: ui.description || null,
      startAt: ui.startAt || null,
      dueAt: ui.dueAt || null,
      validityDays: ui.validityDays ?? 365,
      reminderEveryDays: ui?.reminder?.everyDays ?? 7,
      // status updates via workflow endpoints, not via PUT (we keep clean)
    };
  }

  /* ------------------ UI ------------------ */

  return (
    <div className="space-y-6">
      {/* Top hero */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-500">
                Training
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                Privacy Training Admin
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-600 max-w-3xl">
                Build privacy training modules, assign to the entire
                organization, enforce deadlines, run mandatory quizzes, and keep
                audit-ready evidence.
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={refresh}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  type="button"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", loading ? "animate-spin" : "")}
                  />
                  Refresh
                </button>

                <button
                  onClick={() => setOpenCreate(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  New Training
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setOpenSettings(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  type="button"
                >
                  <Settings className="h-4 w-4" />
                  Rules &amp; Reminders
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-600" />
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard
          title="COMPLETION RATE"
          value={`${kpis.completionRate}%`}
          hint={`${kpis.completed} completed • ${data.assignments.length} assigned`}
          tone="indigo"
          icon={GraduationCap}
        />
        <KpiCard
          title="IN PROGRESS"
          value={kpis.inProgress}
          hint="Users currently taking training"
          tone="amber"
          icon={Activity}
        />
        <KpiCard
          title="OVERDUE"
          value={kpis.overdue}
          hint="Overdue alerts sent to DPO"
          tone="rose"
          icon={ShieldAlert}
        />
        <KpiCard
          title="AUDIT READY"
          value={kpis.auditReady ? "YES" : "NO"}
          hint={
            kpis.nextDueAt
              ? `Next due: ${formatDate(kpis.nextDueAt)}`
              : "No published training yet"
          }
          tone={kpis.auditReady ? "emerald" : "slate"}
          icon={kpis.auditReady ? ShieldCheck : ClipboardList}
        />
      </div>

      {/* Tabs + search */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "DASH", label: "Dashboard", icon: Activity },
              { key: "TRAININGS", label: "Trainings", icon: GraduationCap },
              { key: "QUESTIONS", label: "Question Bank", icon: PenTool },
              { key: "ASSIGNMENTS", label: "Assignments", icon: Users },
              { key: "APPROVALS", label: "DPO Approvals", icon: BadgeCheck },
              { key: "AUDIT", label: "Audit Trail", icon: FileUp },
            ]}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-[420px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search trainings by title..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
              {q ? (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1 text-slate-500 hover:bg-slate-100"
                  type="button"
                >
                  ✕
                </button>
              ) : null}
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_DPO_APPROVAL">Pending DPO</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main grid (left content + right actions) */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left content */}
        <div className="space-y-6">
          {tab === "DASH" ? (
            <DashboardPanel
              trainings={data.trainings}
              assignments={data.assignments}
              users={data.users}
            />
          ) : null}

          {tab === "TRAININGS" ? (
            <TrainingsPanel
              trainings={trainingsFiltered}
              assignmentsByTraining={assignmentsByTraining}
              onOpenBuilder={(id) => openTrainingBuilder(id)}
              onOpenAssign={(id) => openAssignment(id)}
              onDelete={(id) => setConfirmDelete({ id })}
            />
          ) : null}

          {tab === "QUESTIONS" ? (
            <QuestionBankPanel
              questionBank={data.questionBank}
              onCreate={() => {
                setEditingQuestion(null);
                setOpenQuestion(true);
              }}
              onEdit={(qItem) => {
                setEditingQuestion(qItem);
                setSelectedTrainingId(qItem.trainingId);
                setOpenQuestion(true);
              }}
              onDelete={async (qItem) => {
                if (!qItem?.id || !qItem?.trainingId) return;
                const ok = window.confirm("Delete this question?");
                if (!ok) return;

                try {
                  await deleteTrainingQuestion(qItem.trainingId, qItem.id);
                  // remove locally
                  setData((p) => ({
                    ...p,
                    questionBank: p.questionBank.filter(
                      (x) => x.id !== qItem.id,
                    ),
                  }));
                  addAudit("Admin", "Deleted question", qItem.text);
                } catch (e) {
                  console.error(e);
                  alert(e?.message || "Failed to delete question");
                }
              }}
            />
          ) : null}

          {tab === "ASSIGNMENTS" ? (
            <AssignmentsPanel
              trainings={data.trainings}
              users={data.users}
              assignments={data.assignments}
            />
          ) : null}

          {tab === "APPROVALS" ? (
            <ApprovalsPanel
              trainings={data.trainings}
              onApprove={async (id) => {
                try {
                  await approveTraining(id); // DPO
                  // If the current user is ADMIN too, publish will succeed; otherwise ignore
                  try {
                    await publishTraining(id);
                  } catch {}
                  addAudit(
                    "DPO",
                    "Approved training",
                    data.trainings.find((t) => t.id === id)?.title || id,
                  );
                  await refresh();
                } catch (e) {
                  console.error(e);
                  alert(e?.message || "Approval failed");
                }
              }}
              onReject={async (id) => {
                alert(
                  "Reject endpoint is not implemented for training yet. Add /training/:id/reject if needed.",
                );
              }}
              onOpenBuilder={(id) => openTrainingBuilder(id)}
            />
          ) : null}

          {tab === "AUDIT" ? <AuditPanel audit={data.audit} /> : null}
        </div>

        {/* Right actions */}
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
                icon={Plus}
                title="Create Training"
                desc="Build a new training, modules & mandatory quiz"
                tone="indigo"
                onClick={() => setOpenCreate(true)}
              />
              <ActionButton
                icon={Send}
                title="Send Reminder Now"
                desc="Trigger reminder notifications to assignees + DPO"
                tone="amber"
                onClick={() => {
                  addAudit(
                    "Admin",
                    "Manual reminder triggered",
                    "All assignments",
                  );
                  alert("Hook this to your notification system (email).");
                }}
              />
              <ActionButton
                icon={BadgeCheck}
                title="Review DPO Approvals"
                desc="Publish requires DPO approval"
                tone="emerald"
                onClick={() => setTab("APPROVALS")}
              />
              <ActionButton
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
      </div>

      {/* Create Training Drawer */}
      <CreateTrainingDrawer
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={async (t) => {
          try {
            await createTraining(trainingUiToDbPatch(t));
            setOpenCreate(false);
            setTab("TRAININGS");
            await refresh();
          } catch (e) {
            console.error(e);
            alert(e?.message || "Failed to create training");
          }
        }}
      />

      {/* Builder Drawer */}
      <TrainingBuilderDrawer
        open={openBuilder}
        training={selectedTraining()}
        onClose={() => setOpenBuilder(false)}
        onSave={async (fullUiTraining) => {
          if (!selectedTrainingId) return;

          try {
            // 1) Update training meta
            await updateTrainingApi(
              selectedTrainingId,
              trainingUiToDbPatch(fullUiTraining),
            );

            // 2) Sync modules
            const existing = await getTraining(selectedTrainingId);
            const existingMods = existing.modules || [];

            const nextMods = fullUiTraining.modules || [];

            const existingById = new Map(existingMods.map((m) => [m.id, m]));
            const nextById = new Map(
              nextMods.filter((m) => m.id).map((m) => [m.id, m]),
            );

            // deleted = in existing but not in next
            const toDelete = existingMods.filter((m) => !nextById.has(m.id));

            // upsert
            for (const m of nextMods) {
              const payload = {
                title: m.title,
                type: uiModuleTypeToDb(m.contentType),
                description: m.description || null,
                externalUrl: m.externalUrl || null,
                fileAssetId: m.fileAssetId || null,
                sortOrder: m.sortOrder ?? 0,
              };

              // if exists in DB -> update, else create
              if (m.id && existingById.has(m.id)) {
                await updateTrainingModule(selectedTrainingId, m.id, payload);
              } else {
                await addTrainingModule(selectedTrainingId, payload);
              }
            }

            for (const m of toDelete) {
              await deleteTrainingModule(selectedTrainingId, m.id);
            }

            // 3) Reload the full training and update UI state
            const fresh = await getTraining(selectedTrainingId);
            const ui = trainingDbToUi(fresh);

            setData((prev) => ({
              ...prev,
              trainings: prev.trainings.map((t) =>
                t.id === selectedTrainingId ? ui : t,
              ),
            }));

            // optional local audit
            addAudit("Admin", "Updated training", ui.title);
          } catch (e) {
            console.error(e);
            alert(e?.message || "Failed to save training");
          }
        }}
        onRequestApproval={async () => {
          if (!selectedTrainingId) return;
          try {
            await submitTraining(selectedTrainingId);
            addAudit(
              "Admin",
              "Requested DPO approval",
              selectedTraining()?.title || selectedTrainingId,
            );
            await refresh();
          } catch (e) {
            console.error(e);
            alert(e?.message || "Failed to submit for approval");
          }
        }}
      />

      {/* Question Drawer */}
      <QuestionDrawer
        open={openQuestion}
        onClose={() => {
          setOpenQuestion(false);
          setEditingQuestion(null);
        }}
        initialQuestion={editingQuestion}
        onSave={async (qItem) => {
          // Decide trainingId:
          // - edit mode uses qItem.trainingId
          // - create mode uses selectedTrainingId or first training
          const trainingId =
            qItem.trainingId || selectedTrainingId || data.trainings[0]?.id;

          if (!trainingId) {
            alert("Create/select a training first.");
            return;
          }

          const payload = {
            type: "MCQ",
            prompt: qItem.text,
            options: (qItem.options || []).map((text, idx) => ({
              label: String.fromCharCode(65 + idx),
              text,
            })),
            correctIndex: qItem.answerIndex,
            points: 1,
          };

          try {
            if (qItem.id) {
              await updateTrainingQuestion(trainingId, qItem.id, payload);
              addAudit("Admin", "Updated question", qItem.text);
            } else {
              await addTrainingQuestion(trainingId, payload);
              addAudit("Admin", "Created question", qItem.text);
            }

            // Reload this training and rebuild questionBank (simple + accurate)
            const fresh = await getTraining(trainingId);

            const rebuilt = (fresh.questions || []).map((q) => ({
              id: q.id,
              trainingId,
              text: q.prompt,
              difficulty: "EASY",
              tags: [],
              type: q.type,
              options: (q.options || []).map((o) => o.text),
              answerIndex: q.correctOptionId
                ? (q.options || []).findIndex((o) => o.id === q.correctOptionId)
                : 0,
            }));

            setData((p) => ({
              ...p,
              questionBank: rebuilt,
            }));

            setOpenQuestion(false);
            setEditingQuestion(null);
          } catch (e) {
            console.error(e);
            alert(e?.message || "Failed to save question");
          }
        }}
      />

      {/* Assignment Drawer */}
      <AssignTrainingDrawer
        open={openAssign}
        training={selectedTraining()}
        users={data.users} // optional; can be []
        assignments={data.assignments}
        onClose={() => setOpenAssign(false)}
        onAssign={async (_ignored, dueAtIso) => {
          if (!selectedTrainingId) return;

          try {
            // 1) update dueAt on training
            await updateTrainingApi(selectedTrainingId, { dueAt: dueAtIso });

            // 2) assign all (backend enforces rules)
            await assignTrainingAll(selectedTrainingId);

            // 3) fetch updated assignments for this training
            const res = await listTrainingAssignments(selectedTrainingId);
            const items = (res.items || []).map((a) => ({
              id: a.id,
              trainingId: a.trainingId,
              userId: a.userId,
              status: a.status === "ASSIGNED" ? "NOT_STARTED" : a.status,
              score: a.score,
              completedAt: a.completedAt,
              dueAt: a.dueAt,
              user: a.user,
            }));

            setData((prev) => ({
              ...prev,
              assignments: [
                ...prev.assignments.filter(
                  (x) => x.trainingId !== selectedTrainingId,
                ),
                ...items,
              ],
              trainings: prev.trainings.map((t) =>
                t.id === selectedTrainingId ? { ...t, dueAt: dueAtIso } : t,
              ),
            }));

            addAudit(
              "Admin",
              "Assigned training org-wide",
              selectedTraining()?.title || selectedTrainingId,
            );
            setOpenAssign(false);
            await refresh();
          } catch (e) {
            console.error(e);
            alert(e?.message || "Assign failed");
          }
        }}
      />

      {/* Settings Drawer */}
      <ReminderSettingsDrawer
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        onSave={() => {
          addAudit("Admin", "Updated reminder rules", "Global rules (future)");
          setOpenSettings(false);
        }}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={Boolean(confirmDelete?.id)}
        title="Delete training?"
        body="This will remove the training and all assignment records for it. (Audit logs remain if you keep them.)"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          const id = confirmDelete?.id;
          if (!id) return;

          try {
            await deleteTrainingApi(id);
            setConfirmDelete(null);
            await refresh();
          } catch (e) {
            alert(e?.message || "Failed to delete training");
          }
        }}
        confirmText="Delete"
      />
    </div>
  );
}
