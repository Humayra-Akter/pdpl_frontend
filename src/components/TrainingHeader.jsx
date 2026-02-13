// /components/TrainingHeader.jsx
export default function TrainingHeader({
  ui,
  lucide,
  loading,
  onRefresh,
  onNewTraining,
  onOpenSettings,
  tab,
  onTabChange,
  q,
  onQChange,
  status,
  onStatusChange,
}) {
  const { cn } = ui;
  const {
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
  } = lucide;

  return (
    <div className="space-y-6">
      {/* Hero */}
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
                  onClick={onRefresh}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  type="button"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", loading ? "animate-spin" : "")}
                  />
                  Refresh
                </button>

                <button
                  onClick={onNewTraining}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  New Training
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  type="button"
                >
                  <Settings className="h-4 w-4" />
                  Rules & Reminders
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-600" />
      </div>

      {/* Tabs + search */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            ui={ui}
            value={tab}
            onChange={onTabChange}
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
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={q}
                onChange={(e) => onQChange(e.target.value)}
                placeholder="Search trainings by title..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
              {q ? (
                <button
                  onClick={() => onQChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1 text-slate-500 hover:bg-slate-100"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
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
    </div>
  );
}

function Tabs({ ui, value, onChange, tabs }) {
  const { cn } = ui;
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = value === t.key;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
              active
                ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
            )}
            type="button"
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
