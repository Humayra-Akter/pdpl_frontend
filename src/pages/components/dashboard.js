export function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

export function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

export function pick(obj, paths = []) {
  if (!obj) return undefined;
  for (const p of paths) {
    const v = getPath(obj, p);
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function getPath(obj, path) {
  if (!obj || typeof obj !== "object") return undefined;
  if (!path.includes(".")) return obj[path];
  return path
    .split(".")
    .reduce(
      (acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined),
      obj,
    );
}

// ---------- date helpers ----------
export function rangeToFrom(rangeKey) {
  const now = new Date();
  const from = new Date(now);

  if (rangeKey === "1D") from.setDate(from.getDate() - 1);
  else if (rangeKey === "7D") from.setDate(from.getDate() - 7);
  else if (rangeKey === "30D") from.setDate(from.getDate() - 30);
  else if (rangeKey === "12M") from.setFullYear(from.getFullYear() - 1);
  else from.setDate(from.getDate() - 7);

  return { from, to: now };
}

export function toISODate(d) {
  try {
    return new Date(d).toISOString();
  } catch {
    return "";
  }
}

export function timeAgo(ts) {
  const t = new Date(ts).getTime();
  if (!Number.isFinite(t) || t <= 0) return "—";
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function normalizeListResponse(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.results)) return res.results;
  return [];
}

/* ---------- readiness score ---------- */
export function computeReadinessScore({
  adminSummary,
  gapSummary,
  incidentSummary,
  dpias,
  trainings,
}) {
  // Prefer backend if exists
  const direct =
    safeNum(
      pick(adminSummary, [
        "readinessScore",
        "readinessScorePct",
        "kpis.readinessScore",
      ]),
    ) || safeNum(pick(adminSummary, ["score", "riskScore"]));
  if (direct) return clamp(direct, 0, 100);

  // deterministic computed score:
  // + GAP completion (0..1)
  // + DPIA avg progress (0..1)
  // - open incidents penalty
  const gapCompleted =
    safeNum(
      pick(gapSummary, [
        "kpis.completed",
        "status.completed",
        "completedCount",
      ]),
    ) || 0;
  const gapTotal =
    safeNum(
      pick(gapSummary, ["kpis.total", "total", "count", "totalAssessments"]),
    ) || Math.max(1, gapCompleted);
  const gapRatio = clamp(gapCompleted / Math.max(1, gapTotal), 0, 1);

  const dpiaAvg = avgProgress(dpias);
  const openInc = safeNum(pick(incidentSummary, ["open", "openCount"])) || 0;

  // weighting
  const base = 100 * (0.5 * gapRatio + 0.5 * dpiaAvg);
  const penalty = Math.min(35, openInc * 5);
  return clamp(Math.round(base - penalty), 0, 100);
}

function avgProgress(dpias) {
  if (!Array.isArray(dpias) || dpias.length === 0) return 0.65; // deterministic fallback
  const vals = dpias.map(
    (d) => safeNum(pick(d, ["progress", "completion", "percent"])) / 100,
  );
  const sum = vals.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  return clamp(sum / Math.max(1, vals.length), 0, 1);
}

/* ---------- trend series (12 points) ---------- */
export function emptySeries12(rangeKey) {
  const labels = label12(rangeKey);
  return labels.map((l) => ({ label: l, value: 0 }));
}

export function buildTrend12({
  range,
  dpias,
  gapSummary,
  incidentSummary,
  readinessScore,
}) {
  // Deterministic series derived from readinessScore + small influence from critical gaps/open incidents
  const labels = label12(range);
  const crit = safeNum(pick(gapSummary, ["kpis.critical", "critical"])) || 0;
  const openInc = safeNum(pick(incidentSummary, ["open", "openCount"])) || 0;

  // shape: mild slope with consistent deltas, no randomness
  const base = clamp(safeNum(readinessScore), 0, 100);
  const down = Math.min(12, crit * 2 + openInc * 1.5);

  return labels.map((l, i) => {
    const t = i / (labels.length - 1);
    const v = clamp(Math.round(base - down * (1 - t) + t * 4), 0, 100);
    return { label: l, value: v };
  });
}

function label12(rangeKey) {
  if (rangeKey === "1D")
    return Array.from(
      { length: 12 },
      (_, i) => `${(i * 2).toString().padStart(2, "0")}:00`,
    );
  if (rangeKey === "7D")
    return [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
      "Wk+1",
      "Wk+2",
      "Wk+3",
      "Wk+4",
      "Wk+5",
    ];
  if (rangeKey === "30D")
    return Array.from({ length: 12 }, (_, i) => `D${i * 3 + 1}`);
  return Array.from({ length: 12 }, (_, i) => `M${i + 1}`);
}

/* ---------- DPIA pipeline ---------- */
export function computeDpiaPipeline(dpias) {
  const out = {
    draft: 0,
    inProgress: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
  };
  for (const d of dpias || []) {
    const s = String(pick(d, ["status", "state"]) || "").toUpperCase();
    if (s.includes("REJECT")) out.rejected += 1;
    else if (s.includes("APPROV")) out.approved += 1;
    else if (s.includes("SUBMIT")) out.submitted += 1;
    else if (
      s.includes("PROGRESS") ||
      s.includes("IN_PROGRESS") ||
      s.includes("INPROGRESS")
    )
      out.inProgress += 1;
    else out.draft += 1;
  }
  return out;
}

export function computeProgressBuckets(dpias) {
  const buckets = [
    { label: "0–25", value: 0 },
    { label: "26–50", value: 0 },
    { label: "51–75", value: 0 },
    { label: "76–100", value: 0 },
  ];
  for (const d of dpias || []) {
    const p = clamp(
      safeNum(pick(d, ["progress", "completion", "percent"])),
      0,
      100,
    );
    if (p <= 25) buckets[0].value += 1;
    else if (p <= 50) buckets[1].value += 1;
    else if (p <= 75) buckets[2].value += 1;
    else buckets[3].value += 1;
  }
  return buckets;
}

/* ---------- risk grid ---------- */
export function buildRiskGrid5x5({ incs, dpias }) {
  // If incidents have impact/likelihood, populate; else placeholder.
  const cells = [];
  let hasData = false;

  for (let lik = 1; lik <= 5; lik++)
    for (let imp = 1; imp <= 5; imp++)
      cells.push({ likelihood: lik, impact: imp, value: 0 });

  const add = (likelihood, impact) => {
    const l = clamp(safeNum(likelihood), 1, 5);
    const i = clamp(safeNum(impact), 1, 5);
    const c = cells.find((x) => x.likelihood === l && x.impact === i);
    if (c) c.value += 1;
    hasData = true;
  };

  for (const it of incs || []) {
    const l = pick(it, ["likelihood", "risk.likelihood"]);
    const i = pick(it, ["impact", "risk.impact"]);
    if (l && i) add(l, i);
  }

  // fallback from dpia risk if present
  if (!hasData) {
    for (const it of dpias || []) {
      const l = pick(it, ["riskLikelihood", "risk.likelihood"]);
      const i = pick(it, ["riskImpact", "risk.impact"]);
      if (l && i) add(l, i);
    }
  }

  return { cells, hasData };
}

/* ---------- Focus alerts rules ---------- */
export function buildFocusAlerts({
  gapSummary,
  dpias,
  incidentSummary,
  trainingsSummary,
}) {
  const alerts = [];

  const critical = safeNum(
    pick(gapSummary, ["kpis.critical", "critical", "kpis.criticalCount"]),
  );
  if (critical > 0) {
    alerts.push({
      id: "crit-gaps",
      severity: "High",
      title: "Critical gaps (<50% progress)",
      recommendation:
        "Prioritize closing critical controls and assign owners for remediation.",
      href: "/admin/gap",
    });
  }

  const stalled = (dpias || []).filter((d) => {
    const status = String(pick(d, ["status", "state"]) || "").toUpperCase();
    const prog = safeNum(pick(d, ["progress", "completion", "percent"]));
    return status !== "SUBMITTED" && prog > 0 && prog < 50;
  }).length;

  if (stalled > 0) {
    alerts.push({
      id: "stalled-dpias",
      severity: "Medium",
      title: "Stalled DPIAs",
      recommendation:
        "Review incomplete DPIAs and unblock owners before submission deadlines.",
      href: "/admin/dpia",
    });
  }

  const openInc = safeNum(pick(incidentSummary, ["open", "openCount"]));
  if (openInc > 0) {
    alerts.push({
      id: "open-incidents",
      severity: "High",
      title: "Open incidents",
      recommendation:
        "Triage open incidents and confirm containment + closure steps.",
      href: "/admin/incidents",
    });
  }

  const trainingKnown =
    trainingsSummary &&
    pick(trainingsSummary, ["completion", "completionRate", "coverage"]) !==
      undefined;

  if (!trainingKnown) {
    alerts.push({
      id: "training-unknown",
      severity: "Low",
      title: "Training coverage unknown",
      recommendation:
        "Connect training completion analytics to track coverage by role.",
      href: "/admin/training",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-clear",
      severity: "Low",
      title: "All clear",
      recommendation: "No major blockers detected in the selected range.",
      href: "/admin",
    });
  }

  return alerts.slice(0, 6);
}

/* ---------- activity feed ---------- */
export function mergeActivity({
  gapSummary,
  adminSummary,
  dpias,
  incs,
  gaps,
  trainings,
}) {
  const items = [];

  // 1) gap.summary.recent (if exists)
  const gapRecent =
    pick(gapSummary, [
      "recent",
      "summary.recent",
      "kpis.recent",
      "charts.recent",
    ]) || [];
  if (Array.isArray(gapRecent)) {
    for (const r of gapRecent) {
      const ts =
        pick(r, [
          "ts",
          "time",
          "createdAt",
          "updatedAt",
          "created_at",
          "updated_at",
        ]) || Date.now();
      items.push({
        id: `gap-${pick(r, ["id", "_id"]) || Math.random()}`,
        module: "GAP",
        action: pick(r, ["action", "title", "event"]) || "GAP updated",
        actor: pick(r, ["actor", "user", "by"]) || "",
        ts,
        href: "/admin/gap",
      });
    }
  }

  // 2) admin dashboard recent events if present
  const adminEvents =
    pick(adminSummary, ["recent", "events", "recentEvents", "activity"]) || [];
  if (Array.isArray(adminEvents)) {
    for (const e of adminEvents) {
      const mod = (pick(e, ["module", "type"]) || "Dashboard").toString();
      const ts =
        pick(e, [
          "ts",
          "time",
          "createdAt",
          "updatedAt",
          "created_at",
          "updated_at",
        ]) || Date.now();
      items.push({
        id: `adm-${pick(e, ["id", "_id"]) || Math.random()}`,
        module: mod,
        action: pick(e, ["action", "title", "event"]) || "Activity",
        actor: pick(e, ["actor", "user", "by"]) || "",
        ts,
        href: moduleToHref(mod, pick(e, ["entityId", "id", "_id"])),
      });
    }
  }

  // 3) fallback from lists (dpia/incidents/etc)
  pushFromList(items, dpias, "DPIA", "/admin/dpia", "DPIA updated");
  pushFromList(
    items,
    incs,
    "Incidents",
    "/admin/incidents",
    "Incident updated",
  );
  pushFromList(items, gaps, "GAP", "/admin/gap", "GAP assessment updated");
  pushFromList(
    items,
    trainings,
    "Training",
    "/admin/training",
    "Training updated",
  );

  // sort newest
  return items
    .map((x) => ({ ...x, ts: new Date(x.ts).getTime() || 0 }))
    .filter((x) => x.ts > 0)
    .sort((a, b) => b.ts - a.ts);
}

function pushFromList(items, arr, module, baseHref, defaultAction) {
  for (const x of arr || []) {
    const id = pick(x, ["id", "_id"]);
    const ts =
      pick(x, ["updatedAt", "createdAt", "updated_at", "created_at"]) ||
      Date.now();
    items.push({
      id: `${module}-${id || Math.random()}`,
      module,
      action: pick(x, ["title", "name", "summary", "subject"]) || defaultAction,
      actor: pick(x, ["actor", "ownerName", "createdByName"]) || "",
      ts,
      href: id ? `${baseHref}/${id}` : baseHref,
    });
  }
}

function moduleToHref(mod, entityId) {
  const m = String(mod || "").toLowerCase();
  if (m.includes("gap")) return "/admin/gap";
  if (m.includes("dpia"))
    return entityId ? `/admin/dpia/${entityId}` : "/admin/dpia";
  if (m.includes("incident"))
    return entityId ? `/admin/incidents/${entityId}` : "/admin/incidents";
  if (m.includes("ropa"))
    return entityId ? `/admin/ropa/${entityId}` : "/admin/ropa";
  if (m.includes("train"))
    return entityId ? `/admin/training/${entityId}` : "/admin/training";
  if (m.includes("user")) return "/admin/users";
  return "/admin";
}
