import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Download,
  LayoutDashboard,
  ShieldAlert,
  ClipboardList,
  FileText,
  AlertTriangle,
  Users,
  GraduationCap,
  ArrowUpRight,
  Plus,
  Play,
} from "lucide-react";

import { api } from "../lib/http";
import {
  cx,
  rangeToFrom,
  toISODate,
  safeNum,
  pick,
  timeAgo,
  clamp,
  computeReadinessScore,
  buildTrend12,
  emptySeries12,
  normalizeListResponse,
  computeDpiaPipeline,
  computeProgressBuckets,
  buildRiskGrid5x5,
  buildFocusAlerts,
  mergeActivity,
} from "./components/dashboard";

import {
  SubheaderBar,
  TabButton,
  PastelKpiTile,
  SectionCard,
  FocusCard,
  StatusPill,
  ProgressBar,
  EmptyState,
} from "./components/DashboardUI";

import {
  SkeletonKpiRow,
  SkeletonChartsGrid,
  SkeletonTable,
  SkeletonFocus,
} from "./components/DashboardSkeletons";

import {
  ChartAreaTrend,
  ChartBarWorkload,
  ChartDonutGap,
  ChartStackedDpia,
  RiskHeatmap5x5,
} from "./components/DashboardCharts";

const RANGES = [
  { key: "1D", label: "1D" },
  { key: "7D", label: "7D" },
  { key: "30D", label: "30D" },
  { key: "12M", label: "12M" },
];

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "gap", label: "GAP", icon: ClipboardList },
  { key: "dpia", label: "DPIA", icon: FileText },
  { key: "ops", label: "Operations", icon: ShieldAlert },
];

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [range, setRange] = useState("7D");
  const [tab, setTab] = useState("overview");

  // caching per tab + range (as required)
  const cacheRef = useRef(new Map()); // key: `${range}:${tab}` => { data, errors, ts }
  const [loading, setLoading] = useState(true);
  const [bannerErr, setBannerErr] = useState("");

  const [data, setData] = useState(null);
  const [panelErrors, setPanelErrors] = useState({}); // per endpoint/panel error

  const { from, to } = useMemo(() => rangeToFrom(range), [range]);
  const fromISO = useMemo(() => toISODate(from), [from]);
  const toISO = useMemo(() => toISODate(to), [to]);

  // --- fetchers (ONLY api() wrapper)
  const fetchAll = async () => {
    setLoading(true);
    setBannerErr("");

    const cacheKey = `${range}:${tab}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setData(cached.data);
      setPanelErrors(cached.errors || {});
      setLoading(false);
      return;
    }

    // Partial failure strategy: each panel has its own try/catch
    const errors = {};

    const safe = async (key, fn) => {
      try {
        return await fn();
      } catch (e) {
        errors[key] = e?.message || `Failed to load ${key}`;
        return null;
      }
    };

    const qsRange = `?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`;
    const qsListRange = `?page=1&pageSize=50&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`;

    const [
      adminSummary,
      gapSummary,
      ropaSummary,
      incidentSummary,
      usersSummary,
      // lists used for computed pipeline + activity
      dpiaList,
      gapList,
      incidentsList,
      trainingsList,
    ] = await Promise.all([
      safe("adminSummary", () => api("/admin/dashboard/summary")),
      safe("gapSummary", () => api("/admin/gap/summary")),
      safe("ropaSummary", () => api(`/admin/ropa/summary${qsRange}`)),
      safe("incidentSummary", () => api("/admin/incidents/summary")),
      safe("usersSummary", () => api("/admin/users/summary")),
      safe("dpiaList", () => api(`/admin/dpia${qsListRange}`)),
      safe("gapList", () => api(`/admin/gap-assessments?page=1&pageSize=10`)),
      safe("incidentsList", () => api(`/admin/incidents?page=1&pageSize=10`)),
      safe("trainingsList", () => api(`/admin/training?page=1&pageSize=10`)),
    ]);

    const dpias = normalizeListResponse(dpiaList);
    const gaps = normalizeListResponse(gapList);
    const incs = normalizeListResponse(incidentsList);
    const trainings = normalizeListResponse(trainingsList);

    // computed pieces
    const readinessScore = computeReadinessScore({
      adminSummary,
      gapSummary,
      incidentSummary,
      dpias,
      trainings,
    });

    const trend =
      pick(adminSummary, ["trend", "charts.trend", "series.trend"]) ||
      buildTrend12({
        range,
        dpias,
        gapSummary,
        incidentSummary,
        readinessScore,
      });

    const workload =
      pick(adminSummary, ["workload", "charts.workload", "series.workload"]) ||
      null;

    const dpiaPipeline = computeDpiaPipeline(dpias);
    const dpiaProgressBuckets = computeProgressBuckets(dpias);

    const riskGrid = buildRiskGrid5x5({ incs, dpias }); // may be placeholder but must render

    const focusAlerts = buildFocusAlerts({
      gapSummary,
      dpias,
      incidentSummary,
      trainingsSummary: pick(adminSummary, ["training", "trainings"]) || null,
    });

    const activity = mergeActivity({
      gapSummary,
      adminSummary,
      dpias,
      incs,
      gaps,
      trainings,
    }).slice(0, 8);

    const out = {
      meta: { range, fromISO, toISO },
      raw: {
        adminSummary,
        gapSummary,
        ropaSummary,
        incidentSummary,
        usersSummary,
        dpias,
        gaps,
        incs,
        trainings,
      },
      computed: {
        readinessScore,
        trend:
          Array.isArray(trend) && trend.length ? trend : emptySeries12(range),
        workload,
        dpiaPipeline,
        dpiaProgressBuckets,
        riskGrid,
        focusAlerts,
        activity,
      },
    };

    // banner error only if everything failed
    if (
      !adminSummary &&
      !gapSummary &&
      !incidentSummary &&
      !usersSummary &&
      !dpiaList
    ) {
      setBannerErr("Dashboard failed to load. Please retry.");
    }

    setData(out);
    setPanelErrors(errors);

    cacheRef.current.set(cacheKey, { data: out, errors, ts: Date.now() });
    setLoading(false);
  };

  const onRefresh = () => {
    // refresh should refetch (invalidate only this tab+range)
    const cacheKey = `${range}:${tab}`;
    cacheRef.current.delete(cacheKey);
    fetchAll();
  };

  useEffect(() => {
    // do not refetch on every keystroke: only range change, tab change, refresh click
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, tab]);

  // keep scroll position stable on tab switch (must not break scroll position)
  // (React will not jump unless you remount the page; we keep same page component)
  const onTab = (key) => setTab(key);

  // --- breadcrumb label for the page itself (AdminLayout breadcrumb bar will show /admin → Dashboard)
  // This page should show breadcrumb “Dashboard” (done in BreadcrumbBar component).

  // --- derived KPIs for Overview
  const overviewKpis = useMemo(() => {
    const adminSum = data?.raw?.adminSummary;
    const gapSum = data?.raw?.gapSummary;
    const incSum = data?.raw?.incidentSummary;

    const readinessScore = safeNum(data?.computed?.readinessScore);

    const lawAdherence =
      safeNum(pick(adminSum, ["lawAdherence", "lawAdherencePct"])) ||
      safeNum(pick(adminSum, ["law", "lawPct"])) ||
      0;

    const lawEstimated = lawAdherence === 0;

    const regCompliance =
      safeNum(pick(adminSum, ["regCompliance", "regCompliancePct"])) ||
      safeNum(pick(adminSum, ["regulations", "regPct"])) ||
      0;

    const regEstimated = regCompliance === 0;

    const completedCount =
      safeNum(pick(gapSum, ["kpis.completedCount", "completedCount"])) ||
      safeNum(pick(gapSum, ["completedAssessments"])) ||
      0;

    const totalCount =
      safeNum(pick(gapSum, ["kpis.totalQuestions", "totalQuestions"])) ||
      safeNum(pick(gapSum, ["totalAssessments"])) ||
      Math.max(1, completedCount);

    const completed =
      safeNum(pick(gapSum, ["kpis.completed", "status.completed"])) ||
      completedCount;
    const inProgress =
      safeNum(pick(gapSum, ["kpis.inProgress", "status.inProgress"])) || 0;
    const notStarted = Math.max(0, totalCount - (completed + inProgress));

    const openIncidents = safeNum(pick(incSum, ["open", "openCount"])) || 0;

    return {
      readinessScore,
      lawAdherence: lawAdherence
        ? clamp(lawAdherence, 0, 100)
        : clamp(78, 0, 100),
      lawEstimated,
      regCompliance: regCompliance
        ? clamp(regCompliance, 0, 100)
        : clamp(72, 0, 100),
      regEstimated,
      assessment: {
        completedCount,
        totalCount,
        completed,
        inProgress,
        notStarted,
      },
      openIncidents,
      signalsText: "Based on GAP + DPIA + Incidents",
    };
  }, [data]);

  // --- GAP tab KPIs
  const gapTab = useMemo(() => {
    const gapSum = data?.raw?.gapSummary;
    const gaps = data?.raw?.gaps || [];

    const total =
      safeNum(pick(gapSum, ["kpis.total", "total", "count"])) ||
      gaps.length ||
      0;
    const draft = safeNum(pick(gapSum, ["kpis.draft", "status.draft"])) || 0;
    const inProgress =
      safeNum(pick(gapSum, ["kpis.inProgress", "status.inProgress"])) || 0;
    const completed =
      safeNum(pick(gapSum, ["kpis.completed", "status.completed"])) || 0;
    const critical = safeNum(pick(gapSum, ["kpis.critical", "critical"])) || 0;

    const donut =
      pick(gapSum, ["charts.statusDonut", "charts.status", "statusDonut"]) ||
      null;
    const categories =
      pick(gapSum, [
        "charts.categoryBars",
        "categoryBars",
        "charts.categories",
      ]) || null;

    return {
      total,
      draft,
      inProgress,
      completed,
      critical,
      donut,
      categories,
      gaps,
    };
  }, [data]);

  // --- DPIA tab KPIs
  const dpiaTab = useMemo(() => {
    const dpias = data?.raw?.dpias || [];
    const pipeline = data?.computed?.dpiaPipeline;

    const total = dpias.length;
    const draft = pipeline?.draft || 0;
    const inProgress = pipeline?.inProgress || 0;
    const submitted = pipeline?.submitted || 0;
    const approved = pipeline?.approved || 0;
    const rejected = pipeline?.rejected || 0;

    const buckets = data?.computed?.dpiaProgressBuckets || [
      { label: "0–25", value: 0 },
      { label: "26–50", value: 0 },
      { label: "51–75", value: 0 },
      { label: "76–100", value: 0 },
    ];

    // recent table: sort by updatedAt fallback createdAt
    const recent = [...dpias]
      .sort((a, b) => {
        const ta = new Date(
          pick(a, ["updatedAt", "createdAt", "updated_at", "created_at"]) || 0,
        ).getTime();
        const tb = new Date(
          pick(b, ["updatedAt", "createdAt", "updated_at", "created_at"]) || 0,
        ).getTime();
        return tb - ta;
      })
      .slice(0, 10);

    return {
      total,
      draft,
      inProgress,
      submitted,
      approved,
      rejected,
      buckets,
      recent,
    };
  }, [data]);

  // --- Ops tab snapshots
  const opsTab = useMemo(() => {
    const incSum = data?.raw?.incidentSummary;
    const trainings = data?.raw?.trainings || [];
    const adminSum = data?.raw?.adminSummary;

    // “backend not ready” handling: render neutral panel if missing
    const incidentsReady = !!incSum;
    const trainingReady = Array.isArray(trainings);
    const policiesReady = !!pick(adminSum, ["policies", "policiesSummary"]);

    return {
      incidentsReady,
      trainingReady,
      policiesReady,
      incSum,
      trainings,
      policies: pick(adminSum, ["policies", "policiesSummary"]) || null,
    };
  }, [data]);

  // --- render
  return (
    <div className="w-full">
      {/* Subheader bar (must implement exactly) */}
      <SubheaderBar>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-800">Dashboard</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  range === r.key
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
          >
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>

          <button
            disabled
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm"
            title="Export coming soon"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </SubheaderBar>

      <div className="mx-auto max-w-[1400px] px-4 py-6">
        {/* Title */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Compliance Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              A quick story of compliance posture across GAP, DPIA, RoPA,
              Incidents, Users/Training.
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Range: <span className="font-semibold text-slate-700">{range}</span>{" "}
            <span className="mx-1">•</span>
            {data?.meta?.fromISO ? (
              <span>
                {new Date(data.meta.fromISO).toLocaleDateString()} –{" "}
                {new Date(data.meta.toISO).toLocaleDateString()}
              </span>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>

        {/* Error banner with retry */}
        {bannerErr ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">{bannerErr}</span>
              </div>
              <button
                onClick={onRefresh}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {/* Tabs (4 tabs exactly) */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <TabButton
              key={t.key}
              active={tab === t.key}
              icon={t.icon}
              onClick={() => onTab(t.key)}
            >
              {t.label}
            </TabButton>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {tab === "overview" ? (
            <OverviewTab
              loading={loading}
              panelErrors={panelErrors}
              overviewKpis={overviewKpis}
              data={data}
              onRefresh={onRefresh}
              navigate={navigate}
            />
          ) : null}

          {tab === "gap" ? (
            <GapTab
              loading={loading}
              panelErrors={panelErrors}
              gapTab={gapTab}
              navigate={navigate}
            />
          ) : null}

          {tab === "dpia" ? (
            <DpiaTab
              loading={loading}
              panelErrors={panelErrors}
              dpiaTab={dpiaTab}
              onRefresh={onRefresh}
              navigate={navigate}
            />
          ) : null}

          {tab === "ops" ? (
            <OperationsTab
              loading={loading}
              panelErrors={panelErrors}
              opsTab={opsTab}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------ Tabs ------------------------ */

function OverviewTab({
  loading,
  panelErrors,
  overviewKpis,
  data,
  onRefresh,
  navigate,
}) {
  const computed = data?.computed;

  return (
    <div className="space-y-6">
      {/* KPI Row 1 — 4 large talkative tiles */}
      {loading ? (
        <SkeletonKpiRow />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PastelKpiTile
            tone="blue"
            title="Overall Score"
            big={`${overviewKpis.readinessScore}%`}
            subtitle="Compliance readiness"
            small={overviewKpis.signalsText}
            icon={ShieldAlert}
          />

          <PastelKpiTile
            tone="orange"
            title="PDPL Law"
            big={`${overviewKpis.lawAdherence}%`}
            subtitle="Law adherence"
            small={
              overviewKpis.lawEstimated
                ? "Estimated (backend not ready)"
                : "Measured"
            }
            icon={FileText}
            secondary={(() => {
              const x = pick(data?.raw?.adminSummary, [
                "sectionsCovered",
                "lawSectionsCovered",
              ]);
              const y = pick(data?.raw?.adminSummary, [
                "sectionsTotal",
                "lawSectionsTotal",
              ]);
              if (safeNum(x) && safeNum(y)) return `Sections covered ${x}/${y}`;
              return null;
            })()}
          />

          <PastelKpiTile
            tone="yellow"
            title="Regulations"
            big={`${overviewKpis.regCompliance}%`}
            subtitle="Reg. compliance"
            small={
              overviewKpis.regEstimated
                ? "Estimated (backend not ready)"
                : "Measured"
            }
            icon={ClipboardList}
            secondary={(() => {
              const x = pick(data?.raw?.adminSummary, [
                "controlsMapped",
                "mappedControls",
              ]);
              const y = pick(data?.raw?.adminSummary, [
                "controlsTotal",
                "totalControls",
              ]);
              if (safeNum(x) && safeNum(y)) return `Controls mapped ${x}/${y}`;
              return null;
            })()}
          />

          <PastelKpiTile
            tone="green"
            title="Assessment Progress"
            big={`${overviewKpis.assessment.completedCount}/${overviewKpis.assessment.totalCount}`}
            subtitle="Assessments coverage"
            small="Completed / Total"
            icon={ClipboardList}
            footer={
              <div className="mt-3">
                <ProgressBar
                  segments={[
                    {
                      label: "Completed",
                      value: overviewKpis.assessment.completed,
                      tone: "green",
                    },
                    {
                      label: "In Progress",
                      value: overviewKpis.assessment.inProgress,
                      tone: "amber",
                    },
                    {
                      label: "Not Started",
                      value: overviewKpis.assessment.notStarted,
                      tone: "gray",
                    },
                  ]}
                />
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5">
                    Completed: {overviewKpis.assessment.completed}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5">
                    In Progress: {overviewKpis.assessment.inProgress}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">
                    Not Started: {overviewKpis.assessment.notStarted}
                  </span>
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* Charts (exactly 5 charts in Overview) */}
      {loading ? (
        <SkeletonChartsGrid />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Chart 1: Compliance Trend (Area) */}
          <SectionCard className="xl:col-span-7">
            <ChartAreaTrend
              title="Compliance Trend"
              subtitle="Readiness score over time"
              series={computed?.trend}
              emptyText="No records in selected range"
            />
            {panelErrors.adminSummary ? (
              <div className="mt-2 text-xs text-rose-700">
                admin summary: {panelErrors.adminSummary}
              </div>
            ) : null}
          </SectionCard>

          {/* Chart 2: Workload by Module (Bar) */}
          <SectionCard className="xl:col-span-5">
            <ChartBarWorkload
              title="Workload by Module"
              subtitle="Open / in-progress items by module"
              workload={computed?.workload}
              fallback={{
                GAP:
                  safeNum(
                    pick(data?.raw?.gapSummary, [
                      "kpis.inProgress",
                      "status.inProgress",
                    ]),
                  ) || 0,
                DPIA: safeNum(computed?.dpiaPipeline?.inProgress) || 0,
                RoPA:
                  safeNum(
                    pick(data?.raw?.ropaSummary, ["pending", "pendingCount"]),
                  ) || 0,
                Incidents:
                  safeNum(
                    pick(data?.raw?.incidentSummary, ["open", "openCount"]),
                  ) || 0,
                Training: 0,
              }}
              emptyText="No data yet"
            />
          </SectionCard>

          {/* Chart 3: GAP Status Breakdown (Donut) */}
          <SectionCard className="xl:col-span-4">
            <ChartDonutGap
              title="GAP Status Breakdown"
              subtitle="From GAP summary"
              donut={pick(data?.raw?.gapSummary, [
                "charts.statusDonut",
                "statusDonut",
                "charts.status",
              ])}
              emptyText="No records in selected range"
            />
            {panelErrors.gapSummary ? (
              <div className="mt-2 text-xs text-rose-700">
                gap summary: {panelErrors.gapSummary}
              </div>
            ) : null}
          </SectionCard>

          {/* Chart 4: DPIA Status Pipeline (Stacked horizontal bar) */}
          <SectionCard className="xl:col-span-8">
            <ChartStackedDpia
              title="DPIA Status Pipeline"
              subtitle="Draft → Approved"
              pipeline={computed?.dpiaPipeline}
              emptyText="No records in selected range"
            />
            {panelErrors.dpiaList ? (
              <div className="mt-2 text-xs text-rose-700">
                dpia list: {panelErrors.dpiaList}
              </div>
            ) : null}
          </SectionCard>

          {/* Chart 5: Risk Heatmap (5x5 grid) */}
          <SectionCard className="xl:col-span-12">
            <RiskHeatmap5x5
              title="Risk Heatmap"
              subtitle="Likelihood vs Impact"
              grid={computed?.riskGrid}
              emptyText="Coming soon"
            />
          </SectionCard>
        </div>
      )}

      {/* Focus & Alerts panel */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <SectionCard className="xl:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Focus first
              </div>
              <div className="text-xs text-slate-600">
                What to act on in this range.
              </div>
            </div>
            <button
              onClick={onRefresh}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <SkeletonFocus />
          ) : (
            <div className="mt-3 space-y-2">
              {(data?.computed?.focusAlerts || []).map((a) => (
                <FocusCard
                  key={a.id}
                  severity={a.severity}
                  title={a.title}
                  recommendation={a.recommendation}
                  href={a.href}
                  onReview={() => navigate(a.href)}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Recent Activity */}
        <SectionCard className="xl:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Recent activity
              </div>
              <div className="text-xs text-slate-600">
                Last 8 events across modules.
              </div>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
              to="/admin"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <SkeletonTable rows={6} />
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {!data?.computed?.activity ||
              data.computed.activity.length === 0 ? (
                <EmptyState text="No records in selected range" />
              ) : (
                data.computed.activity.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => navigate(it.href)}
                    className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {it.action}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {it.module}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {it.actor ? `${it.actor} • ` : ""}
                        {timeAgo(it.ts)}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function GapTab({ loading, panelErrors, gapTab, navigate }) {
  return (
    <div className="space-y-6">
      {/* GAP KPIs + donut + category bars + recent GAP activities + CTA */}
      {loading ? (
        <SkeletonKpiRow />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <PastelKpiTile
            tone="blue"
            title="Total"
            big={`${gapTab.total}`}
            subtitle="All assessments"
            icon={ClipboardList}
          />
          <PastelKpiTile
            tone="gray"
            title="Draft"
            big={`${gapTab.draft}`}
            subtitle="Not started"
            icon={ClipboardList}
          />
          <PastelKpiTile
            tone="yellow"
            title="In Progress"
            big={`${gapTab.inProgress}`}
            subtitle="Working"
            icon={ClipboardList}
          />
          <PastelKpiTile
            tone="green"
            title="Completed"
            big={`${gapTab.completed}`}
            subtitle="Done"
            icon={ClipboardList}
          />
          <PastelKpiTile
            tone="red"
            title="Critical"
            big={`${gapTab.critical}`}
            subtitle="(<50% progress)"
            icon={AlertTriangle}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <SectionCard className="xl:col-span-5">
          <ChartDonutGap
            title="Status Breakdown"
            subtitle="From /admin/gap/summary"
            donut={gapTab.donut}
            emptyText="No records in selected range"
          />
          {panelErrors.gapSummary ? (
            <div className="mt-2 text-xs text-rose-700">
              gap summary: {panelErrors.gapSummary}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard className="xl:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Categories</div>
              <div className="text-xs text-slate-600">
                From /admin/gap/summary
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/admin/gap")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                New Assessment
              </button>
              <button
                onClick={() => navigate("/admin/gap")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Play className="h-4 w-4" />
                Open Assessment
              </button>
            </div>
          </div>

          <div className="mt-3">
            {Array.isArray(gapTab.categories) && gapTab.categories.length ? (
              <div className="space-y-2">
                {gapTab.categories.slice(0, 10).map((c, idx) => {
                  const name = c.name || c.label || `Category ${idx + 1}`;
                  const val = safeNum(c.value ?? c.count ?? c.total);
                  return (
                    <div
                      key={name}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">
                          {name}
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {val}
                        </div>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${Math.min(100, val * 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState text="No category data yet" />
            )}
          </div>
        </SectionCard>
      </div>

      {/* Table: last 10 assessments */}
      <SectionCard>
        <div className="text-sm font-bold text-slate-900">
          Recent GAP assessments
        </div>
        <div className="text-xs text-slate-600">Last 10</div>

        {loading ? (
          <SkeletonTable rows={10} />
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {gapTab.gaps?.length ? (
              gapTab.gaps.slice(0, 10).map((g) => {
                const id = g.id || g._id;
                const title = g.title || g.name || `Assessment ${id || ""}`;
                const status = (g.status || g.state || "UNKNOWN")
                  .toString()
                  .toUpperCase();
                const updated = pick(g, [
                  "updatedAt",
                  "updated_at",
                  "createdAt",
                  "created_at",
                ]);
                return (
                  <button
                    key={id || title}
                    onClick={() => navigate("/admin/gap")}
                    className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        Updated {updated ? timeAgo(updated) : "—"}
                      </div>
                    </div>
                    <StatusPill status={status} />
                  </button>
                );
              })
            ) : (
              <EmptyState text="No assessments found" />
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function DpiaTab({ loading, panelErrors, dpiaTab, onRefresh, navigate }) {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      {loading ? (
        <SkeletonKpiRow />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <PastelKpiTile
            tone="blue"
            title="Total"
            big={`${dpiaTab.total}`}
            subtitle="All DPIAs"
            icon={FileText}
          />
          <PastelKpiTile
            tone="gray"
            title="Draft"
            big={`${dpiaTab.draft}`}
            subtitle="Draft"
            icon={FileText}
          />
          <PastelKpiTile
            tone="yellow"
            title="In Progress"
            big={`${dpiaTab.inProgress}`}
            subtitle="Working"
            icon={FileText}
          />
          <PastelKpiTile
            tone="orange"
            title="Submitted"
            big={`${dpiaTab.submitted}`}
            subtitle="Awaiting review"
            icon={FileText}
          />
          <PastelKpiTile
            tone="green"
            title="Approved"
            big={`${dpiaTab.approved}`}
            subtitle="Accepted"
            icon={FileText}
          />
          <PastelKpiTile
            tone="red"
            title="Rejected"
            big={`${dpiaTab.rejected}`}
            subtitle="Needs changes"
            icon={FileText}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* progress distribution histogram */}
        <SectionCard className="xl:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Progress distribution
              </div>
              <div className="text-xs text-slate-600">
                0–25, 26–50, 51–75, 76–100
              </div>
            </div>
            <button
              onClick={onRefresh}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-3">
            {Array.isArray(dpiaTab.buckets) ? (
              <div className="space-y-2">
                {dpiaTab.buckets.map((b) => (
                  <div
                    key={b.label}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">
                        {b.label}
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {b.value}
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${Math.min(100, safeNum(b.value) * 10)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No records in selected range" />
            )}
          </div>
        </SectionCard>

        {/* CTA + recent table */}
        <SectionCard className="xl:col-span-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Recent DPIAs
              </div>
              <div className="text-xs text-slate-600">Last 10</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/admin/dpia")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Create DPIA
              </button>
              <button
                onClick={() => {
                  const latest = dpiaTab.recent?.[0];
                  const id = latest?.id || latest?._id;
                  navigate(id ? `/admin/dpia/${id}` : "/admin/dpia");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Play className="h-4 w-4" />
                Continue latest
              </button>
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={8} />
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {!dpiaTab.recent?.length ? (
                <EmptyState text="No records in selected range" />
              ) : (
                dpiaTab.recent.map((d) => {
                  const id = d.id || d._id;
                  const title = d.title || d.name || `DPIA ${id || ""}`;
                  const status = (d.status || d.state || "UNKNOWN")
                    .toString()
                    .toUpperCase();
                  const progress =
                    safeNum(pick(d, ["progress", "completion", "percent"])) ||
                    0;
                  const updated = pick(d, [
                    "updatedAt",
                    "updated_at",
                    "createdAt",
                    "created_at",
                  ]);

                  return (
                    <div
                      key={id || title}
                      className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3"
                    >
                      <button
                        onClick={() =>
                          navigate(id ? `/admin/dpia/${id}` : "/admin/dpia")
                        }
                        className="min-w-0 flex-1 text-left hover:opacity-90"
                      >
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <StatusPill status={status} />
                          <div className="text-xs text-slate-600">
                            Updated {updated ? timeAgo(updated) : "—"}
                          </div>
                        </div>

                        <div className="mt-2">
                          <ProgressBar
                            segments={[
                              {
                                label: "Progress",
                                value: clamp(progress, 0, 100),
                                tone: "indigo",
                              },
                              {
                                label: "Remaining",
                                value: 100 - clamp(progress, 0, 100),
                                tone: "gray",
                              },
                            ]}
                            showLegend={false}
                          />
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(id ? `/admin/dpia/${id}` : "/admin/dpia")
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          Open
                        </button>
                        {/* Delete wired only if backend exists: /admin/dpia/:id DELETE exists per your endpoints */}
                        <button
                          onClick={async () => {
                            if (!id) return;
                            try {
                              await api(`/admin/dpia/${id}`, {
                                method: "DELETE",
                              });
                              onRefresh();
                            } catch (e) {
                              // per-spec: must not crash
                              alert(e?.message || "Delete failed");
                            }
                          }}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {panelErrors.dpiaList ? (
            <div className="mt-2 text-xs text-rose-700">
              dpia list: {panelErrors.dpiaList}
            </div>
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}

function OperationsTab({ loading, panelErrors, opsTab }) {
  const Panel = ({ title, subtitle, ready, icon: Icon }) => (
    <SectionCard>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="text-xs text-slate-600">{subtitle}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        {loading ? (
          <SkeletonTable rows={4} />
        ) : ready ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800">
            Connected ✓
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">
              Not connected yet
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Backend not ready. This panel will populate automatically once
              connected.
            </div>
            <button
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500"
            >
              Coming soon
            </button>
          </div>
        )}
      </div>
    </SectionCard>
  );

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Panel
        title="Incidents & Breach snapshot"
        subtitle="Open incidents and severity overview"
        ready={opsTab.incidentsReady}
        icon={AlertTriangle}
      />
      <Panel
        title="Training snapshot"
        subtitle="Coverage and completion overview"
        ready={opsTab.trainingReady && opsTab.trainings?.length > 0}
        icon={GraduationCap}
      />
      <Panel
        title="Policies snapshot"
        subtitle="Policy status and review cadence"
        ready={opsTab.policiesReady}
        icon={FileText}
      />
    </div>
  );
}
