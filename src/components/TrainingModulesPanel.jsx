// /components/TrainingModulesPanel.jsx
import { useMemo, useState } from "react";

function EllipsisCell({
  id,
  text,
  expanded,
  onToggle,
  className = "",
  wrapWhenExpanded = true,
}) {
  const safeText = text ?? "—";
  const isLong = String(safeText).length > 22; // tweak threshold if you want

  return (
    <button
      type="button"
      onClick={() => isLong && onToggle(id)}
      title={isLong ? "Click to expand/collapse" : String(safeText)}
      className={[
        "w-full text-center",
        "text-sm font-semibold text-slate-800",
        isLong ? "cursor-pointer" : "cursor-default",
        // collapsed: single-line ellipsis
        !expanded ? "truncate" : "",
        // expanded: either wrap or keep single line
        expanded && wrapWhenExpanded ? "whitespace-normal break-words" : "",
        className,
      ].join(" ")}
    >
      {safeText}
    </button>
  );
}

export default function TrainingModulesPanel({
  ui,
  lucide,
  trainings,
  assignmentsByTraining,
  onOpenBuilder,
  onOpenAssign,
  onDelete,
}) {
  const { Card, SectionTitle, cn, pillTone, formatDate, clamp } = ui;
  const { Clock, Edit3, ArrowUpRight, Trash2 } = lucide;

  // track expanded cells: key = `${rowId}:${field}`
  const [expanded, setExpanded] = useState(() => new Set());

  const toggle = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Small helper so we don’t repeat string keys everywhere
  const cellKey = (rowId, field) => `${rowId}:${field}`;
  const isExpanded = (rowId, field) => expanded.has(cellKey(rowId, field));

  return (
    <Card>
      <SectionTitle
        title="Trainings"
        subtitle={`${trainings.length} record(s) • build modules, request DPO approval, publish`}
        right={
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200 max-w-[420px] min-w-0 truncate">
            <Clock className="h-4 w-4 shrink-0" />
            Only 1 training at a time should be active for users (policy)
          </span>
        }
      />

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-slate-50">
            <tr className="text-xs font-bold text-slate-600">
              <th className="px-3 py-3 text-center">Training</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-3 py-3 text-center">Validity</th>
              <th className="px-3 py-3 text-center">Due Date</th>
              <th className="px-3 py-3 text-center">Assigned</th>
              <th className="px-3 py-3 text-center">Completion</th>
              <th className="px-3 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="text-center">
            {trainings?.length ? (
              trainings.map((t, idx) => {
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
                    className={cn(
                      "border-t border-slate-100",
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/60",
                      "hover:bg-indigo-50/40",
                    )}
                  >
                    {/* Training title + meta */}
                    <td className="px-3 py-4 align-middle">
                      <div className="grid gap-1 justify-items-center">
                        <EllipsisCell
                          id={cellKey(t.id, "title")}
                          text={t.title}
                          expanded={isExpanded(t.id, "title")}
                          onToggle={toggle}
                          className="text-sm font-bold text-slate-900 max-w-[320px]"
                        />
                        <EllipsisCell
                          id={cellKey(t.id, "meta")}
                          text={`Created: ${formatDate(t.createdAt)} • By: ${t.createdBy}`}
                          expanded={isExpanded(t.id, "meta")}
                          onToggle={toggle}
                          className="text-xs font-semibold text-slate-500 max-w-[340px]"
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-4 align-middle">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggle(cellKey(t.id, "status"))}
                          title="Click to expand/collapse"
                          className={cn(
                            "inline-flex max-w-[180px] items-center justify-center rounded-full px-3 py-1 text-xs font-bold ring-1",
                            pillTone(t.status),
                            isExpanded(t.id, "status")
                              ? "whitespace-normal break-words"
                              : "truncate",
                          )}
                        >
                          {String(t.status).replaceAll("_", " ")}
                        </button>
                      </div>
                    </td>

                    {/* Validity */}
                    <td className="px-3 py-4 align-middle">
                      <EllipsisCell
                        id={cellKey(t.id, "validity")}
                        text={`${t.validityDays} days`}
                        expanded={isExpanded(t.id, "validity")}
                        onToggle={toggle}
                        className="max-w-[140px]"
                      />
                    </td>

                    {/* Due date */}
                    <td className="px-3 py-4 align-middle">
                      <EllipsisCell
                        id={cellKey(t.id, "due")}
                        text={formatDate(t.dueAt)}
                        expanded={isExpanded(t.id, "due")}
                        onToggle={toggle}
                        className="max-w-[140px]"
                      />
                    </td>

                    {/* Assigned */}
                    <td className="px-3 py-4 align-middle">
                      <EllipsisCell
                        id={cellKey(t.id, "assigned")}
                        text={total ? `${total} users` : "Not assigned"}
                        expanded={isExpanded(t.id, "assigned")}
                        onToggle={toggle}
                        className="max-w-[160px]"
                      />
                    </td>

                    {/* Completion */}
                    <td className="px-3 py-4 align-middle">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
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

                    {/* Action */}
                    <td className="px-3 py-4 align-middle">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => onOpenBuilder(t.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          type="button"
                        >
                          <Edit3 className="h-4 w-4" />
                          Build
                        </button>

                        <button
                          onClick={() => onOpenAssign(t.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                          type="button"
                        >
                          Assign
                          <ArrowUpRight className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDelete(t.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
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
