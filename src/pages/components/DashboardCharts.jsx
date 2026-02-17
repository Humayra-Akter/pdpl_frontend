import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

import { cx, safeNum } from "./dashboard";
import { EmptyState } from "./DashboardUI";

/* -------- Chart 1: Compliance Trend (Area) -------- */
export function ChartAreaTrend({ title, subtitle, series, emptyText }) {
  const data = Array.isArray(series) ? series : [];
  const has = data.some((d) => safeNum(d.value) > 0);

  return (
    <div>
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="text-xs text-slate-600">{subtitle}</div>

      <div className="mt-3" style={{ minHeight: 240 }}>
        {!has ? (
          <EmptyState text={emptyText} />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={data}
              margin={{ left: 6, right: 12, top: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(15,23,42,0.10)"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(51,65,85,0.9)", fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "rgba(51,65,85,0.9)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid rgba(226,232,240,1)",
                  borderRadius: 14,
                  color: "#0f172a",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#4f46e5"
                fill="rgba(79,70,229,0.18)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* -------- Chart 2: Workload by Module (Bar) -------- */
export function ChartBarWorkload({
  title,
  subtitle,
  workload,
  fallback,
  emptyText,
}) {
  const data = useMemo(() => {
    // prefer backend
    if (Array.isArray(workload) && workload.length) return workload;

    // fallback computed from available
    const fb = fallback || {};
    const arr = [
      { name: "GAP", value: safeNum(fb.GAP) },
      { name: "DPIA", value: safeNum(fb.DPIA) },
      { name: "RoPA", value: safeNum(fb.RoPA) },
      { name: "Incidents", value: safeNum(fb.Incidents) },
      { name: "Training", value: safeNum(fb.Training) },
    ];
    return arr;
  }, [workload, fallback]);

  const has = data.some((d) => safeNum(d.value) > 0);

  return (
    <div>
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="text-xs text-slate-600">{subtitle}</div>

      <div className="mt-3" style={{ minHeight: 240 }}>
        {!has ? (
          <EmptyState text={emptyText} />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data}
              margin={{ left: 6, right: 12, top: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(15,23,42,0.10)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(51,65,85,0.9)", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "rgba(51,65,85,0.9)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid rgba(226,232,240,1)",
                  borderRadius: 14,
                  color: "#0f172a",
                }}
              />
              <Bar
                dataKey="value"
                fill="rgba(79,70,229,0.55)"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* -------- Chart 3: GAP Status Donut (from summary) -------- */
export function ChartDonutGap({ title, subtitle, donut, emptyText }) {
  // keep it light: render donut-like using pure CSS segments if backend shape unknown
  const items = normalizeDonut(donut);
  const total = items.reduce((a, x) => a + x.value, 0);
  const has = total > 0;

  return (
    <div>
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="text-xs text-slate-600">{subtitle}</div>

      <div className="mt-4 flex items-center gap-4">
        {!has ? (
          <div className="w-full">
            <EmptyState text={emptyText} />
          </div>
        ) : (
          <>
            <DonutRing items={items} />
            <div className="flex-1 space-y-2">
              {items.map((x) => (
                <div
                  key={x.name}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: x.color }}
                    />
                    {x.name}
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {x.value}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DonutRing({ items }) {
  const total = items.reduce((a, x) => a + x.value, 0) || 1;
  let acc = 0;

  // conic-gradient donut
  const stops = items.map((x) => {
    const start = (acc / total) * 100;
    acc += x.value;
    const end = (acc / total) * 100;
    return `${x.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  });

  return (
    <div className="relative h-28 w-28">
      <div
        className="h-28 w-28 rounded-full"
        style={{ background: `conic-gradient(${stops.join(",")})` }}
      />
      <div className="absolute inset-3 rounded-full bg-white shadow-inner" />
    </div>
  );
}

function normalizeDonut(donut) {
  // Expected: [{name,value}] but accept multiple shapes
  const raw =
    (Array.isArray(donut) && donut) ||
    (Array.isArray(donut?.items) && donut.items) ||
    (Array.isArray(donut?.data) && donut.data) ||
    [];

  const colors = ["#10b981", "#f59e0b", "#64748b", "#4f46e5", "#ef4444"];
  return raw
    .map((x, i) => ({
      name: x.name || x.label || String(x.status || `Item ${i + 1}`),
      value: Number(x.value ?? x.count ?? x.total) || 0,
      color: colors[i % colors.length],
    }))
    .filter((x) => x.value >= 0);
}

/* -------- Chart 4: DPIA Pipeline (stacked horizontal) -------- */
export function ChartStackedDpia({ title, subtitle, pipeline, emptyText }) {
  const p = pipeline || {};
  const segs = [
    { label: "Draft", value: safeNum(p.draft), color: "#64748b" },
    { label: "In Progress", value: safeNum(p.inProgress), color: "#f59e0b" },
    { label: "Submitted", value: safeNum(p.submitted), color: "#4f46e5" },
    { label: "Approved", value: safeNum(p.approved), color: "#10b981" },
    { label: "Rejected", value: safeNum(p.rejected), color: "#ef4444" },
  ];

  const total = segs.reduce((a, s) => a + s.value, 0);
  const has = total > 0;

  return (
    <div>
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="text-xs text-slate-600">{subtitle}</div>

      <div className="mt-4" style={{ minHeight: 180 }}>
        {!has ? (
          <EmptyState text={emptyText} />
        ) : (
          <>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {segs.map((s) => (
                <div
                  key={s.label}
                  className="h-full"
                  style={{
                    width: `${(s.value / total) * 100}%`,
                    background: s.color,
                  }}
                  title={`${s.label}: ${s.value}`}
                />
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
              {segs.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-600">
                      {s.label}
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {s.value}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(s.value / total) * 100}%`,
                        background: s.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* -------- Chart 5: Risk Heatmap (5x5 UI) -------- */

export function RiskHeatmap5x5({ title, subtitle, grid, emptyText }) {
  const g = grid || { cells: [], hasData: false };

  return (
    <div>
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="text-xs text-slate-600">{subtitle}</div>

      <div className="mt-4">
        <RiskMatrixPastel grid={g} emptyText={emptyText} />
      </div>
    </div>
  );
}

function RiskMatrixPastel({ grid, emptyText }) {
  const hasData = !!grid?.hasData;

  // matrix (Likelihood 5..1, Impact 1..5)
  const matrix = useMemo(() => {
    const cells = Array.isArray(grid?.cells) ? grid.cells : [];
    const get = (lik, imp) =>
      Number(
        cells.find(
          (c) => Number(c.likelihood) === lik && Number(c.impact) === imp,
        )?.value || 0,
      );

    const rows = [];
    for (let lik = 5; lik >= 1; lik--) {
      const row = [];
      for (let imp = 1; imp <= 5; imp++)
        row.push({ lik, imp, value: get(lik, imp) });
      rows.push(row);
    }
    return rows;
  }, [grid]);

  const maxV = useMemo(() => {
    const m = matrix.flat().reduce((acc, c) => Math.max(acc, c.value), 0);
    return m > 0 ? m : 1;
  }, [matrix]);

  const [hover, setHover] = useState(null);

  // If backend not ready, still render a beautiful “coming soon” matrix
  const displayValue = (c) => (hasData ? c.value : 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_-32px_rgba(15,23,42,.22)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-600">
            Likelihood × Impact
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {hasData
              ? "Darker cells indicate higher concentration."
              : emptyText || "Coming soon"}
          </div>
        </div>

        <Legend />
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[520px]">
          {/* Impact labels */}
          <div className="grid grid-cols-6 gap-2">
            <div className="text-[11px] font-semibold text-slate-500" />
            {[1, 2, 3, 4, 5].map((imp) => (
              <div
                key={imp}
                className="text-center text-[11px] font-semibold text-slate-500"
              >
                Impact {imp}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="mt-2 grid grid-cols-6 gap-2">
            {matrix.map((row) => (
              <React.Fragment key={`lik-${row[0].lik}`}>
                <div className="flex items-center text-[11px] font-semibold text-slate-500">
                  Lik {row[0].lik}
                </div>

                {row.map((c) => {
                  const v = displayValue(c);
                  const intensity = hasData ? clamp01(v / maxV) : 0;
                  const baseScore = c.lik * c.imp; // 1..25

                  // Premium pastel ramp (matches KPI panels)
                  const tone = riskTone(baseScore);

                  // Fill strength: very soft for low, stronger for high; still pastel
                  const fill = hasData
                    ? `rgba(${tone.rgb}, ${0.12 + intensity * 0.45})`
                    : `rgba(${tone.rgb}, ${0.1})`;

                  const border = hoverMatch(hover, c)
                    ? "border-slate-900/20 ring-2 ring-slate-900/10"
                    : "border-slate-200";

                  return (
                    <div
                      key={`${c.lik}-${c.imp}`}
                      onMouseEnter={() => setHover({ ...c, score: baseScore })}
                      onMouseLeave={() => setHover(null)}
                      className={[
                        "relative h-14 rounded-xl border bg-white transition",
                        "shadow-[0_10px_28px_-22px_rgba(15,23,42,.25)]",
                        "hover:-translate-y-[1px]",
                        border,
                      ].join(" ")}
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${fill}, rgba(255,255,255,0.92))`,
                      }}
                    >
                      {/* tiny score chip (top-left) */}
                      <div className="absolute left-2 top-2 rounded-lg bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 backdrop-blur">
                        {baseScore}
                      </div>

                      {/* count chip (bottom-right) */}
                      {hasData && v > 0 ? (
                        <div className="absolute bottom-2 right-2 rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                          {v}
                        </div>
                      ) : null}

                      {/* Tooltip */}
                      {hoverMatch(hover, c) ? (
                        <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
                          <div className="font-bold text-slate-900">
                            Lik {c.lik} × Impact {c.imp} (score {baseScore})
                          </div>
                          <div className="text-slate-600">
                            {hasData ? (
                              <>
                                Records:{" "}
                                <span className="font-semibold text-slate-900">
                                  {v}
                                </span>
                              </>
                            ) : (
                              "Risk data not connected yet"
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Nice empty state note */}
      {!hasData ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
          Heatmap is rendered, but data mapping isn’t available yet. Once
          incidents/DPIA expose impact + likelihood, cells will populate
          automatically.
        </div>
      ) : null}
    </div>
  );
}

function hoverMatch(hover, c) {
  return hover && hover.lik === c.lik && hover.imp === c.imp;
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

/**
 * Pastel tones that match compliance dashboards:
 * - low score: mint
 * - medium: amber
 * - high: rose
 * - critical: deep rose
 */
function riskTone(score) {
  if (score >= 20) return { name: "Critical", rgb: "244,63,94" }; // rose-500
  if (score >= 15) return { name: "High", rgb: "251,113,133" }; // rose-400
  if (score >= 9) return { name: "Medium", rgb: "245,158,11" }; // amber-500
  return { name: "Low", rgb: "16,185,129" }; // emerald-500
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600">
      <LegendChip label="Low" rgb="16,185,129" />
      <LegendChip label="Medium" rgb="245,158,11" />
      <LegendChip label="High" rgb="251,113,133" />
      <LegendChip label="Critical" rgb="244,63,94" />
    </div>
  );
}

function LegendChip({ label, rgb }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: `rgba(${rgb},0.55)` }}
      />
      {label}
    </span>
  );
}
