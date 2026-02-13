// /components/TrainingKpis.jsx
export default function TrainingKpis({ ui, lucide, kpis, totalAssigned }) {
  const { KpiCard, formatDate } = ui;
  const { GraduationCap, Activity, ShieldAlert, ShieldCheck, ClipboardList } =
    lucide;

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <KpiCard
        title="COMPLETION RATE"
        value={`${kpis.completionRate}%`}
        hint={`${kpis.completed} completed • ${totalAssigned} assigned`}
        tone="indigo"
        icon={GraduationCap}
      />
      <KpiCard
        title="IN PROGRESS"
        value={kpis.inProgress}
        hint="Users currently taking training"
        tone="amber"
        icon={Activity}
      />
      <KpiCard
        title="OVERDUE"
        value={kpis.overdue}
        hint="Overdue alerts sent to DPO"
        tone="rose"
        icon={ShieldAlert}
      />
      <KpiCard
        title="AUDIT READY"
        value={kpis.auditReady ? "YES" : "NO"}
        hint={
          kpis.nextDueAt
            ? `Next due: ${formatDate(kpis.nextDueAt)}`
            : "No published training yet"
        }
        tone={kpis.auditReady ? "emerald" : "slate"}
        icon={kpis.auditReady ? ShieldCheck : ClipboardList}
      />
    </div>
  );
}
