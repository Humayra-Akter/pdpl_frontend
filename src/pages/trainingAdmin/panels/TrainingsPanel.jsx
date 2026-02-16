import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  GraduationCap,
  ArrowUpRight,
  Trash2,
  Edit3,
} from "lucide-react";
import { Card, SectionTitle } from "../ui/atoms";
import { cn, clamp, pillTone, formatDate } from "../utils";

function prettyStatus(s) {
  return String(s || "")
    .replaceAll("_", " ")
    .trim();
}

function formatDateLong(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function TrainingsPanel({
  trainings,
  assignmentsByTraining,
  onOpenBuilder,
  onOpenAssign,
  onDelete,
}) {
  // Pagination: minimum 10 visible
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(trainings.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return trainings.slice(start, start + pageSize);
  }, [trainings, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

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

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[18%]" /> {/* Training */}
            <col className="w-[8%]" /> {/* Status */}
            <col className="w-[5%]" /> {/* Validity */}
            <col className="w-[10%]" /> {/* Due Date */}
            <col className="w-[5%]" /> {/* Assigned */}
            <col className="w-[10%]" /> {/* Completion */}
            <col className="w-[8%]" /> {/* Action */}
          </colgroup>

          <thead className="bg-slate-100">
            <tr className="text-left text-sm font-bold text-indigo-600">
              <th className="py-3 text-center">Training</th>
              <th className="py-3 text-center">Status</th>
              <th className="py-3 text-center">Validity</th>
              <th className="py-3 text-center">Due Date</th>
              <th className="py-3 text-center">Assigned</th>
              <th className="py-3 text-center">Completion</th>
              <th className="py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length ? (
              pageItems.map((t, idx) => {
                const as = assignmentsByTraining.get(t.id) || [];
                const total = as.length || 0;
                const completed = as.filter(
                  (a) => a.status === "COMPLETED",
                ).length;
                const completion = total
                  ? Math.round((completed / total) * 100)
                  : 0;

                const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50/80";

                return (
                  <tr
                    key={t.id}
                    className={cn(
                      "border-t border-slate-100 hover:bg-slate-100",
                      zebra,
                    )}
                  >
                    {/* TRAINING */}
                    <td className="pl-3 py-4">
                      <div className="flex items-start gap-1">
                        <GraduationCap className="h-4 w-4 text-indigo-700" />
                        <div>
                          <div className="text-sm font-bold text-slate-900 whitespace-normal break-words leading-snug">
                            {t.title}
                          </div>

                          <div className="mt-0.5 text-xs font-semibold text-slate-500">
                            Created: {formatDate(t.createdAt)} • By:{" "}
                            {t.createdBy || "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-1 py-4 text-center">
                      <span
                        className={cn(
                          "inline-flex max-w-full justify-center whitespace-normal break-words rounded-md px-1 py-1 text-xs font-semibold ring-1",
                          pillTone(t.status),
                        )}
                        title={prettyStatus(t.status)}
                      >
                        {prettyStatus(t.status)}
                      </span>
                    </td>

                    {/* VALIDITY */}
                    <td className="px-1 py-4 text-center text-sm font-semibold text-slate-800">
                      {t.validityDays}d
                    </td>

                    {/* DUE */}
                    <td className="px-1 py-4 text-center text-sm font-semibold text-slate-800">
                      {formatDateLong(t.dueAt)}
                    </td>

                    {/* ASSIGNED */}
                    <td className="px-1 py-4 text-center text-sm font-semibold text-slate-800">
                      {total ? `${total} users` : "Not assigned"}
                    </td>

                    {/* COMPLETION */}
                    <td className="px-2 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
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

                    {/* ACTION */}
                    <td className="px-2 py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => onOpenBuilder(t.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          type="button"
                        >
                          <Edit3 className="h-4 w-4" />
                          Build
                        </button>

                        <button
                          onClick={() => onOpenAssign(t.id)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-2 py-1 text-sm font-semibold text-white hover:bg-indigo-700"
                          type="button"
                        >
                          Assign <ArrowUpRight className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDelete(t.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-2 py-1 text-sm font-semibold text-rose-700 hover:bg-rose-100"
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
                <td colSpan={7} className="px-1 py-10">
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

        {/* Pagination bottom-right */}
        <div className="flex items-center justify-end gap-3 px-5 py-4">
          <div className="text-xs font-semibold text-slate-600">
            Page {page} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-bold",
                page === 1
                  ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
              )}
            >
              Prev
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-bold",
                page === totalPages
                  ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
              )}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
