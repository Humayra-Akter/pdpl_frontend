/* ---------------- utils ---------------- */

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString();
}

function clamp(n, a, b) {
  const x = Number(n);
  if (Number.isNaN(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function pillTone(key) {
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

function existsIn(arr, id) {
  return Boolean(arr.find((x) => x.id === id));
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

  // one active assignment at a time (your requirement)
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

export { cn, formatDate, clamp, pillTone, existsIn, makeMock };
