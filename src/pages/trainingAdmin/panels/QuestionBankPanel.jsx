import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Card, SectionTitle } from "../ui/atoms";
import { cn, pillTone } from "../utils";
import { DIFFICULTY } from "../constants";

export function QuestionBankPanel({
  questionBank = [],
  onCreate,
  onUpsert, // kept (not used here), so parent won't break
  onEdit,
  onDelete,
}) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("ALL");
  const [difficulty, setDifficulty] = useState("ALL");

  const tags = useMemo(() => {
    const set = new Set();
    for (const x of questionBank) for (const t of x.tags || []) set.add(t);
    return ["ALL", ...Array.from(set)];
  }, [questionBank]);

  const filtered = useMemo(() => {
    let xs = [...questionBank];

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      xs = xs.filter((x) =>
        String(x.text || "")
          .toLowerCase()
          .includes(needle),
      );
    }

    if (tag !== "ALL") {
      xs = xs.filter((x) => (x.tags || []).includes(tag));
    }

    if (difficulty !== "ALL") {
      xs = xs.filter((x) => x.difficulty === difficulty);
    }

    return xs;
  }, [questionBank, q, tag, difficulty]);

  return (
    <Card>
      <SectionTitle
        title="Question Bank"
        subtitle="Create reusable MCQs • tag by topic • attach to quizzes"
        right={
          <button
            onClick={() => onCreate?.()}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700"
            type="button"
          >
            <Plus className="h-4 w-4" />
            New Question
          </button>
        }
      />

      <div className="space-y-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search questions..."
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
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t === "ALL" ? "All Topics" : t}
                </option>
              ))}
            </select>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="ALL">All Difficulty</option>
              {DIFFICULTY.map((d) => (
                <option key={d} value={d}>
                  {d}
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
                  <th className="px-5 py-3">Question</th>
                  <th className="px-5 py-3">Difficulty</th>
                  <th className="px-5 py-3">Tags</th>
                  <th className="px-5 py-3">Answer</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length ? (
                  filtered.map((x) => (
                    <tr
                      key={x.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        {x.text}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                            pillTone(
                              x.difficulty === "HARD"
                                ? "HIGH"
                                : x.difficulty === "MEDIUM"
                                  ? "MEDIUM"
                                  : "LOW",
                            ),
                          )}
                        >
                          {x.difficulty}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {x.tags?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {x.tags.map((t) => (
                              <span
                                key={t}
                                className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-slate-500">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {x.options?.[x.answerIndex] ?? "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => onEdit?.(x)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold hover:bg-slate-50"
                            type="button"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => onDelete?.(x)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-10">
                      <div className="text-sm font-bold text-slate-900">
                        No matching questions
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-600">
                        Try clearing filters or create a new MCQ.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">Tip</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Keep quizzes mandatory for every training (SG). Questions should be
            reusable across modules and trainings.
          </div>
        </div>
      </div>
    </Card>
  );
}
