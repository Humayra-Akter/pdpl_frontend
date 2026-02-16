import { useEffect, useMemo, useState } from "react";
import { Drawer, Field } from "../ui/atoms";
import { cn } from "../utils";
import { DIFFICULTY } from "../constants";

/**
 * Props:
 * - open: boolean
 * - onClose: fn
 * - onSave: fn(payload) -> parent does API call
 * - initialQuestion: optional question object from questionBank (for edit)
 *
 * initialQuestion expected shape (same as your questionBank items):
 * {
 *   id,
 *   trainingId,
 *   text,
 *   difficulty,
 *   tags: [],
 *   options: [],
 *   answerIndex
 * }
 */
export function QuestionDrawer({ open, onClose, onSave, initialQuestion }) {
  const isEdit = Boolean(initialQuestion?.id);

  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("EASY");
  const [tags, setTags] = useState("fundamentals");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answerIndex, setAnswerIndex] = useState(0);

  // Prefill when editing
  useEffect(() => {
    if (!open) return;

    if (initialQuestion) {
      setText(initialQuestion.text || "");
      setDifficulty(initialQuestion.difficulty || "EASY");
      setTags((initialQuestion.tags || []).join(", "));
      const opts = Array.isArray(initialQuestion.options)
        ? initialQuestion.options
        : [];
      setOptions([opts[0] || "", opts[1] || "", opts[2] || "", opts[3] || ""]);
      setAnswerIndex(
        Number.isFinite(initialQuestion.answerIndex)
          ? Number(initialQuestion.answerIndex)
          : 0,
      );
      return;
    }

    // create mode reset
    setText("");
    setDifficulty("EASY");
    setTags("fundamentals");
    setOptions(["", "", "", ""]);
    setAnswerIndex(0);
  }, [open, initialQuestion]);

  const errors = useMemo(() => {
    const e = {};
    if (!text.trim()) e.text = "Question text is required.";

    const cleanOpts = options.map((o) => (o || "").trim());
    if (cleanOpts.filter(Boolean).length < 2)
      e.options = "Provide at least 2 answer options.";

    const ai = Number(answerIndex);
    if (!Number.isFinite(ai) || ai < 0 || ai > 3)
      e.answerIndex = "Pick a correct answer.";
    if (!cleanOpts[ai]) e.answerIndex = "Correct answer must not be empty.";

    return e;
  }, [text, options, answerIndex]);

  const canSave = Object.keys(errors).length === 0;

  function setOpt(i, v) {
    setOptions((prev) => {
      const xs = [...prev];
      xs[i] = v;
      return xs;
    });
  }

  function handleSave() {
    if (!canSave) return;

    const payload = {
      // include ids for edit mode
      id: initialQuestion?.id,
      trainingId: initialQuestion?.trainingId,

      text: text.trim(),
      difficulty,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      options: options.map((o) => (o || "").trim()),
      answerIndex: Number(answerIndex),
    };

    onSave?.(payload);
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Question" : "Create Question"}
      subtitle={
        isEdit
          ? "Update MCQ options and correct answer"
          : "Add a reusable MCQ to the question bank"
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-semibold text-white",
              canSave
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-slate-300 cursor-not-allowed",
            )}
            type="button"
          >
            {isEdit ? "Save Changes" : "Save Question"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Question text" error={errors.text}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            placeholder="Type the question here..."
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Difficulty">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            >
              {DIFFICULTY.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tags (comma separated)">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              placeholder="fundamentals, incident, breach"
            />
          </Field>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">Answer options</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Provide up to 4 options. Choose the correct answer.
          </div>

          {errors.options ? (
            <div className="mt-2 text-sm font-semibold text-rose-600">
              {errors.options}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {options.map((o, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 md:flex-row md:items-center"
              >
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="correct"
                    checked={Number(answerIndex) === i}
                    onChange={() => setAnswerIndex(i)}
                  />
                  Correct
                </label>

                <input
                  value={o}
                  onChange={(e) => setOpt(i, e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder={`Option ${i + 1}`}
                />
              </div>
            ))}

            {errors.answerIndex ? (
              <div className="text-sm font-semibold text-rose-600">
                {errors.answerIndex}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
