const API_BASE = "/api/v1";

export async function fetchCommunities(params = {}) {
  const query = new URLSearchParams();
  if (params.risk_tier) query.append("risk_tier", params.risk_tier);
  if (params.min_silent_need) query.append("min_silent_need", params.min_silent_need);
  if (params.search) query.append("search", params.search);
  if (params.anomaly_only) query.append("anomaly_only", params.anomaly_only);

  const res = await fetch(`${API_BASE}/communities?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch communities");
  return res.json();
}

export async function fetchCommunityDetail(id) {
  const res = await fetch(`${API_BASE}/communities/${id}`);
  if (!res.ok) throw new Error("Failed to fetch community detail");
  return res.json();
}

export async function createCommunity(payload) {
  const res = await fetch(`${API_BASE}/communities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to create community");
  return res.json();
}

export async function addCommunityIndicator(communityId, indicatorPayload) {
  const res = await fetch(`${API_BASE}/communities/${communityId}/indicators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...indicatorPayload, community_id: communityId })
  });
  if (!res.ok) throw new Error("Failed to record indicator");
  return res.json();
}

export async function fetchAnomalies() {
  const res = await fetch(`${API_BASE}/predictions/anomalies`);
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  return res.json();
}

export async function fetchComplaintGapMatrix() {
  const res = await fetch(`${API_BASE}/predictions/complaint-gap-matrix`);
  if (!res.ok) throw new Error("Failed to fetch gap matrix");
  return res.json();
}

export async function evaluateRawPayload(payload) {
  const res = await fetch(`${API_BASE}/predictions/evaluate-raw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to evaluate raw payload");
  return res.json();
}

export async function fetchInterventions(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.sector) query.append("sector", params.sector);
  if (params.priority) query.append("priority", params.priority);

  const res = await fetch(`${API_BASE}/interventions?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch interventions");
  return res.json();
}

export async function createIntervention(payload) {
  const res = await fetch(`${API_BASE}/interventions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to create intervention");
  return res.json();
}

export async function updateIntervention(id, payload) {
  const res = await fetch(`${API_BASE}/interventions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to update intervention");
  return res.json();
}

export async function fetchInterventionsSummary() {
  const res = await fetch(`${API_BASE}/interventions/summary`);
  if (!res.ok) throw new Error("Failed to fetch interventions summary");
  return res.json();
}

export async function runSimulation(payload) {
  const res = await fetch(`${API_BASE}/simulation/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to run simulation");
  return res.json();
}

export async function fetchAnalyticsOverview() {
  const res = await fetch(`${API_BASE}/analytics/overview`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function fetchCommunityOSM(communityId) {
  const res = await fetch(`${API_BASE}/osm/community/${communityId}`);
  if (!res.ok) throw new Error("Failed to fetch community OSM data");
  return res.json();
}

export async function fetchCityOSMAudit() {
  const res = await fetch(`${API_BASE}/osm/city-infrastructure-audit`);
  if (!res.ok) throw new Error("Failed to fetch city OSM audit");
  return res.json();
}

