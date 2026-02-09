import { api } from "./http";

// Dashboard
export async function getAdminSummary() {
  return api("/admin/dashboard/summary");
}
export async function getGapSummary() {
  return api("/admin/gap/summary");
}

// ---------------- DPIA ----------------

// list
export async function listDpia(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api(qs ? `/admin/dpia?${qs}` : "/admin/dpia");
}

// create
export async function createDpia(payload) {
  return api("/admin/dpia", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// get by id
export async function getDpia(id) {
  return api(`/admin/dpia/${id}`);
}

// save step
export async function saveDpiaStep(id, stepKey, payload) {
  return api(`/admin/dpia/${id}/step/${stepKey}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// submit
export async function submitDpia(id) {
  return api(`/admin/dpia/${id}/submit`, {
    method: "POST",
  });
}
