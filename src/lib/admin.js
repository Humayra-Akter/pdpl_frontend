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
// audit
export async function listIncidentAudit(id) {
  return api(`/admin/incidents/${id}/audit`);
}


// ---------------- VENDOR CHECKLIST ----------------

export async function listVendor(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api(qs ? `/admin/vendor?${qs}` : "/admin/vendor");
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

// ---------------- TRAINING ----------------

// list trainings (admin/dpo)
export async function listTraining(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api(qs ? `/admin/training?${qs}` : "/admin/training");
}

// create training (admin)
export async function createTraining(payload) {
  return api("/admin/training", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// get by id
export async function getTraining(id) {
  return api(`/admin/training/${id}`);
}

// update meta
export async function updateTraining(id, payload) {
  return api(`/admin/training/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// workflow
export async function submitTrainingForApproval(id) {
  return api(`/admin/training/${id}/submit`, { method: "POST" });
}

export async function approveTraining(id) {
  return api(`/admin/training/${id}/approve`, { method: "POST" });
}

export async function publishTraining(id) {
  return api(`/admin/training/${id}/publish`, { method: "POST" });
}

export async function archiveTraining(id) {
  return api(`/admin/training/${id}/archive`, { method: "POST" });
}

// modules
export async function addTrainingModule(id, payload) {
  return api(`/admin/training/${id}/modules`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export async function updateTrainingModule(id, moduleId, payload) {
  return api(`/admin/training/${id}/modules/${moduleId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export async function deleteTrainingModule(id, moduleId) {
  return api(`/admin/training/${id}/modules/${moduleId}`, { method: "DELETE" });
}

// questions
export async function addTrainingQuestion(id, payload) {
  return api(`/admin/training/${id}/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export async function updateTrainingQuestion(id, questionId, payload) {
  return api(`/admin/training/${id}/questions/${questionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export async function deleteTrainingQuestion(id, questionId) {
  return api(`/admin/training/${id}/questions/${questionId}`, { method: "DELETE" });
}

// assign to entire org
export async function assignTrainingAll(id) {
  return api(`/admin/training/${id}/assign-all`, { method: "POST" });
}

// assignments list (admin/dpo)
export async function listTrainingAssignments(id, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api(qs ? `/admin/training/${id}/assignments?${qs}` : `/admin/training/${id}/assignments`);
}

// user actions (still under /admin routes in this design)
export async function startTrainingAssignment(trainingId, assignmentId) {
  return api(`/admin/training/${trainingId}/assignment/${assignmentId}/start`, { method: "POST" });
}

export async function submitTrainingQuiz(trainingId, assignmentId, payload) {
  return api(`/admin/training/${trainingId}/assignment/${assignmentId}/submit-quiz`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
