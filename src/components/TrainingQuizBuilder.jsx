// /components/TrainingQuizBuilder.jsx
import { useMemo, useState } from "react";

export default function TrainingQuizBuilder({
  ui,
  lucide,
  difficultyEnums,
  questionBank,
  onUpsert, // optional (edit later)
  onCreateNew, // required (create new)
}) {
  const { Card, SectionTitle, cn, pillTone } = ui;
  const { Plus, Search, X } = lucide;

  const [q, setQ] = useState("");
  const [tag, setTag] = useState("ALL");
  const [difficulty, setDifficulty] = useState("ALL");
  const [openCreate, setOpenCreate] = useState(false);

  const tags = useMemo(() => {
    const set = new Set();
    for (const x of questionBank) for (const t of x.tags || []) set.add(t);
    return ["ALL", ...Array.from(set)];
  }, [questionBank]);

  const filtered = useMemo(() => {
    let xs = [...questionBank];
    if (q.trim())
      xs = xs.filter((x) =>
        x.text.toLowerCase().includes(q.trim().toLowerCase()),
      );
    if (tag !== "ALL") xs = xs.filter((x) => (x.tags || []).includes(tag));
    if (difficulty !== "ALL")
      xs = xs.filter((x) => x.difficulty === difficulty);
    return xs;
  }, [questionBank, q, tag, difficulty]);

  return (
    <>
      <Card>
        <SectionTitle
          title="Question Bank"
          subtitle="Create reusable MCQs • tag by topic • attach to quizzes"
          right={
            <button
              onClick={() => setOpenCreate(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700"
              type="button"
            >
              <Plus className="h-4 w-4" />
              New Question
            </button>
          }
        />

        <div className="p-5 space-y-4">
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
                {difficultyEnums.map((d) => (
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
                          <div className="flex flex-wrap gap-2">
                            {(x.tags || []).map((t) => (
                              <span
                                key={t}
                                className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {x.options?.[x.answerIndex] ?? "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-10">
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
              Keep quizzes mandatory for every training (SG). Questions should
              be reusable across modules and trainings.
            </div>
          </div>
        </div>
      </Card>

      <QuestionDrawer
        ui={ui}
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        difficultyEnums={difficultyEnums}
        onSave={(qItem) => {
          setOpenCreate(false);
          onCreateNew?.(qItem);
        }}
      />
    </>
  );
}

function QuestionDrawer({ ui, open, onClose, onSave, difficultyEnums }) {
  const { Drawer } = ui;

  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("EASY");
  const [tags, setTags] = useState("fundamentals");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answerIndex, setAnswerIndex] = useState(0);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!text.trim()) e.text = "Question text is required.";
    const filled = options.map((x) => x.trim()).filter(Boolean);
    if (filled.length < 2) e.options = "Provide at least 2 answer options.";
    if (!options[answerIndex]?.trim())
      e.answerIndex = "Correct answer must be a non-empty option.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // reset on open
  useMemo(() => {
    if (!open) return;
    setText("");
    setDifficulty("EASY");
    setTags("fundamentals");
    setOptions(["", "", "", ""]);
    setAnswerIndex(0);
    setErrors({});
  }, [open]);

  return (
    <Drawer
      open={open}
      title="Create MCQ Question"
      subtitle="Reusable question bank item (mandatory quizzes per training)"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!validate()) return;
              onSave({
                text: text.trim(),
                difficulty,
                tags: tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
                options,
                answerIndex,
              });
            }}
            className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
            type="button"
          >
            Save Question
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-xs font-bold text-slate-700">Question</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
          {errors.text ? (
            <div className="mt-1 text-xs font-semibold text-rose-600">
              {errors.text}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-bold text-slate-700">Difficulty</div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              {difficultyEnums.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-700">Tags</div>
              <div className="text-[11px] font-semibold text-slate-500">
                Comma separated
              </div>
            </div>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-bold text-slate-900">Options</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Pick the correct answer option.
          </div>

          <div className="mt-3 space-y-3">
            {options.map((op, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="answer"
                  checked={answerIndex === idx}
                  onChange={() => setAnswerIndex(idx)}
                />
                <input
                  value={op}
                  onChange={(e) => {
                    const v = e.target.value;
                    setOptions((prev) =>
                      prev.map((x, i) => (i === idx ? v : x)),
                    );
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            ))}
          </div>

          {errors.options ? (
            <div className="mt-2 text-xs font-semibold text-rose-600">
              {errors.options}
            </div>
          ) : null}
          {errors.answerIndex ? (
            <div className="mt-2 text-xs font-semibold text-rose-600">
              {errors.answerIndex}
            </div>
          ) : null}
        </div>
      </div>
    </Drawer>
  );
}
