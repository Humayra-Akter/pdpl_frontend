import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  FileDown,
  Plus,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAdminSummary } from "../lib/admin";

const fallbackDonut = [
  { name: "Completed", value: 64.7, tone: "accent" },
  { name: "In progress", value: 14.1, tone: "primary" },
  { name: "Not started", value: 11.6, tone: "neutral" },
  { name: "Overdue", value: 9.6, tone: "secondary" },
];

const fallbackTrend = [
  { m: "Jan", score: 58 },
  { m: "Feb", score: 66 },
  { m: "Mar", score: 72 },
  { m: "Apr", score: 75 },
  { m: "May", score: 81 },
  { m: "Jun", score: 85 },
  { m: "Jul", score: 91 },
];

const fallbackBars = [
  { label: "0–7d", count: 5 },
  { label: "8–14d", count: 9 },
  { label: "15–30d", count: 6 },
  { label: "30+d", count: 3 },
];

const heatRows = [
  { name: "Governance", vals: [72, 75, 78, 80, 82, 84] },
  { name: "Rights & Requests", vals: [61, 63, 67, 69, 72, 74] },
  { name: "RoPA", vals: [58, 60, 64, 66, 69, 71] },
  { name: "Security", vals: [70, 74, 79, 83, 86, 88] },
  { name: "Training", vals: [55, 58, 62, 66, 70, 73] },
  { name: "Vendors", vals: [49, 52, 56, 60, 63, 65] },
];

function toneVars(tone) {
  const map = {
    primary: { bg: "var(--pdpl-primary-bg)", fg: "var(--pdpl-primary)" },
    secondary: { bg: "var(--pdpl-secondary-bg)", fg: "var(--pdpl-secondary)" },
    neutral: { bg: "var(--pdpl-neutral-bg)", fg: "var(--pdpl-neutral)" },
    accent: { bg: "var(--pdpl-accent-bg)", fg: "var(--pdpl-accent)" },
  };
  return map[tone] || map.primary;
}

function heatColor(v) {
  if (v >= 85) return { bg: "var(--pdpl-accent)", fg: "#fff" };
  if (v >= 70) return { bg: "rgba(22,101,52,0.22)", fg: "#0f172a" };
  if (v >= 60) return { bg: "rgba(149,107,0,0.22)", fg: "#0f172a" };
  if (v >= 50) return { bg: "rgba(154,52,18,0.22)", fg: "#0f172a" };
  return { bg: "rgba(154,52,18,0.45)", fg: "#fff" };
}

function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-sm shadow-md ring-1 ring-slate-200">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">
        {payload[0].name}: {payload[0].value}
      </div>
    </div>
  );
}

export default function Admin() {
  const indigo = "var(--pdpl-primary)";

  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getAdminSummary()
      .then((data) => {
        setSummary(data);
        setErr("");
      })
      .catch((e) => setErr(e.message || "Failed to load"));
  }, []);

  if (!summary && !err) {
    return <div className="text-slate-600">Loading dashboard...</div>;
  }

  if (err) {
    return (
      <div className="rounded-2xl bg-white p-5 ring-1 ring-red-200">
        <div className="font-semibold text-red-700">Dashboard failed</div>
        <div className="mt-1 text-sm text-slate-600">{err}</div>
      </div>
    );
  }

  const k = summary?.kpis;

  const donutData = summary?.charts?.donut ?? fallbackDonut;
  const trendData = summary?.charts?.trend ?? fallbackTrend;
  const dueBarsData = summary?.charts?.dueBars ?? fallbackBars;

  const dynamicKpis = [
    {
      title: "Total Users",
      value: k?.totalUsers ?? "—",
      hint: "All accounts in system",
      icon: ShieldCheck,
      tone: "accent",
    },
    {
      title: "Active Users",
      value: k?.activeUsers ?? "—",
      hint: "Can login",
      icon: CheckCircle2,
      tone: "primary",
    },
    {
      title: "Inactive Users",
      value: k?.inactiveUsers ?? "—",
      hint: "Blocked / disabled",
      icon: AlertTriangle,
      tone: "secondary",
    },
    {
      title: "DPO Accounts",
      value: k?.dpoCount ?? "—",
      hint: "Data Protection Officers",
      icon: ClipboardList,
      tone: "neutral",
    },
  ];

  const queueItems = [
    { label: "Total Users", val: k?.totalUsers ?? "—", tone: "primary" },
    { label: "Active Users", val: k?.activeUsers ?? "—", tone: "accent" },
    {
      label: "Inactive Users",
      val: k?.inactiveUsers ?? "—",
      tone: "secondary",
    },
    { label: "DPO Accounts", val: k?.dpoCount ?? "—", tone: "neutral" },
  ];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">Admin landing</div>
          <div className="text-2xl font-semibold" style={{ color: indigo }}>
            Compliance Overview
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Centralize Gap Assessment, DPIA, RoPA, policies and incidents.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <FileDown className="h-4 w-4" /> Export
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            style={{ background: indigo }}
          >
            <Plus className="h-4 w-4" /> Generate Report
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dynamicKpis.map((kpi) => {
          const Icon = kpi.icon;
          const t = toneVars(kpi.tone);

          return (
            <Card key={kpi.title} className="relative overflow-hidden">
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: t.fg }}
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-500">{kpi.title}</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-900">
                    {kpi.value}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{kpi.hint}</div>
                </div>

                <div
                  className="rounded-2xl p-3 ring-1"
                  style={{
                    background: t.bg,
                    color: t.fg,
                    borderColor: "rgba(15,23,42,0.08)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full"
                  style={{ width: "70%", background: t.fg }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Heatmap + Donut */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Compliance Heatmap</div>
              <div className="text-base font-semibold text-slate-900">
                Modules over time
              </div>
            </div>
            <div className="text-xs text-slate-500">Last 6 weeks</div>
          </div>

          <div className="mt-4 overflow-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[200px_repeat(6,1fr)] gap-2 text-xs text-slate-500">
                <div></div>
                {["W1", "W2", "W3", "W4", "W5", "W6"].map((w) => (
                  <div key={w} className="text-center">
                    {w}
                  </div>
                ))}
              </div>

              <div className="mt-2 space-y-2">
                {heatRows.map((r) => (
                  <div
                    key={r.name}
                    className="grid grid-cols-[200px_repeat(6,1fr)] gap-2"
                  >
                    <div className="flex items-center text-sm font-medium text-slate-700">
                      {r.name}
                    </div>
                    {r.vals.map((v, idx) => {
                      const c = heatColor(v);
                      return (
                        <div
                          key={idx}
                          className="grid h-10 place-items-center rounded-xl text-sm font-semibold transition-transform hover:scale-[1.02]"
                          style={{ background: c.bg, color: c.fg }}
                          title={`${r.name} • ${v}%`}
                        >
                          {v}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Compliance Status</div>
          <div className="text-base font-semibold text-slate-900">
            Portfolio distribution
          </div>

          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {donutData.map((d, i) => (
                    <Cell key={i} fill={toneVars(d.tone).fg} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 space-y-2">
            {donutData.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: toneVars(d.tone).fg }}
                  />
                  <span className="text-slate-700">{d.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Trend + Bars + Queue */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">
                Overall Compliance Trend
              </div>
              <div className="text-base font-semibold text-slate-900">
                Score movement
              </div>
            </div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1"
              style={{
                background: "var(--pdpl-accent-bg)",
                color: "var(--pdpl-accent)",
                borderColor: "rgba(15,23,42,0.08)",
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Improving
            </div>
          </div>

          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="m" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={indigo}
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Work Queue</div>
          <div className="text-base font-semibold text-slate-900">
            Due distribution
          </div>

          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dueBarsData}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={indigo} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {queueItems.map((x) => {
              const t = toneVars(x.tone);
              return (
                <div
                  key={x.label}
                  className="flex items-center justify-between rounded-xl px-3 py-2 border-2 border-slate-200 transition-all hover:-translate-y-0.5"
                  style={{
                    background: t.bg,
                    color: "#0f172a",
                    borderColor: "rgba(15,23,42,0.08)",
                  }}
                >
                  <div className="text-sm font-medium">{x.label}</div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: t.fg }}
                  >
                    {x.val}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
