// /components/TrainingGraphs.jsx
import { useMemo } from "react";

export default function TrainingGraphs({ ui, lucide, trainings, assignments }) {
  const { Card, SectionTitle, cn, pillTone, clamp, formatDate } = ui;
  const { Users, Calendar, Clock, CheckCircle2 } = lucide;

  const published = trainings.filter((t) => t.status === "PUBLISHED");

  const perTraining = useMemo(() => {
    return published.map((t) => {
      const xs = assignments.filter((a) => a.trainingId === t.id);
      const total = xs.length;
      const completed = xs.filter((a) => a.status === "COMPLETED").length;
      const overdue = xs.filter((a) => a.status === "OVERDUE").length;
      const inProgress = xs.filter((a) => a.status === "IN_PROGRESS").length;
      const completion = total ? Math.round((completed / total) * 100) : 0;
      return { t, total, completed, overdue, inProgress, completion };
    });
  }, [published, assignments]);

  return (
    <Card>
      <SectionTitle
        title="Training Status Distribution"
        subtitle="At-a-glance: published trainings and their completion progress"
      />
      <div className="p-5 space-y-4">
        {perTraining.length ? (
          perTraining.map((row) => (
            <div
              key={row.t.id}
              className="rounded-3xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {row.t.title}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                        pillTone(row.t.status),
                      )}
                    >
                      {row.t.status}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      <Users className="h-4 w-4" />
                      Assigned: {row.total || 0}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      <Calendar className="h-4 w-4" />
                      Due: {formatDate(row.t.dueAt)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      <Clock className="h-4 w-4" />
                      Valid: {row.t.validityDays} days
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500">
                    Completion
                  </div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">
                    {row.completion}%
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <MiniStat
                  label="Completed"
                  value={row.completed}
                  tone="emerald"
                />
                <MiniStat
                  label="In Progress"
                  value={row.inProgress}
                  tone="indigo"
                />
                <MiniStat label="Overdue" value={row.overdue} tone="rose" />
              </div>

              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${clamp(row.completion, 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <div className="text-sm font-bold text-slate-900">
              No published training yet
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-600">
              Create a training, build modules, request DPO approval, then
              publish.
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-4">
          <div className="text-sm font-bold text-slate-900">
            Audit-ready definition (Training)
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Audit ready means:{" "}
            <span className="font-bold">all assigned users completed</span> the
            currently required training(s), and you can produce evidence: who
            created, who assigned, completion records, and quiz results.
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <ProofItem icon={CheckCircle2} label="Creator & Approver" />
            <ProofItem icon={CheckCircle2} label="Assignment records" />
            <ProofItem icon={CheckCircle2} label="Quiz scores & attempts" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function MiniStat({ label, value, tone }) {
  const map = {
    emerald: "bg-emerald-50 ring-emerald-200 text-emerald-900",
    indigo: "bg-indigo-50 ring-indigo-200 text-indigo-900",
    rose: "bg-rose-50 ring-rose-200 text-rose-900",
  };
  return (
    <div className={`rounded-3xl p-3 ring-1 ${map[tone] || map.indigo}`}>
      <div className="text-xs font-bold">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function ProofItem({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <Icon className="h-4 w-4 text-emerald-600" />
      <div className="text-xs font-bold text-slate-800">{label}</div>
    </div>
  );
}
