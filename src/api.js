const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? `${import.meta.env.BASE_URL}api` : "http://localhost:8080");

export async function generateTrust(payload) {
  const response = await fetch(`${API_BASE_URL}/generate-trust`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to generate trust package");
  return data;
}

export async function getIntakeAssist(payload) {
  const response = await fetch(`${API_BASE_URL}/intake-assist`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to create intake guidance");
  return data;
}

export async function saveIntakeDraft(payload) {
  const response = await fetch(`${API_BASE_URL}/intake-drafts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to save intake draft");
  return data;
}

export async function getOperationsBrief() {
  const response = await fetch(`${API_BASE_URL}/operations-brief`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load operations brief");
  return data;
}

export async function getLeadBrief(payload) {
  const response = await fetch(`${API_BASE_URL}/lead-brief`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to create lead brief");
  return data;
}

export async function startMaintenanceSubscription(payload) {
  const response = await fetch(`${API_BASE_URL}/checkout/maintenance`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to start maintenance checkout");
  return data;
}
