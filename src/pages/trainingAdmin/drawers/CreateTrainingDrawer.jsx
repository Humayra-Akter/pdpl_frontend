import { useMemo, useState } from "react";
import { Drawer, Field } from "../ui/atoms";
import { cn } from "../utils";

export function CreateTrainingDrawer({ open, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [validityDays, setValidityDays] = useState(365);
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    return d.toISOString().slice(0, 10);
  });

  const [quizEnabled, setQuizEnabled] = useState(true);
  const [questionCount, setQuestionCount] = useState(10);
  const [passScore, setPassScore] = useState(70);
  const [attemptsAllowed, setAttemptsAllowed] = useState(3);

  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [everyDays, setEveryDays] = useState(3);
  const [beforeDueDays, setBeforeDueDays] = useState(7);
  const [overdueEveryDays, setOverdueEveryDays] = useState(2);
  const [ccDpoOnOverdue, setCcDpoOnOverdue] = useState(true);

  const errors = useMemo(() => {
    const e = {};
    if (!title.trim()) e.title = "Training title is required.";
    if (!Number(validityDays) || Number(validityDays) <= 0)
      e.validityDays = "Validity must be a positive number.";
    if (!dueAt) e.dueAt = "Due date is required.";
    if (quizEnabled) {
      if (!Number(questionCount) || Number(questionCount) <= 0)
        e.questionCount = "Question count must be > 0.";
      if (Number(passScore) < 0 || Number(passScore) > 100)
        e.passScore = "Pass score must be between 0 and 100.";
      if (!Number(attemptsAllowed) || Number(attemptsAllowed) <= 0)
        e.attemptsAllowed = "Attempts must be > 0.";
    }
    if (remindersEnabled) {
      if (!Number(everyDays) || Number(everyDays) <= 0)
        e.everyDays = "Reminder cadence must be > 0 days.";
      if (Number(beforeDueDays) < 0)
        e.beforeDueDays = "Before due days must be >= 0.";
      if (!Number(overdueEveryDays) || Number(overdueEveryDays) <= 0)
        e.overdueEveryDays = "Overdue cadence must be > 0 days.";
    }
    return e;
  }, [
    title,
    validityDays,
    dueAt,
    quizEnabled,
    questionCount,
    passScore,
    attemptsAllowed,
    remindersEnabled,
    everyDays,
    beforeDueDays,
    overdueEveryDays,
  ]);

  const canSubmit = Object.keys(errors).length === 0;

  function reset() {
    setTitle("");
    setValidityDays(365);

    const d = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    setDueAt(d.toISOString().slice(0, 10));

    setQuizEnabled(true);
    setQuestionCount(10);
    setPassScore(70);
    setAttemptsAllowed(3);

    setRemindersEnabled(true);
    setEveryDays(3);
    setBeforeDueDays(7);
    setOverdueEveryDays(2);
    setCcDpoOnOverdue(true);
  }

  function handleClose() {
    onClose?.();
  }

  function handleCreate() {
    if (!canSubmit) return;

    const now = new Date().toISOString();
    const id = `t-${Math.random().toString(16).slice(2)}`;

    const training = {
      id,
      title: title.trim(),
      status: "DRAFT",
      validityDays: Number(validityDays),
      dueAt: new Date(dueAt).toISOString(),
      createdAt: now,
      createdBy: "Admin",
      approvedBy: null,
      modules: [
        {
          id: "m1",
          title: "Module 1 (add content)",
          contentType: "DOC",
          required: true,
        },
      ],
      quiz: quizEnabled
        ? {
            questionCount: Number(questionCount),
            passScore: Number(passScore),
            attemptsAllowed: Number(attemptsAllowed),
          }
        : { questionCount: 0, passScore: 0, attemptsAllowed: 0 },
      reminder: remindersEnabled
        ? {
            enabled: true,
            everyDays: Number(everyDays),
            beforeDueDays: Number(beforeDueDays),
            overdueEveryDays: Number(overdueEveryDays),
            ccDpoOnOverdue: Boolean(ccDpoOnOverdue),
          }
        : {
            enabled: false,
            everyDays: 0,
            beforeDueDays: 0,
            overdueEveryDays: 0,
            ccDpoOnOverdue: false,
          },
    };

    onCreate?.(training);
    reset();
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Create Training"
      subtitle="Start with a draft. Build modules, then request DPO approval."
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={reset}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            type="button"
          >
            Reset
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              type="button"
            >
              Cancel
            </button>

            <button
              onClick={handleCreate}
              disabled={!canSubmit}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold text-white",
                canSubmit
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-slate-300 cursor-not-allowed",
              )}
              type="button"
            >
              Create Draft
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Training title" error={errors.title}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            placeholder="e.g., PDPL Fundamentals 2025"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Validity (days)" error={errors.validityDays}>
            <input
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
          </Field>

          <Field label="Due date" error={errors.dueAt}>
            <input
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
          </Field>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Mandatory Quiz (SG)
              </div>
              <div className="mt-0.5 text-sm font-semibold text-slate-600">
                Every training should include an assessment quiz.
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={quizEnabled}
                onChange={(e) => setQuizEnabled(e.target.checked)}
              />
              Enabled
            </label>
          </div>

          {quizEnabled ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Question count" error={errors.questionCount}>
                <input
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <Field label="Pass score (%)" error={errors.passScore}>
                <input
                  value={passScore}
                  onChange={(e) => setPassScore(e.target.value)}
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <Field label="Attempts allowed" error={errors.attemptsAllowed}>
                <input
                  value={attemptsAllowed}
                  onChange={(e) => setAttemptsAllowed(e.target.value)}
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-slate-900">Reminders</div>
              <div className="mt-0.5 text-sm font-semibold text-slate-600">
                Configure basic reminder cadence for assignees and DPO.
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
              />
              Enabled
            </label>
          </div>

          {remindersEnabled ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Reminder every (days)" error={errors.everyDays}>
                <input
                  value={everyDays}
                  onChange={(e) => setEveryDays(e.target.value)}
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <Field
                label="Notify before due (days)"
                error={errors.beforeDueDays}
              >
                <input
                  value={beforeDueDays}
                  onChange={(e) => setBeforeDueDays(e.target.value)}
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <Field
                label="Overdue reminder every (days)"
                error={errors.overdueEveryDays}
              >
                <input
                  value={overdueEveryDays}
                  onChange={(e) => setOverdueEveryDays(e.target.value)}
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={ccDpoOnOverdue}
                    onChange={(e) => setCcDpoOnOverdue(e.target.checked)}
                  />
                  CC DPO on overdue
                </label>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Drawer>
  );
}
