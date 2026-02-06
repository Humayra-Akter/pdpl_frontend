import { api } from "./http";

export async function getAdminSummary() {
  return api("/admin/dashboard/summary");
}
