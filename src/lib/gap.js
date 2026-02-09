import { api } from "./http";

export function getGapSummary() {
  return api("/admin/gap/summary");
}

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
