import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listUsers, usersSummary } from "../lib/admin";
import {
  ArrowLeft,
  Download,
  FileDown,
  Printer,
  RefreshCcw,
  X,
  Search,
  Filter,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  Brush,
  ReferenceLine,
} from "recharts";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function safeNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

const cardBase = "rounded-xl border border-slate-200 bg-white shadow-sm";
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium";

function formatDateLong(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString(undefined, { month: "long" });
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function exportCsv(filename, rows) {
  const esc = (v) => {
    const s = v === undefined || v === null ? "" : String(v);
    const needs = /[",\n]/.test(s);
    return needs ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const headers = ["fullName", "email", "role", "status", "createdAt"];
  const csv = [
    headers.join(","),
    ...(rows || []).map((r) =>
      [
        esc(r.fullName),
        esc(r.email),
        esc(r.role),
        esc(r.status),
        esc(formatDateLong(r.createdAt)),
      ].join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportNodeAsPng(node, filename) {
  if (!node) return;

  let html2canvas = null;
  try {
    const mod = await import("html2canvas");
    html2canvas = mod?.default || mod;
  } catch {
    html2canvas = null;
  }

  if (!html2canvas) {
    window.print();
    return;
  }

  const canvas = await html2canvas(node, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

async function fetchAllUsers({ cap = 2500, pageSize = 250 } = {}) {
  let page = 1;
  let all = [];
  let total = null;

  while (all.length < cap) {
    const res = await listUsers({
      page,
      pageSize,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const items = res?.items || [];
    total = safeNumber(res?.total, total ?? items.length);

    all = all.concat(items);

    if (!items.length) break;
    if (all.length >= total) break;
    page += 1;
  }

  return { items: all.slice(0, cap), total: total ?? all.length };
}

const PALETTE = [
  "#6366F1", // indigo
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // rose
  "#0EA5E9", // sky
  "#A855F7", // purple-ish
];

function ChartCard({ title, subtitle, children, right, footer }) {
  return (
    <div className={cardBase}>
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-xs font-medium text-slate-600">
                {subtitle}
              </div>
            ) : null}
          </div>
          {right ? (
            <div className="text-xs font-medium text-slate-600">{right}</div>
          ) : null}
        </div>
      </div>
      <div className="p-4">{children}</div>
      {footer ? (
        <div className="border-t border-slate-200 px-4 py-3 text-xs font-medium text-slate-600">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

function Pill({ active, children, onClick, tone = "indigo" }) {
  const tones = {
    indigo: active
      ? "bg-indigo-600 text-white"
      : "bg-white text-slate-700 hover:bg-slate-50",
    emerald: active
      ? "bg-emerald-600 text-white"
      : "bg-white text-slate-700 hover:bg-slate-50",
    rose: active
      ? "bg-rose-600 text-white"
      : "bg-white text-slate-700 hover:bg-slate-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium transition",
        tones[tone] || tones.indigo,
      )}
    >
      {children}
    </button>
  );
}

function DeltaBadge({ delta, pct }) {
  const isPos = (delta ?? 0) > 0;
  const isNeg = (delta ?? 0) < 0;
  const cls = isPos
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : isNeg
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-slate-200 bg-slate-50 text-slate-700";

  const sign = isPos ? "+" : "";
  const pctText = pct === null || pct === undefined ? "" : ` (${sign}${pct}%)`;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xl border px-2 py-1 text-xs font-semibold",
        cls,
      )}
    >
      {sign}
      {delta ?? 0}
      {pctText}
    </span>
  );
}

/** Custom Hexagon shape for Scatter “honeycomb-ish” view */
function HexDot(props) {
  const { cx, cy, fill, size = 10 } = props;
  if (!cx || !cy) return null;

  const r = size;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const d = `M ${pts.map((p) => p.join(" ")).join(" L ")} Z`;
  return <path d={d} fill={fill || "#6366F1"} fillOpacity={0.85} />;
}

/** Heatmap cell shape (rect) for ScatterChart */
function HeatCell(props) {
  const { cx, cy, fill, size = 18 } = props;
  if (!cx || !cy) return null;
  const s = size;
  return (
    <rect
      x={cx - s / 2}
      y={cy - s / 2}
      width={s}
      height={s}
      rx={6}
      ry={6}
      fill={fill || "#0EA5E9"}
      fillOpacity={0.75}
    />
  );
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export default function UserAnalytics() {
  const navigate = useNavigate();
  const exportRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [summary, setSummary] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  // analytics sections
  const [section, setSection] = useState("OVERVIEW");

  // global filters
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL | ADMIN | DPO | USER
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE
  const [monthsBack, setMonthsBack] = useState(12); // 3/6/12/24
  const [normalize, setNormalize] = useState(false); // show % for some charts

  // drilldown selection
  const [selected, setSelected] = useState({
    monthKey: null,
    role: null,
    status: null,
    domain: null,
  });
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const [sum, all] = await Promise.all([
          usersSummary(),
          fetchAllUsers({ cap: 2500, pageSize: 250 }),
        ]);
        if (!alive) return;

        setSummary(sum?.kpis || null);
        setAllUsers(all?.items || []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.error || e?.message || "Failed to load analytics");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const exportBase = `users_analytics_${Date.now()}`;

  const resetFilters = () => {
    setQ("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setMonthsBack(12);
    setNormalize(false);
    setSelected({ monthKey: null, role: null, status: null, domain: null });
    setTablePage(1);
  };

  // --- filtered users (the core) ---
  const filteredUsers = useMemo(() => {
    const now = new Date();
    const from = startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1),
    );

    const qq = q.trim().toLowerCase();

    return allUsers.filter((u) => {
      const dt = new Date(u.createdAt);
      const inRange = Number.isFinite(dt.getTime()) ? dt >= from : true;

      const roleOk = roleFilter === "ALL" ? true : u.role === roleFilter;
      const statusOk =
        statusFilter === "ALL" ? true : u.status === statusFilter;

      const qOk = !qq
        ? true
        : `${u.fullName || ""} ${u.email || ""}`.toLowerCase().includes(qq);

      return inRange && roleOk && statusOk && qOk;
    });
  }, [allUsers, monthsBack, roleFilter, statusFilter, q]);

  // selection-filtered (drilldown) users
  const selectedUsers = useMemo(() => {
    const { monthKey: mk, role, status, domain } = selected || {};
    if (!mk && !role && !status && !domain) return filteredUsers;

    return filteredUsers.filter((u) => {
      const okRole = role ? u.role === role : true;
      const okStatus = status ? u.status === status : true;

      const okMonth = mk
        ? (() => {
            const dt = new Date(u.createdAt);
            if (!Number.isFinite(dt.getTime())) return false;
            return monthKey(dt) === mk;
          })()
        : true;

      const okDomain = domain
        ? (() => {
            const em = (u.email || "").toLowerCase();
            const dom = em.includes("@") ? em.split("@")[1] : "unknown";
            return dom === domain;
          })()
        : true;

      return okRole && okStatus && okMonth && okDomain;
    });
  }, [filteredUsers, selected]);

  // keep table page valid
  useEffect(() => {
    setTablePage(1);
  }, [
    selected.monthKey,
    selected.role,
    selected.status,
    selected.domain,
    q,
    roleFilter,
    statusFilter,
    monthsBack,
  ]);

  // ---- KPI totals (based on filteredUsers for “live” interactivity) ----
  const totals = useMemo(() => {
    const k = summary || {};
    const total = filteredUsers.length;
    const active = filteredUsers.filter((u) => u.status === "ACTIVE").length;
    const inactive = filteredUsers.filter(
      (u) => u.status === "INACTIVE",
    ).length;
    const admins = filteredUsers.filter((u) => u.role === "ADMIN").length;
    const dpo = filteredUsers.filter((u) => u.role === "DPO").length;

    // summary stays as reference; filtered users drive interactive values
    return {
      total: safeNumber(k.totalUsers, total),
      active: safeNumber(k.activeUsers, active),
      inactive: safeNumber(k.inactiveUsers, inactive),
      admins: safeNumber(k.adminsCount, admins),
      dpo: safeNumber(k.dpoCount, dpo),
      _liveTotal: total,
      _liveActive: active,
      _liveInactive: inactive,
      _liveAdmins: admins,
      _liveDpo: dpo,
    };
  }, [summary, filteredUsers]);

  // ---- period compare (last 30 vs previous 30) on ALL USERS (not filtered) ----
  const periodCompare = useMemo(() => {
    const now = new Date();
    const a0 = daysAgo(30);
    const a1 = daysAgo(60);

    const inRange = (u, from, to) => {
      const dt = new Date(u.createdAt);
      return Number.isFinite(dt.getTime()) && dt >= from && dt <= to;
    };

    const this30 = allUsers.filter((u) => inRange(u, a0, now));
    const prev30 = allUsers.filter((u) => inRange(u, a1, a0));

    const activeRate = (xs) => {
      const t = Math.max(1, xs.length);
      const a = xs.filter((u) => u.status === "ACTIVE").length;
      return Math.round((a / t) * 100);
    };

    const delta = (cur, prev) => {
      const d = cur - prev;
      const pct = prev > 0 ? Math.round((d / prev) * 100) : null;
      return { d, pct };
    };

    return {
      this30: this30.length,
      prev30: prev30.length,
      newUsersDelta: delta(this30.length, prev30.length),
      activeRateThis: activeRate(this30),
      activeRatePrev: activeRate(prev30),
      activeRateDelta: delta(activeRate(this30), activeRate(prev30)),
    };
  }, [allUsers]);

  // ---- monthly buckets (based on filteredUsers) ----
  const createdMonthlyByRole = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: monthKey(d),
        label: d.toLocaleString(undefined, { month: "short" }),
        ADMIN: 0,
        DPO: 0,
        USER: 0,
        ACTIVE: 0,
        INACTIVE: 0,
        total: 0,
      });
    }

    const idx = new Map(buckets.map((b, i) => [b.key, i]));

    for (const u of filteredUsers) {
      const dt = new Date(u.createdAt);
      if (!Number.isFinite(dt.getTime())) continue;
      const k = monthKey(dt);
      const i = idx.get(k);
      if (i === undefined) continue;

      const role = u.role || "USER";
      const status = u.status || "ACTIVE";
      buckets[i][role] = (buckets[i][role] || 0) + 1;
      buckets[i][status] = (buckets[i][status] || 0) + 1;
      buckets[i].total += 1;
    }

    if (!normalize) return buckets;

    // normalize to % per month
    return buckets.map((b) => {
      const t = Math.max(1, b.total);
      return {
        ...b,
        ADMIN: Math.round((b.ADMIN / t) * 100),
        DPO: Math.round((b.DPO / t) * 100),
        USER: Math.round((b.USER / t) * 100),
        ACTIVE: Math.round((b.ACTIVE / t) * 100),
        INACTIVE: Math.round((b.INACTIVE / t) * 100),
      };
    });
  }, [filteredUsers, monthsBack, normalize]);

  const composedMonthly = useMemo(() => {
    let cum = 0;
    return createdMonthlyByRole.map((m) => {
      const created = normalize ? m.total : m.total; // keep total as count; normalization is for role/status keys
      cum += m.total;
      const activeRate =
        m.total > 0 ? Math.round((m.ACTIVE / Math.max(1, m.total)) * 100) : 0;
      return {
        key: m.key,
        label: m.label,
        created: m.total,
        cumulative: cum,
        activeRate,
      };
    });
  }, [createdMonthlyByRole, normalize]);

  // role counts & status counts from filteredUsers
  const roleCounts = useMemo(() => {
    const map = { ADMIN: 0, DPO: 0, USER: 0 };
    for (const u of filteredUsers) map[u.role] = (map[u.role] || 0) + 1;
    return map;
  }, [filteredUsers]);

  const statusCounts = useMemo(() => {
    const map = { ACTIVE: 0, INACTIVE: 0 };
    for (const u of filteredUsers) map[u.status] = (map[u.status] || 0) + 1;
    return map;
  }, [filteredUsers]);

  const pieRoleData = useMemo(
    () => [
      { name: "ADMIN", value: roleCounts.ADMIN || 0 },
      { name: "DPO", value: roleCounts.DPO || 0 },
      { name: "USER", value: roleCounts.USER || 0 },
    ],
    [roleCounts],
  );

  const pieStatusData = useMemo(
    () => [
      { name: "ACTIVE", value: statusCounts.ACTIVE || 0 },
      { name: "INACTIVE", value: statusCounts.INACTIVE || 0 },
    ],
    [statusCounts],
  );

  // domain top + full domain counts
  const domainCounts = useMemo(() => {
    const map = new Map();
    for (const u of filteredUsers) {
      const email = (u.email || "").toLowerCase();
      const domain = email.includes("@") ? email.split("@")[1] : "unknown";
      map.set(domain, (map.get(domain) || 0) + 1);
    }
    return map;
  }, [filteredUsers]);

  const domainTop = useMemo(() => {
    return Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([domain, value]) => ({ domain, value }));
  }, [domainCounts]);

  const treemapData = useMemo(() => {
    return [
      {
        name: "Domains",
        children: Array.from(domainCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 40)
          .map(([domain, value]) => ({ name: domain, size: value })),
      },
    ];
  }, [domainCounts]);

  // heatmap dataset: role x status
  const heatmapData = useMemo(() => {
    const roles = ["ADMIN", "DPO", "USER"];
    const statuses = ["ACTIVE", "INACTIVE"];

    const count = {};
    for (const r of roles) for (const s of statuses) count[`${r}-${s}`] = 0;

    for (const u of filteredUsers) {
      const key = `${u.role}-${u.status}`;
      count[key] = (count[key] || 0) + 1;
    }

    const pts = [];
    roles.forEach((r, xi) => {
      statuses.forEach((s, yi) => {
        const v = count[`${r}-${s}`] || 0;
        pts.push({ x: xi, y: yi, v, label: `${r} / ${s}` });
      });
    });
    return pts;
  }, [filteredUsers]);

  // honeycomb dataset
  const honeycombData = useMemo(() => {
    const pts = [];
    const bucketOf = (name) => {
      const n = (name || "").trim().toUpperCase();
      const c = n[0] || "A";
      const code = c.charCodeAt(0);
      if (!Number.isFinite(code)) return 0;
      return clamp(Math.floor(((code - 65) / 26) * 10), 0, 9);
    };

    const grid = Array.from({ length: 2 }, () => new Array(10).fill(0));
    for (const u of filteredUsers) {
      const col = bucketOf(u.fullName);
      const row = u.status === "ACTIVE" ? 0 : 1;
      grid[row][col] += 1;
    }

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 10; col++) {
        pts.push({
          x: col,
          y: row,
          z: grid[row][col],
          label: `bucket ${col + 1} / ${row === 0 ? "ACTIVE" : "INACTIVE"}`,
        });
      }
    }
    return pts;
  }, [filteredUsers]);

  // radar dataset
  const radarData = useMemo(() => {
    const total = Math.max(1, filteredUsers.length);
    return [
      {
        metric: "ADMIN",
        value: Math.round(((roleCounts.ADMIN || 0) / total) * 100),
      },
      {
        metric: "DPO",
        value: Math.round(((roleCounts.DPO || 0) / total) * 100),
      },
      {
        metric: "USER",
        value: Math.round(((roleCounts.USER || 0) / total) * 100),
      },
      {
        metric: "ACTIVE",
        value: Math.round(((statusCounts.ACTIVE || 0) / total) * 100),
      },
      {
        metric: "INACTIVE",
        value: Math.round(((statusCounts.INACTIVE || 0) / total) * 100),
      },
    ];
  }, [filteredUsers.length, roleCounts, statusCounts]);

  // day-of-week distribution
  const dayOfWeek = useMemo(() => {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const xs = names.map((day) => ({ day, value: 0 }));
    for (const u of filteredUsers) {
      const dt = new Date(u.createdAt);
      if (!Number.isFinite(dt.getTime())) continue;
      xs[dt.getDay()].value += 1;
    }
    return xs;
  }, [filteredUsers]);

  // hour distribution (registration time)
  const hourDist = useMemo(() => {
    const xs = Array.from({ length: 24 }, (_, h) => ({ h, value: 0 }));
    for (const u of filteredUsers) {
      const dt = new Date(u.createdAt);
      if (!Number.isFinite(dt.getTime())) continue;
      xs[dt.getHours()].value += 1;
    }
    return xs;
  }, [filteredUsers]);

  // active rate per month (from monthly buckets)
  const activeRateMonthly = useMemo(() => {
    return createdMonthlyByRole.map((m) => {
      const total = Math.max(1, normalize ? m.total || 0 : m.total);
      // use original counts for active rate; createdMonthlyByRole ACTIVE may be % when normalize=true
      // so compute from selectedUsers via month again:
      return { label: m.label, key: m.key, value: 0 };
    });
  }, [createdMonthlyByRole, normalize]);

  const activeRateMonthlyReal = useMemo(() => {
    // compute from filteredUsers, independent of normalize toggle
    const now = new Date();
    const buckets = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: monthKey(d),
        label: d.toLocaleString(undefined, { month: "short" }),
        total: 0,
        active: 0,
        rate: 0,
      });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const u of filteredUsers) {
      const dt = new Date(u.createdAt);
      if (!Number.isFinite(dt.getTime())) continue;
      const k = monthKey(dt);
      const i = idx.get(k);
      if (i === undefined) continue;
      buckets[i].total += 1;
      if (u.status === "ACTIVE") buckets[i].active += 1;
    }
    return buckets.map((b) => ({
      ...b,
      rate: b.total ? Math.round((b.active / b.total) * 100) : 0,
    }));
  }, [filteredUsers, monthsBack]);

  // table rows (selectedUsers)
  const tableRows = useMemo(() => {
    const rows = [...selectedUsers].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return (Number.isFinite(db) ? db : 0) - (Number.isFinite(da) ? da : 0);
    });
    return rows;
  }, [selectedUsers]);

  const tableTotalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const tableSlice = tableRows.slice(
    (tablePage - 1) * pageSize,
    tablePage * pageSize,
  );

  const selectionLabel = useMemo(() => {
    const parts = [];
    if (selected.monthKey) parts.push(`Month: ${selected.monthKey}`);
    if (selected.role) parts.push(`Role: ${selected.role}`);
    if (selected.status) parts.push(`Status: ${selected.status}`);
    if (selected.domain) parts.push(`Domain: ${selected.domain}`);
    if (!parts.length) return "All filtered users";
    return parts.join(" • ");
  }, [selected]);

  // ---------- UI ----------
  const analyticsTabs = [
    { key: "OVERVIEW", label: "Overview" },
    { key: "TRENDS", label: "Trends" },
    { key: "SEGMENTS", label: "Segments" },
    { key: "DOMAINS", label: "Domains" },
    { key: "DISTRIBUTIONS", label: "Distributions" },
    { key: "HEATMAP", label: "Heatmap" },
    { key: "HONEYCOMB", label: "Honeycomb" },
    { key: "MIX", label: "Mix" },
    { key: "DRILLDOWN", label: "Drilldown" },
  ];

  const sectionVisible = (key) => section === key;

  const applyDrill = (patch) => {
    setSelected((s) => ({ ...s, ...patch }));
  };

  const clearDrill = () => {
    setSelected({ monthKey: null, role: null, status: null, domain: null });
  };

  const hasDrill = Boolean(
    selected.monthKey || selected.role || selected.status || selected.domain,
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={cn(cardBase, "overflow-hidden")}>
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-500">
                Admin Module
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                User Analytics
              </div>
              <div className="mt-2 text-sm font-medium text-slate-600">
                Interactive dashboard • filters • drilldowns • exports
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  {filteredUsers.length} users in view
                </span>

                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  Last 30 days: {periodCompare.this30}{" "}
                  <DeltaBadge
                    delta={periodCompare.newUsersDelta.d}
                    pct={periodCompare.newUsersDelta.pct}
                  />
                </span>

                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  Active rate (30d): {periodCompare.activeRateThis}%{" "}
                  <DeltaBadge
                    delta={periodCompare.activeRateDelta.d}
                    pct={periodCompare.activeRateDelta.pct}
                  />
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/admin/users")}
                className={cn(
                  btnBase,
                  "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                onClick={() => exportCsv(`${exportBase}.csv`, filteredUsers)}
                className={cn(
                  btnBase,
                  "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
                type="button"
              >
                <FileDown className="h-4 w-4" />
                Export CSV
              </button>

              <button
                onClick={() => window.print()}
                className={cn(
                  btnBase,
                  "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
                type="button"
              >
                <Printer className="h-4 w-4" />
                Export PDF
              </button>

              <button
                onClick={async () =>
                  exportNodeAsPng(exportRef.current, `${exportBase}.png`)
                }
                className={cn(
                  btnBase,
                  "bg-indigo-600 text-white hover:bg-indigo-700",
                )}
                type="button"
              >
                <Download className="h-4 w-4" />
                Export PNG
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-4 grid gap-1 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name or email…"
                  className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                />
                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="rounded-lg p-1 hover:bg-slate-50"
                    title="Clear"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="flex gap-1">
                {["ALL", "ADMIN", "DPO", "USER"].map((r) => (
                  <Pill
                    key={r}
                    active={roleFilter === r}
                    onClick={() => setRoleFilter(r)}
                    tone="indigo"
                  >
                    {r}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex gap-1">
                {["ALL", "ACTIVE", "INACTIVE"].map((s) => (
                  <Pill
                    key={s}
                    active={statusFilter === s}
                    onClick={() => setStatusFilter(s)}
                    tone={
                      s === "ACTIVE"
                        ? "emerald"
                        : s === "INACTIVE"
                          ? "rose"
                          : "indigo"
                    }
                  >
                    {s}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-wrap items-center gap-1 justify-end">
              <select
                value={monthsBack}
                onChange={(e) => setMonthsBack(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none"
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
                <option value={24}>Last 24 months</option>
              </select>

              <button
                type="button"
                onClick={() => setNormalize((v) => !v)}
                className={cn(
                  btnBase,
                  normalize
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
                title="Toggle normalization (%) for stacked charts"
              >
                {normalize ? "Normalized %" : "Counts"}
              </button>
            </div>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-600" />
      </div>
      {/* Tabs */}
      <h1 className="text-lg font-semibold text-indigo-800">View Analytics </h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap rounded-xl ring-2 ring-indigo-400 bg-white p-1">
          {analyticsTabs?.map((t) => {
            const active = section === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setSection(t.key)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-50",
                )}
                type="button"
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className={cn(
            btnBase,
            "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          )}
          title="Reset filters & drilldown"
        >
          <RefreshCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
      {err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
          {err}
        </div>
      ) : null}

      {/* Printable/export area */}
      <div ref={exportRef} className="space-y-4">
        {loading ? (
          <div className={cn(cardBase, "p-5")}>
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {sectionVisible("OVERVIEW") ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  title="Roles distribution (click to filter)"
                  subtitle="ADMIN / DPO / USER"
                  right={`${filteredUsers.length} in view`}
                  footer="Tip: click a slice to set role filter. Use Reset to clear."
                >
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieRoleData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={2}
                          onClick={(d) =>
                            setRoleFilter(d?.name ? d.name : "ALL")
                          }
                        >
                          {pieRoleData.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={PALETTE[idx % PALETTE.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Status distribution (click to filter)"
                  subtitle="ACTIVE / INACTIVE"
                  footer="Tip: click a slice to set status filter."
                >
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={2}
                          onClick={(d) =>
                            setStatusFilter(d?.name ? d.name : "ALL")
                          }
                        >
                          {pieStatusData.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={PALETTE[(idx + 2) % PALETTE.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Created by month — stacked by role (brush + click)"
                  subtitle={normalize ? "Normalized (%)" : "Counts"}
                  footer="Click a bar segment to drill down that month+role. Use Brush to zoom."
                >
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={createdMonthlyByRole}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="ADMIN"
                          stackId="1"
                          fill={PALETTE[0]}
                          radius={[8, 8, 0, 0]}
                          onClick={(p) =>
                            applyDrill({
                              monthKey: p?.payload?.key || null,
                              role: "ADMIN",
                              status: null,
                              domain: null,
                            })
                          }
                        />
                        <Bar
                          dataKey="DPO"
                          stackId="1"
                          fill={PALETTE[2]}
                          onClick={(p) =>
                            applyDrill({
                              monthKey: p?.payload?.key || null,
                              role: "DPO",
                              status: null,
                              domain: null,
                            })
                          }
                        />
                        <Bar
                          dataKey="USER"
                          stackId="1"
                          fill={PALETTE[4]}
                          onClick={(p) =>
                            applyDrill({
                              monthKey: p?.payload?.key || null,
                              role: "USER",
                              status: null,
                              domain: null,
                            })
                          }
                        />
                        <Brush
                          dataKey="label"
                          height={24}
                          travellerWidth={12}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Created + cumulative (drill by month)"
                  subtitle="Bars + line"
                  footer="Click a bar to drill down that month."
                >
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={composedMonthly}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="created"
                          fill={PALETTE[4]}
                          radius={[8, 8, 0, 0]}
                          onClick={(p) =>
                            applyDrill({
                              monthKey:
                                composedMonthly.find(
                                  (x) => x.label === p?.payload?.label,
                                )?.key ||
                                p?.payload?.key ||
                                null,
                              role: null,
                              status: null,
                              domain: null,
                            })
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulative"
                          stroke={PALETTE[0]}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Brush
                          dataKey="label"
                          height={24}
                          travellerWidth={12}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            ) : null}

            {/* TRENDS */}
            {sectionVisible("TRENDS") ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  title="Role share over time (Line)"
                  subtitle={
                    normalize
                      ? "Showing % (toggle Counts/%)"
                      : "Showing counts (toggle Counts/%)"
                  }
                  footer="This uses the same monthly buckets, just a different lens."
                >
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={createdMonthlyByRole}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="ADMIN"
                          stroke={PALETTE[0]}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="DPO"
                          stroke={PALETTE[2]}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="USER"
                          stroke={PALETTE[4]}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Brush
                          dataKey="label"
                          height={24}
                          travellerWidth={12}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Active rate by month (Line)"
                  subtitle="Derived from users in view"
                  footer="Tip: use Role/Status filters to see how the rate changes for subsets."
                >
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeRateMonthlyReal}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis domain={[0, 100]} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <ReferenceLine
                          y={50}
                          stroke={PALETTE[3]}
                          strokeDasharray="4 4"
                        />
                        <Line
                          type="monotone"
                          dataKey="rate"
                          name="Active rate (%)"
                          stroke={PALETTE[1]}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Brush
                          dataKey="label"
                          height={24}
                          travellerWidth={12}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            ) : null}

            {/* SEGMENTS */}
            {sectionVisible("SEGMENTS") ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  title="Status split by month (stacked)"
                  subtitle={normalize ? "Normalized (%)" : "Counts"}
                  footer="Click ACTIVE/INACTIVE segment to drill down month+status."
                >
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={createdMonthlyByRole}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="ACTIVE"
                          stackId="1"
                          fill={PALETTE[1]}
                          radius={[8, 8, 0, 0]}
                          onClick={(p) =>
                            applyDrill({
                              monthKey: p?.payload?.key || null,
                              role: null,
                              status: "ACTIVE",
                              domain: null,
                            })
                          }
                        />
                        <Bar
                          dataKey="INACTIVE"
                          stackId="1"
                          fill={PALETTE[3]}
                          onClick={(p) =>
                            applyDrill({
                              monthKey: p?.payload?.key || null,
                              role: null,
                              status: "INACTIVE",
                              domain: null,
                            })
                          }
                        />
                        <Brush
                          dataKey="label"
                          height={24}
                          travellerWidth={12}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Role counts (Bar)"
                  subtitle="Simple breakdown (click to drill)"
                  footer="Click a bar to drill by role."
                >
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "ADMIN", value: roleCounts.ADMIN || 0 },
                          { name: "DPO", value: roleCounts.DPO || 0 },
                          { name: "USER", value: roleCounts.USER || 0 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill={PALETTE[0]}
                          radius={[8, 8, 0, 0]}
                          onClick={(p) =>
                            applyDrill({
                              monthKey: null,
                              role: p?.payload?.name || null,
                              status: null,
                              domain: null,
                            })
                          }
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            ) : null}

            {/* DOMAINS */}
            {sectionVisible("DOMAINS") ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  title="Top domains (Bar)"
                  subtitle="Click a bar to drill by domain"
                  footer="Tip: domain drilldown is useful for internal vs external users."
                >
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={domainTop} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="domain" width={130} />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill={PALETTE[4]}
                          radius={[0, 8, 8, 0]}
                          onClick={(p) =>
                            applyDrill({
                              monthKey: null,
                              role: null,
                              status: null,
                              domain: p?.payload?.domain || null,
                            })
                          }
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Domains (Treemap)"
                  subtitle="Top 40 domains by size"
                  footer="Treemap helps spot long-tail quickly. Use the bar chart for readability."
                >
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={treemapData}
                        dataKey="size"
                        stroke="#E2E8F0"
                        fill={PALETTE[0]}
                      />
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            ) : null}

            {/* DISTRIBUTIONS */}
            {sectionVisible("DISTRIBUTIONS") ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  title="Created day-of-week"
                  subtitle="Where signups cluster"
                  footer="Useful for scheduling communications or maintenance windows."
                >
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayOfWeek}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill={PALETTE[2]}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Created by hour"
                  subtitle="24-hour distribution"
                  footer="This depends on server/user timezone captured in createdAt."
                >
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourDist}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="h" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={PALETTE[4]}
                          fill={PALETTE[4]}
                          fillOpacity={0.25}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            ) : null}

            {/* HEATMAP */}
            {sectionVisible("HEATMAP") ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  title="Role × Status heatmap (click to drill)"
                  subtitle="Counts as heat tiles"
                  footer="Click a tile to drill down that exact role/status segment."
                >
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          tickFormatter={(v) =>
                            ["ADMIN", "DPO", "USER"][v] || v
                          }
                          ticks={[0, 1, 2]}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          tickFormatter={(v) => ["ACTIVE", "INACTIVE"][v] || v}
                          ticks={[0, 1]}
                        />
                        <ZAxis type="number" dataKey="v" range={[0, 400]} />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          formatter={(val, name, p) => [
                            p?.payload?.v,
                            p?.payload?.label,
                          ]}
                        />
                        <Scatter
                          data={heatmapData.map((p) => ({
                            ...p,
                            fill:
                              p.v === 0
                                ? "#CBD5E1"
                                : p.y === 0
                                  ? PALETTE[1]
                                  : PALETTE[3],
                          }))}
                          shape={(props) => <HeatCell {...props} />}
                          onClick={(p) => {
                            const roles = ["ADMIN", "DPO", "USER"];
                            const statuses = ["ACTIVE", "INACTIVE"];
                            applyDrill({
                              monthKey: null,
                              role: roles[p?.x] || null,
                              status: statuses[p?.y] || null,
                              domain: null,
                            });
                          }}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Radar summary"
                  subtitle="Percent shares (roles + status)"
                  footer="Quick overall balance. Use other tabs for details."
                >
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Tooltip />
                        <Radar
                          dataKey="value"
                          stroke={PALETTE[0]}
                          fill={PALETTE[0]}
                          fillOpacity={0.25}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            ) : null}

            {/* HONEYCOMB */}
            {sectionVisible("HONEYCOMB") ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  title="Honeycomb-like view (hex scatter)"
                  subtitle="Name-initial buckets × status rows"
                  footer="A more ‘modern’ density view. Hover tooltips for counts."
                >
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          ticks={[0, 1]}
                          tickFormatter={(v) =>
                            v === 0 ? "ACTIVE" : "INACTIVE"
                          }
                        />
                        <ZAxis type="number" dataKey="z" range={[6, 28]} />
                        <Tooltip
                          formatter={(val, name, p) => [
                            p?.payload?.z,
                            p?.payload?.label,
                          ]}
                        />
                        <Scatter
                          data={honeycombData.map((p) => ({
                            ...p,
                            fill: p.y === 0 ? PALETTE[1] : PALETTE[3],
                          }))}
                          shape={(props) => (
                            <HexDot
                              {...props}
                              size={
                                props?.payload?.z
                                  ? Math.min(22, 8 + props.payload.z)
                                  : 10
                              }
                            />
                          )}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Status counts (Bar)"
                  subtitle="ACTIVE vs INACTIVE (click to drill)"
                  footer="Click a bar to drill down by status."
                >
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "ACTIVE", value: statusCounts.ACTIVE || 0 },
                          {
                            name: "INACTIVE",
                            value: statusCounts.INACTIVE || 0,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill={PALETTE[1]}
                          radius={[8, 8, 0, 0]}
                          onClick={(p) =>
                            applyDrill({
                              monthKey: null,
                              role: null,
                              status: p?.payload?.name || null,
                              domain: null,
                            })
                          }
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            ) : null}

            {/* MIX */}
            {sectionVisible("MIX") ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  title="Roles + Status overview (Composed)"
                  subtitle="Bars for roles, line for active count"
                  footer="A compact executive view."
                >
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={[
                          {
                            name: "Counts",
                            admins: roleCounts.ADMIN || 0,
                            dpo: roleCounts.DPO || 0,
                            users: roleCounts.USER || 0,
                            active: statusCounts.ACTIVE || 0,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="admins"
                          fill={PALETTE[0]}
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="dpo"
                          fill={PALETTE[2]}
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="users"
                          fill={PALETTE[4]}
                          radius={[8, 8, 0, 0]}
                        />
                        <Line
                          type="monotone"
                          dataKey="active"
                          stroke={PALETTE[1]}
                          strokeWidth={2}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Domain rank vs count (Scatter)"
                  subtitle="Hover for domain label"
                  footer="Scatter is fun, but use bar/treemap for best readability."
                >
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="rank" />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="count"
                          allowDecimals={false}
                        />
                        <Tooltip
                          formatter={(v, n, p) => [
                            p?.payload?.y,
                            p?.payload?.label,
                          ]}
                        />
                        <Scatter
                          data={domainTop.map((d, idx) => ({
                            x: idx + 1,
                            y: d.value,
                            label: d.domain,
                          }))}
                          fill={PALETTE[0]}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            ) : null}

            {/* DRILLDOWN */}
            {sectionVisible("DRILLDOWN") ? (
              <div className="grid gap-4 lg:grid-cols-1">
                <ChartCard
                  title="Drilldown table (live)"
                  subtitle={selectionLabel}
                  right={
                    <span className="inline-flex items-center gap-2">
                      {hasDrill ? (
                        <button
                          type="button"
                          onClick={clearDrill}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Clear drilldown
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          exportCsv(`${exportBase}_segment.csv`, selectedUsers)
                        }
                        className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Export segment CSV
                      </button>
                    </span>
                  }
                  footer="This table updates from: search + role/status filters + date window + drilldown clicks."
                >
                  {selectedUsers.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                      No users match your current filters/drilldown.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                                Role
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                                Created
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {tableSlice.map((u, idx) => (
                              <tr
                                key={u.id || `${u.email}-${idx}`}
                                className="hover:bg-slate-50"
                              >
                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                  {u.fullName || "—"}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                  {u.email || "—"}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                  <span className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold">
                                    {u.role || "—"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                  <span
                                    className={cn(
                                      "rounded-xl border px-2 py-1 text-xs font-semibold",
                                      u.status === "ACTIVE"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : "border-rose-200 bg-rose-50 text-rose-800",
                                    )}
                                  >
                                    {u.status || "—"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                  {formatDateShort(u.createdAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-medium text-slate-600">
                          Showing {(tablePage - 1) * pageSize + 1}–
                          {Math.min(tablePage * pageSize, tableRows.length)} of{" "}
                          {tableRows.length}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setTablePage((p) => Math.max(1, p - 1))
                            }
                            disabled={tablePage === 1}
                            className={cn(
                              "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50",
                              tablePage === 1 &&
                                "opacity-50 cursor-not-allowed",
                            )}
                          >
                            Prev
                          </button>
                          <div className="text-xs font-semibold text-slate-700">
                            Page {tablePage} / {tableTotalPages}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setTablePage((p) =>
                                Math.min(tableTotalPages, p + 1),
                              )
                            }
                            disabled={tablePage === tableTotalPages}
                            className={cn(
                              "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50",
                              tablePage === tableTotalPages &&
                                "opacity-50 cursor-not-allowed",
                            )}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </ChartCard>
              </div>
            ) : null}

            {/* Always show a small “current drill” strip */}
            <div className={cn(cardBase, "p-4")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">
                  Current view
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    {selectionLabel}
                  </span>
                  {hasDrill ? (
                    <button
                      type="button"
                      onClick={clearDrill}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Clear drilldown
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSection("DRILLDOWN")}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Open drilldown table
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs font-medium text-slate-600">
                Interaction tips: click chart segments → drilldown; pies → set
                filters; Brush → zoom; Export CSV → exports current view.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
