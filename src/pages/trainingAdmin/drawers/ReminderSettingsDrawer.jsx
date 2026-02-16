import { useState } from "react";
import { Drawer, Field } from "../ui/atoms";
import { cn } from "../utils";

/**
 * This is "global rules" UI (as your right panel says).
 * Wire to backend later. For now it collects values and calls onSave().
 */
export function ReminderSettingsDrawer({ open, onClose, onSave }) {
  const [singleActiveTraining, setSingleActiveTraining] = useState(true);
  const [escalateOverdueToDpo, setEscalateOverdueToDpo] = useState(true);
  const [defaultBeforeDueDays, setDefaultBeforeDueDays] = useState(7);
  const [defaultEveryDays, setDefaultEveryDays] = useState(3);
  const [defaultOverdueEveryDays, setDefaultOverdueEveryDays] = useState(2);

  function handleSave() {
    onSave?.({
      singleActiveTraining,
      escalateOverdueToDpo,
      defaultBeforeDueDays: Number(defaultBeforeDueDays),
      defaultEveryDays: Number(defaultEveryDays),
      defaultOverdueEveryDays: Number(defaultOverdueEveryDays),
    });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Rules & Reminders"
      subtitle="Configure global policies and reminder defaults"
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
            className={cn(
              "rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700",
            )}
            type="button"
          >
            Save Settings
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">Policy rules</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            These reflect your SG answers (org-wide mandatory, avoid multiple
            concurrent trainings, DPO escalation).
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <input
                type="checkbox"
                checked={singleActiveTraining}
                onChange={(e) => setSingleActiveTraining(e.target.checked)}
              />
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Enforce single active training at a time
                </div>
                <div className="mt-0.5 text-sm font-semibold text-slate-600">
                  Prevent assigning multiple trainings concurrently to users.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <input
                type="checkbox"
                checked={escalateOverdueToDpo}
                onChange={(e) => setEscalateOverdueToDpo(e.target.checked)}
              />
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Escalate overdue to DPO
                </div>
                <div className="mt-0.5 text-sm font-semibold text-slate-600">
                  Overdue reminders should also notify the DPO.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-bold text-slate-900">
            Default reminder cadence
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Used when creating new trainings (can be overridden per training).
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Notify before due (days)">
              <input
                value={defaultBeforeDueDays}
                onChange={(e) => setDefaultBeforeDueDays(e.target.value)}
                type="number"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </Field>

            <Field label="Reminder every (days)">
              <input
                value={defaultEveryDays}
                onChange={(e) => setDefaultEveryDays(e.target.value)}
                type="number"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </Field>

            <Field label="Overdue reminder every (days)">
              <input
                value={defaultOverdueEveryDays}
                onChange={(e) => setDefaultOverdueEveryDays(e.target.value)}
                type="number"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </Field>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
