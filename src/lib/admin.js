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

// delete
export async function deleteDpia(id) {
  return api(`/admin/dpia/${id}`, {
    method: "DELETE",
  });
}

// ---------------- ROPA ----------------

// list
export async function listRopa(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api(qs ? `/admin/ropa?${qs}` : "/admin/ropa");
}

// summary cards
export async function getRopaSummary(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api(qs ? `/admin/ropa/summary?${qs}` : "/admin/ropa/summary");
}

// create
export async function createRopa(payload) {
  return api("/admin/ropa", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// get by id
export async function getRopa(id) {
  return api(`/admin/ropa/${id}`);
}

// update meta (title etc.)
export async function updateRopa(id, payload) {
  return api(`/admin/ropa/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// save step
export async function saveRopaStep(id, stepKey, payload) {
  return api(`/admin/ropa/${id}/step/${stepKey}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// submit
export async function submitRopa(id) {
  return api(`/admin/ropa/${id}/submit`, {
    method: "POST",
  });
}

// approve
export async function approveRopa(id) {
  return api(`/admin/ropa/${id}/approve`, {
    method: "POST",
  });
}

// reject
export async function rejectRopa(id, reason) {
  return api(`/admin/ropa/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// delete (soft delete)
export async function deleteRopa(id) {
  return api(`/admin/ropa/${id}`, {
    method: "DELETE",
  });
}

// ---------------- INCIDENTS ----------------

// summary
export async function getIncidentSummary() {
  return api("/admin/incidents/summary");
}

// list
export async function listIncidents(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api(qs ? `/admin/incidents?${qs}` : "/admin/incidents");
}

// create
export async function createIncident(payload) {
  return api("/admin/incidents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// get by id
export async function getIncident(id) {
  return api(`/admin/incidents/${id}`);
}

// update (patch)
export async function updateIncident(id, patch) {
  return api(`/admin/incidents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// close
export async function closeIncident(id) {
  return api(`/admin/incidents/${id}/close`, {
    method: "POST",
  });
}

// delete
export async function deleteIncident(id) {
  return api(`/admin/incidents/${id}`, {
    method: "DELETE",
  });
}

// comments
export async function listIncidentComments(id) {
  return api(`/admin/incidents/${id}/comments`);
}
export async function addIncidentComment(id, payload) {
  return api(`/admin/incidents/${id}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
