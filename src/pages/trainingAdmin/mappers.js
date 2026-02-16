// src/pages/trainingAdmin/mappers.js

export function dbStatusToUi(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING_APPROVAL") return "PENDING_DPO_APPROVAL";
  // APPROVED exists in DB; we keep it as APPROVED
  return s;
}

export function uiStatusToDb(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING_DPO_APPROVAL") return "PENDING_APPROVAL";
  return s;
}

export function uiModuleTypeToDb(type) {
  const t = String(type || "").toUpperCase();
  if (t === "DOC") return "DOCUMENT";
  return t;
}

export function dbModuleTypeToUi(type) {
  const t = String(type || "").toUpperCase();
  if (t === "DOCUMENT") return "DOC";
  return t;
}

export function dbAssignmentStatusToUi(status) {
  const s = String(status || "").toUpperCase();
  if (s === "ASSIGNED") return "NOT_STARTED";
  return s;
}

/**
 * UI Training shape used by the segmented blocks:
 * { id, title, status, dueAt, validityDays, createdAt, createdBy, approvedBy, modules, quiz, reminder, ...}
 *
 * DB Training includes createdBy/approvedBy + modules/questions.
 */
export function trainingDbToUi(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description || "",
    status: dbStatusToUi(t.status),
    startAt: t.startAt,
    dueAt: t.dueAt,
    validityDays: t.validityDays ?? 365,
    reminderEveryDays: t.reminderEveryDays ?? 7,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    createdBy: t.createdBy?.fullName || "—",
    approvedBy: t.approvedBy?.fullName || null,
    approvedAt: t.approvedAt || null,

    // modules (if included)
    modules: Array.isArray(t.modules)
      ? t.modules.map((m) => ({
          id: m.id,
          title: m.title,
          contentType: dbModuleTypeToUi(m.type),
          required: true, // DB doesn't store "required" yet; keep true
          description: m.description || "",
          externalUrl: m.externalUrl || "",
          fileAssetId: m.fileAssetId || null,
          sortOrder: m.sortOrder ?? 0,
        }))
      : [],

    // quiz UI is legacy; DB stores questions instead
    quiz: {
      questionCount: Array.isArray(t.questions) ? t.questions.length : 0,
      passScore: 70,
      attemptsAllowed: 3,
    },

    reminder: {
      enabled: true,
      everyDays: t.reminderEveryDays ?? 7,
      beforeDueDays: 7,
      overdueEveryDays: 2,
      ccDpoOnOverdue: true,
    },

    // keep questions if included
    questions: Array.isArray(t.questions) ? t.questions : [],
    totalUsersAssigned: t.totalUsersAssigned ?? 0,
    totalCompleted: t.totalCompleted ?? 0,
  };
}

export function trainingUiToDbPatch(ui) {
  return {
    title: ui.title,
    description: ui.description || null,
    startAt: ui.startAt || null,
    dueAt: ui.dueAt || null,
    validityDays: ui.validityDays ?? 365,
    reminderEveryDays: ui.reminderEveryDays ?? ui.reminder?.everyDays ?? 7,
  };
}
