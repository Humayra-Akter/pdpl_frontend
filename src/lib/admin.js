import { api } from "./http";

function toQuery(params = {}) {
  const clean = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (!s || s === "undefined" || s === "null") continue;
    clean[k] = s;
  }
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : "";
}

// ------------------------------------------
// ---------------- DASHBOARD ----------------
// ------------------------------------------

export async function getAdminSummary() {
  return api("/admin/dashboard/summary");
}

export async function getGapSummary() {
  return api("/admin/gap/summary");
}

// ------------------------------------------
// ------------------ GAP ------------------
// ------------------------------------------

export function listGapAssessments({
  page = 1,
  pageSize = 20,
  status = "",
} = {}) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (status) qs.set("status", status);
  return api(`/admin/gap-assessments?${qs.toString()}`);
}

export function createGapAssessment(payload) {
  return api("/admin/gap-assessments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getGapAssessmentById(id) {
  return api(`/admin/gap-assessments/${id}`);
}

export function updateGapAssessment(id, payload) {
  return api(`/admin/gap-assessments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ------------------------------------------
// ------------------ DPIA ------------------
// ------------------------------------------

export async function listDpia(params = {}) {
  return api(`/admin/dpia${toQuery(params)}`);
}

export async function createDpia(payload) {
  return api("/admin/dpia", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDpia(id) {
  return api(`/admin/dpia/${id}`);
}

export async function saveDpiaStep(id, stepKey, payload) {
  return api(`/admin/dpia/${id}/step/${stepKey}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function submitDpia(id) {
  return api(`/admin/dpia/${id}/submit`, {
    method: "POST",
  });
}

export async function deleteDpia(id) {
  return api(`/admin/dpia/${id}`, {
    method: "DELETE",
  });
}

// ------------------------------------------
// ------------------ ROPA ------------------
// ------------------------------------------

export async function listRopa(params = {}) {
  return api(`/admin/ropa${toQuery(params)}`);
}

export async function getRopaSummary(params = {}) {
  return api(`/admin/ropa/summary${toQuery(params)}`);
}

export async function createRopa(payload) {
  return api("/admin/ropa", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRopa(id) {
  return api(`/admin/ropa/${id}`);
}

export async function updateRopa(id, payload) {
  return api(`/admin/ropa/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function saveRopaStep(id, stepKey, payload) {
  return api(`/admin/ropa/${id}/step/${stepKey}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function submitRopa(id) {
  return api(`/admin/ropa/${id}/submit`, {
    method: "POST",
  });
}

export async function approveRopa(id) {
  return api(`/admin/ropa/${id}/approve`, {
    method: "POST",
  });
}

export async function rejectRopa(id, reason) {
  return api(`/admin/ropa/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function deleteRopa(id) {
  return api(`/admin/ropa/${id}`, {
    method: "DELETE",
  });
}

// -------------------------------------------
// ---------------- INCIDENTS ----------------
// -------------------------------------------

export async function getIncidentSummary() {
  return api("/admin/incidents/summary");
}

export async function listIncidents(params = {}) {
  return api(`/admin/incidents${toQuery(params)}`);
}

export async function createIncident(payload) {
  return api("/admin/incidents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getIncident(id) {
  return api(`/admin/incidents/${id}`);
}

export async function updateIncident(id, patch) {
  return api(`/admin/incidents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function closeIncident(id) {
  return api(`/admin/incidents/${id}/close`, {
    method: "POST",
  });
}

export async function deleteIncident(id) {
  return api(`/admin/incidents/${id}`, {
    method: "DELETE",
  });
}

export async function listIncidentComments(id) {
  return api(`/admin/incidents/${id}/comments`);
}

export async function addIncidentComment(id, payload) {
  return api(`/admin/incidents/${id}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listIncidentAudit(id) {
  return api(`/admin/incidents/${id}/audit`);
}

// -------------------------------------------------
// ---------------- VENDOR CHECKLIST ----------------
// --------------------------------------------------

export async function listVendor(params = {}) {
  return api(`/admin/vendor${toQuery(params)}`);
}

export async function createVendor(payload) {
  return api("/admin/vendor", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getVendor(id) {
  return api(`/admin/vendor/${id}`);
}

export async function saveVendorStep(id, stepKey, payload) {
  return api(`/admin/vendor/${id}/step/${stepKey}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function submitVendor(id) {
  return api(`/admin/vendor/${id}/submit`, { method: "POST" });
}

// ------------------------------------------
// ---------------- TRAINING ----------------
// ------------------------------------------

export function listTrainings(params = {}) {
  return api(`/admin/training${toQuery(params)}`);
}

export function createTraining(payload) {
  return api(`/admin/training`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTraining(id) {
  return api(`/admin/training/${id}`);
}

export function updateTraining(id, payload) {
  return api(`/admin/training/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function submitTraining(id) {
  return api(`/admin/training/${id}/submit`, { method: "POST" });
}

export function approveTraining(id) {
  return api(`/admin/training/${id}/approve`, { method: "POST" });
}

export function publishTraining(id) {
  return api(`/admin/training/${id}/publish`, { method: "POST" });
}

export function archiveTraining(id) {
  return api(`/admin/training/${id}/archive`, { method: "POST" });
}

export function addTrainingModule(trainingId, payload) {
  return api(`/admin/training/${trainingId}/modules`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTrainingModule(trainingId, moduleId, payload) {
  return api(`/admin/training/${trainingId}/modules/${moduleId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTrainingModule(trainingId, moduleId) {
  return api(`/admin/training/${trainingId}/modules/${moduleId}`, {
    method: "DELETE",
  });
}

export function deleteTraining(id) {
  return api(`/admin/training/${id}`, { method: "DELETE" });
}

export function addTrainingQuestion(trainingId, payload) {
  return api(`/admin/training/${trainingId}/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTrainingQuestion(trainingId, questionId, payload) {
  return api(`/admin/training/${trainingId}/questions/${questionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTrainingQuestion(trainingId, questionId) {
  return api(`/admin/training/${trainingId}/questions/${questionId}`, {
    method: "DELETE",
  });
}

export function assignTrainingAll(trainingId) {
  return api(`/admin/training/${trainingId}/assign-all`, { method: "POST" });
}

export function listTrainingAssignments(trainingId, params = {}) {
  return api(`/admin/training/${trainingId}/assignments${toQuery(params)}`);
}

// ----------------------------------------
// ------------------ USERS ----------------
// ----------------------------------------

export async function listUsers(params = {}) {
  return api(`/admin/users${toQuery(params)}`);
}

export async function getUser(id) {
  return api(`/admin/users/${id}`);
}

export async function createUser(payload) {
  return api("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id, patch) {
  return api(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function resetUserPassword(id) {
  return api(`/admin/users/${id}/reset-password`, {
    method: "POST",
  });
}

export async function activateUser(id) {
  return api(`/admin/users/${id}/activate`, {
    method: "POST",
  });
}

export async function deactivateUser(id) {
  return api(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

export async function usersSummary() {
  return api("/admin/users/summary");
}
