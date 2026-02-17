import { Card, SectionTitle } from "../ui/atoms";

export function AuditPanel({ audit }) {
  return (
    <Card>
      <SectionTitle
        title="Audit Trail"
        subtitle="Who created, who assigned, completions, quiz results, notifications"
      />

      <div className="p-5">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-bold text-slate-600">
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Meta</th>
              </tr>
            </thead>

            <tbody>
              {audit.length ? (
                audit.map((l) => (
                  <tr
                    key={l.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {new Date(l.ts).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">
                      {l.actor}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {l.action}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {l.meta}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-10">
                    <div className="text-sm font-bold text-slate-900">
                      No audit records
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-600">
                      Audit events will appear here.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">Export</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Export should include: training definitions, assignment list,
            completion and quiz score per user, notification logs, and
            approvals.
          </div>
        </div>
      </div>
    </Card>
  );
}
