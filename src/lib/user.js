// src/lib/user.js
import { api } from "./http";

async function safe(path, options) {
  try {
    const data = await api(path, options);
    return { ok: true, data, missing: false, status: 200, error: null };
  } catch (err) {
    const msg = String(err?.message || "Request failed");
    const status = err?.status ?? 0;

    // fallback “missing” detection when status is not available
    const missing =
      status === 404 ||
      status === 501 ||
      /route not found/i.test(msg) ||
      /not found/i.test(msg) ||
      /endpoint missing/i.test(msg);

    return {
      ok: false,
      data: null,
      missing,
      status,
      error: { message: msg, status },
    };
  }
}

// Dashboard
export function getMySummary(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return safe(qs ? `/user/summary?${qs}` : `/user/summary`);
}
export function listMyActivity(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return safe(qs ? `/user/activity?${qs}` : `/user/activity`);
}

// Cases
export function listMyCases(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return safe(qs ? `/user/cases?${qs}` : `/user/cases`);
}
export function getMyCase(id) {
  return safe(`/user/cases/${id}`);
}
export function createMyCase(payload) {
  return safe(`/user/cases`, { method: "POST", body: JSON.stringify(payload) });
}

// Comments (optional)
export function listCaseComments(caseId) {
  return safe(`/user/cases/${caseId}/comments`);
}
export function addCaseComment(caseId, payload) {
  return safe(`/user/cases/${caseId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Attachments (optional placeholder)
export function listCaseAttachments(caseId) {
  return safe(`/user/cases/${caseId}/attachments`);
}

export function uploadCaseAttachments(
  caseId,
  files,
  category = "USER_ATTACHMENT",
) {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  fd.append("category", category);

  return safe(`/user/cases/${caseId}/attachments`, {
    method: "POST",
    body: fd,
  });
}



// Training
export function listMyTrainings(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return safe(qs ? `/user/training?${qs}` : `/user/training`);
}

// Profile
export function getMyProfile() {
  return safe(`/user/me`);
}
export function changeMyPassword(payload) {
  return safe(`/user/change-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
