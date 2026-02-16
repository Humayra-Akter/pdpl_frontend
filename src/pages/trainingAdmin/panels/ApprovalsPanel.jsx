import {
  ClipboardList,
  ShieldCheck,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Card, SectionTitle } from "../ui/atoms";
import { cn, pillTone, formatDate } from "../utils";

export function ApprovalsPanel({
  trainings,
  onApprove,
  onReject,
  onOpenBuilder,
}) {
  const pending = trainings.filter((t) => t.status === "PENDING_DPO_APPROVAL");

  return (
    <Card>
      <SectionTitle
        title="DPO Approval Queue"
        subtitle="Trainings must be approved by DPO before publishing"
      />

      <div className="space-y-4 p-5">
        {pending.length ? (
          pending.map((t) => (
            <div
              key={t.id}
              className="rounded-3xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {t.title}
                  </div>

                  <div className="mt-1 text-sm font-semibold text-slate-600">
                    Created by: {t.createdBy} • Due: {formatDate(t.dueAt)} •
                    Validity: {t.validityDays} days
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                        pillTone(t.status),
                      )}
                    >
                      {t.status}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      <ClipboardList className="h-4 w-4" />
                      Modules: {t.modules?.length || 0}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      <ShieldCheck className="h-4 w-4" />
                      Quiz: {t.quiz?.questionCount || 0} Qs • Pass{" "}
                      {t.quiz?.passScore || 0}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onOpenBuilder(t.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    type="button"
                  >
                    Review <ArrowUpRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onReject(t.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                    type="button"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => onApprove(t.id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    type="button"
                  >
                    Approve & Publish <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <div className="text-sm font-bold text-slate-900">
              No items pending approval
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-600">
              Draft trainings can be submitted for approval by Admin/DPO.
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-amber-50 via-white to-indigo-50 p-4">
          <div className="text-sm font-bold text-slate-900">Policy note</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Employees can start immediately after assignment (SG). Approval
            controls publishing only — not assignment scheduling.
          </div>
        </div>
      </div>
    </Card>
  );
}
