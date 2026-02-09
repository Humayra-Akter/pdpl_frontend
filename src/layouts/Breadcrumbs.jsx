import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const labelMap = {
  admin: "Dashboard",
  gap: "PDPL Gap Assessment",
  dpia: "DPIA Assessment",
  ropa: "RoPA",
  incidents: "Incidents & Breach",
  policies: "Policies & Procedures",
  training: "Training",
  users: "User Management",
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean); // ["admin","gap","id"]

  // Only show inside admin area
  if (parts[0] !== "admin") return null;

  const crumbs = [];
  let current = "";
  for (let i = 0; i < parts.length; i++) {
    current += `/${parts[i]}`;

    // hide raw UUID as label
    const isId = i === 2 && parts[1] === "gap";
    const label = isId ? "Details" : labelMap[parts[i]] || parts[i];

    crumbs.push({ to: current, label, isLast: i === parts.length - 1 });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      {crumbs.map((c, idx) => (
        <div key={c.to} className="flex items-center gap-2">
          {idx > 0 ? <ChevronRight className="h-3 w-3" /> : null}
          {c.isLast ? (
            <span className="font-semibold text-slate-700">{c.label}</span>
          ) : (
            <Link to={c.to} className="hover:text-slate-800 hover:underline">
              {c.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
