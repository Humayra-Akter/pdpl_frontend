import { useEffect, useMemo, useState } from "react";
import { Drawer, Field } from "../ui/atoms";
import { cn } from "../utils";

/**
 * SG rule enforced here:
 * - Assignment scope is "Entire Organization" (mandatory)
 * - You can wire API later; for now it produces new assignments in one shot
 */
export function AssignTrainingDrawer({
  open,
  training,
  users,
  assignments,
  onClose,
  onAssign,
}) {
  const [dueAt, setDueAt] = useState("");

  useEffect(() => {
    if (!open) return;
    if (training?.dueAt) {
      setDueAt(new Date(training.dueAt).toISOString().slice(0, 10));
    } else {
      const d = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
      setDueAt(d.toISOString().slice(0, 10));
    }
  }, [open, training]);

  const existingIds = useMemo(() => {
    if (!training) return new Set();
    return new Set(
      assignments
        .filter((a) => a.trainingId === training.id)
        .map((a) => a.userId),
    );
  }, [assignments, training]);

  const preview = useMemo(() => {
    if (!training) return [];
    return (users || []).map((u) => ({
      user: u,
      alreadyAssigned: existingIds.has(u.id),
    }));
  }, [users, existingIds, training]);

  const canAssign = Boolean(training?.id) && Boolean(dueAt);

  function buildAssignments() {
    const now = new Date().toISOString();
    const tId = training.id;

    // keep assignments for other trainings; replace this training assignments with org-wide set
    const other = (assignments || []).filter((a) => a.trainingId !== tId);

    const next = (users || [])
      .filter((u) => u.role !== "DPO") // optional: exclude DPO from training
      .map((u) => ({
        id: `a-${Math.random().toString(16).slice(2)}`,
        trainingId: tId,
        userId: u.id,
        status: "NOT_STARTED",
        score: null,
        completedAt: null,
        createdAt: now,
      }));

    return [...other, ...next];
  }

  function handleAssign() {
    if (!canAssign) return;

    const newAssignments = buildAssignments();
    const dueIso = new Date(dueAt).toISOString();
    onAssign?.(newAssignments, dueIso);
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Assign Training"
      subtitle={
        training
          ? `Assign “${training.title}” to entire organization`
          : "Select a training first"
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={handleAssign}
            disabled={!canAssign}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-semibold text-white",
              canAssign
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-slate-300 cursor-not-allowed",
            )}
            type="button"
          >
            Assign to Entire Org
          </button>
        </div>
      }
    >
      {!training ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="text-sm font-bold text-slate-900">
            No training selected
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Go to Trainings → click “Assign”.
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">Policy</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">
              Assignment scope is fixed to{" "}
              <span className="font-bold">Entire Organization</span>{" "}
              (mandatory).
            </div>
          </div>

          <Field label="Due date (applies to all assignees)">
            <input
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
          </Field>

          <div className="rounded-3xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-bold text-slate-900">
                Preview assignees
              </div>
              <div className="mt-0.5 text-xs font-semibold text-slate-500">
                Shows who will be assigned. Existing assignments will be
                replaced for this training (single source of truth).
              </div>
            </div>

            <div className="max-h-[340px] overflow-auto p-4">
              <div className="space-y-2">
                {preview.map((p) => (
                  <div
                    key={p.user.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {p.user.name}
                      </div>
                      <div className="text-xs font-semibold text-slate-600">
                        {p.user.dept} • {p.user.role}
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                        p.alreadyAssigned
                          ? "bg-amber-100 text-amber-900 ring-amber-200"
                          : "bg-emerald-100 text-emerald-900 ring-emerald-200",
                      )}
                    >
                      {p.alreadyAssigned ? "Was assigned" : "Will assign"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
