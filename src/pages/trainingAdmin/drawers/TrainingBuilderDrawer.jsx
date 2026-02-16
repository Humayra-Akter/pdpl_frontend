import { useEffect, useMemo, useState } from "react";
import { Drawer, Field } from "../ui/atoms";
import { cn } from "../utils";
import { CONTENT_TYPES } from "../constants";

export function TrainingBuilderDrawer({
  open,
  training,
  onClose,
  onSave,
  onRequestApproval,
}) {
  const [local, setLocal] = useState(null);

  useEffect(() => {
    if (open) {
      setLocal(training ? JSON.parse(JSON.stringify(training)) : null);
    }
  }, [open, training]);

  const errors = useMemo(() => {
    const e = {};
    if (!local) return e;

    if (!local.title?.trim()) e.title = "Title is required.";
    if (!Number(local.validityDays) || Number(local.validityDays) <= 0)
      e.validityDays = "Validity must be > 0 days.";
    if (!local.dueAt) e.dueAt = "Due date is required.";

    // modules
    if (!Array.isArray(local.modules) || local.modules.length === 0) {
      e.modules = "At least one module is required.";
    } else {
      local.modules.forEach((m, idx) => {
        if (!m.title?.trim()) e[`m_title_${idx}`] = "Module title is required.";
        if (!m.contentType) e[`m_type_${idx}`] = "Content type is required.";
      });
    }

    // quiz should exist (SG)
    if (!local.quiz) e.quiz = "Quiz config is required.";
    if (local.quiz) {
      if (
        !Number(local.quiz.questionCount) ||
        Number(local.quiz.questionCount) <= 0
      )
        e.questionCount = "Question count must be > 0.";
      if (
        Number(local.quiz.passScore) < 0 ||
        Number(local.quiz.passScore) > 100
      )
        e.passScore = "Pass score must be 0-100.";
      if (
        !Number(local.quiz.attemptsAllowed) ||
        Number(local.quiz.attemptsAllowed) <= 0
      )
        e.attemptsAllowed = "Attempts must be > 0.";
    }

    return e;
  }, [local]);

  const canSave = local && Object.keys(errors).length === 0;

  function patch(p) {
    setLocal((x) => ({ ...x, ...p }));
  }

  function patchQuiz(p) {
    setLocal((x) => ({ ...x, quiz: { ...(x?.quiz || {}), ...p } }));
  }

  function patchReminder(p) {
    setLocal((x) => ({ ...x, reminder: { ...(x?.reminder || {}), ...p } }));
  }

  function updateModule(idx, patchM) {
    setLocal((x) => {
      const modules = [...(x?.modules || [])];
      modules[idx] = { ...modules[idx], ...patchM };
      return { ...x, modules };
    });
  }

  function addModule() {
    setLocal((x) => ({
      ...x,
      modules: [
        ...(x?.modules || []),
        {
          id: `m-${Math.random().toString(16).slice(2)}`,
          title: `New module`,
          contentType: "DOC",
          required: true,
        },
      ],
    }));
  }

  function removeModule(idx) {
    setLocal((x) => {
      const modules = [...(x?.modules || [])];
      modules.splice(idx, 1);
      return { ...x, modules };
    });
  }

  function handleSave() {
    if (!canSave) return;
    onSave?.(local);
  }

  function handleRequestApproval() {
    if (!canSave) return;
    // Save first to ensure latest version persisted
    onSave?.(local);
    onRequestApproval?.();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Training Builder"
      subtitle={
        training
          ? `Edit: ${training.title}`
          : "Select a training from the Trainings tab"
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            type="button"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
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
              Save
            </button>

            <button
              onClick={handleRequestApproval}
              disabled={!canSave}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold text-white",
                canSave
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-slate-300 cursor-not-allowed",
              )}
              type="button"
            >
              Request DPO Approval
            </button>
          </div>
        </div>
      }
    >
      {!local ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="text-sm font-bold text-slate-900">
            No training selected
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Go to Trainings → click “Build”.
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" error={errors.title}>
              <input
                value={local.title || ""}
                onChange={(e) => patch({ title: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </Field>

            <Field label="Status">
              <input
                value={local.status || ""}
                readOnly
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"
              />
            </Field>

            <Field label="Validity (days)" error={errors.validityDays}>
              <input
                value={local.validityDays ?? ""}
                onChange={(e) => patch({ validityDays: e.target.value })}
                type="number"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </Field>

            <Field label="Due date" error={errors.dueAt}>
              <input
                value={
                  local.dueAt
                    ? new Date(local.dueAt).toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) =>
                  patch({ dueAt: new Date(e.target.value).toISOString() })
                }
                type="date"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </Field>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <div className="text-sm font-bold text-slate-900">Modules</div>
                <div className="mt-0.5 text-xs font-semibold text-slate-500">
                  Add content units (docs/links/assessment). Quiz should remain
                  mandatory.
                </div>
              </div>

              <button
                onClick={addModule}
                className="rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                type="button"
              >
                Add Module
              </button>
            </div>

            <div className="p-4 space-y-3">
              {errors.modules ? (
                <div className="text-sm font-semibold text-rose-600">
                  {errors.modules}
                </div>
              ) : null}

              {(local.modules || []).map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Field
                        label={`Module ${idx + 1} title`}
                        error={errors[`m_title_${idx}`]}
                      >
                        <input
                          value={m.title || ""}
                          onChange={(e) =>
                            updateModule(idx, { title: e.target.value })
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                        />
                      </Field>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <Field
                          label="Content type"
                          error={errors[`m_type_${idx}`]}
                        >
                          <select
                            value={m.contentType || ""}
                            onChange={(e) =>
                              updateModule(idx, { contentType: e.target.value })
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                          >
                            <option value="" disabled>
                              Select...
                            </option>
                            {CONTENT_TYPES.map((ct) => (
                              <option key={ct.key} value={ct.key}>
                                {ct.label}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <div className="flex items-end justify-between gap-3">
                          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={Boolean(m.required)}
                              onChange={(e) =>
                                updateModule(idx, {
                                  required: e.target.checked,
                                })
                              }
                            />
                            Required
                          </label>

                          <button
                            onClick={() => removeModule(idx)}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!local.modules?.length ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <div className="text-sm font-bold text-slate-900">
                    No modules yet
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-600">
                    Add at least one module.
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">Quiz</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">
              Keep quiz mandatory for trainings (SG).
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Question count" error={errors.questionCount}>
                <input
                  value={local.quiz?.questionCount ?? ""}
                  onChange={(e) =>
                    patchQuiz({ questionCount: Number(e.target.value) })
                  }
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <Field label="Pass score (%)" error={errors.passScore}>
                <input
                  value={local.quiz?.passScore ?? ""}
                  onChange={(e) =>
                    patchQuiz({ passScore: Number(e.target.value) })
                  }
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <Field label="Attempts allowed" error={errors.attemptsAllowed}>
                <input
                  value={local.quiz?.attemptsAllowed ?? ""}
                  onChange={(e) =>
                    patchQuiz({ attemptsAllowed: Number(e.target.value) })
                  }
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">Reminders</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">
              Configure training-level reminder cadence.
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Enabled">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(local.reminder?.enabled)}
                    onChange={(e) =>
                      patchReminder({ enabled: e.target.checked })
                    }
                  />
                  Turn on reminders
                </label>
              </Field>

              <Field label="CC DPO on overdue">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(local.reminder?.ccDpoOnOverdue)}
                    onChange={(e) =>
                      patchReminder({ ccDpoOnOverdue: e.target.checked })
                    }
                  />
                  CC DPO
                </label>
              </Field>

              <Field label="Reminder every (days)">
                <input
                  value={local.reminder?.everyDays ?? ""}
                  onChange={(e) =>
                    patchReminder({ everyDays: Number(e.target.value) })
                  }
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <Field label="Notify before due (days)">
                <input
                  value={local.reminder?.beforeDueDays ?? ""}
                  onChange={(e) =>
                    patchReminder({ beforeDueDays: Number(e.target.value) })
                  }
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>

              <Field label="Overdue reminder every (days)">
                <input
                  value={local.reminder?.overdueEveryDays ?? ""}
                  onChange={(e) =>
                    patchReminder({ overdueEveryDays: Number(e.target.value) })
                  }
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </Field>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
