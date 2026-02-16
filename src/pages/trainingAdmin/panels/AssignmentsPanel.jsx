import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Card, SectionTitle } from "../ui/atoms";
import { cn, pillTone, formatDate } from "../utils";
import { ASSIGNMENT_STATUS } from "../constants";

export function AssignmentsPanel({ trainings, users, assignments }) {
  const [trainingId, setTrainingId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    let xs = assignments.map((a) => {
      const t = trainings.find((x) => x.id === a.trainingId);
      const u = users.find((x) => x.id === a.userId);

      return {
        ...a,
        trainingTitle: t?.title || a.trainingId,
        dueAt: t?.dueAt,
        userName: u?.name || a.userId,
        dept: u?.dept || "—",
      };
    });

    if (trainingId !== "ALL")
      xs = xs.filter((x) => x.trainingId === trainingId);
    if (status !== "ALL") xs = xs.filter((x) => x.status === status);

    if (q.trim()) {
      xs = xs.filter((x) =>
        x.userName.toLowerCase().includes(q.trim().toLowerCase()),
      );
    }

    return xs;
  }, [assignments, trainings, users, trainingId, status, q]);

  return (
    <Card>
      <SectionTitle
        title="Assignments"
        subtitle="Track completion records and quiz results (audit evidence)"
      />

      <div className="space-y-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by user name..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
            {q ? (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1 text-slate-500 hover:bg-slate-100"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={trainingId}
              onChange={(e) => setTrainingId(e.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="ALL">All Trainings</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="ALL">All Status</option>
              {ASSIGNMENT_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold text-slate-600">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Training</th>
                  <th className="px-5 py-3">Dept</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Due</th>
                  <th className="px-5 py-3">Completed</th>
                </tr>
              </thead>

              <tbody>
                {rows.length ? (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        {r.userName}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {r.trainingTitle}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {r.dept}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                            pillTone(r.status),
                          )}
                        >
                          {r.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        {r.score ?? "—"}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {formatDate(r.dueAt)}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {formatDate(r.completedAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-10">
                      <div className="text-sm font-bold text-slate-900">
                        No assignment records
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-600">
                        Assign a published training to all users.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">Audit evidence</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            This table supports audit trail requirements: completion records +
            quiz results (score) + due dates.
          </div>
        </div>
      </div>
    </Card>
  );
}
