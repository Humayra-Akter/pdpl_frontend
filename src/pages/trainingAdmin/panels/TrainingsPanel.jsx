import {
  Clock,
  GraduationCap,
  ArrowUpRight,
  Trash2,
  Edit3,
} from "lucide-react";
import { Card, SectionTitle } from "../ui/atoms";
import { cn, clamp, pillTone, formatDate } from "../utils";

export function TrainingsPanel({
  trainings,
  assignmentsByTraining,
  onOpenBuilder,
  onOpenAssign,
  onDelete,
}) {
  return (
    <Card>
      <SectionTitle
        title="Trainings"
        subtitle={`${trainings.length} record(s) • build modules, request DPO approval, publish`}
        right={
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
            <Clock className="h-4 w-4" />
            Only 1 training at a time should be active for users (policy)
          </span>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-bold text-slate-600">
              <th className="px-5 py-3">Training</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Validity</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Assigned</th>
              <th className="px-5 py-3">Completion</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {trainings.length ? (
              trainings.map((t) => {
                const as = assignmentsByTraining.get(t.id) || [];
                const total = as.length || 0;
                const completed = as.filter(
                  (a) => a.status === "COMPLETED",
                ).length;
                const completion = total
                  ? Math.round((completed / total) * 100)
                  : 0;

                return (
                  <tr
                    key={t.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
                          <GraduationCap className="h-5 w-5 text-indigo-700" />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-900">
                            {t.title}
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-slate-500">
                            Created: {formatDate(t.createdAt)} • By:{" "}
                            {t.createdBy}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                          pillTone(t.status),
                        )}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                      {t.validityDays} days
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                      {formatDate(t.dueAt)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                      {total ? `${total} users` : "Not assigned"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{ width: `${clamp(completion, 0, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          {completion}%
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => onOpenBuilder(t.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          type="button"
                        >
                          <Edit3 className="h-4 w-4" />
                          Build
                        </button>

                        <button
                          onClick={() => onOpenAssign(t.id)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                          type="button"
                        >
                          Assign <ArrowUpRight className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDelete(t.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-10">
                  <div className="text-sm font-bold text-slate-900">
                    No trainings found
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-600">
                    Create a training, then build modules & quiz, and request
                    DPO approval.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
