const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://shy6565-fixforge-backend.hf.space";
const API_KEY = import.meta.env.VITE_EXT_KEY || "dev-key";

async function request(path, { method = "GET", body } = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { "Content-Type": "application/json", "x-api-key": API_KEY };
  const opts = {
    method,
    headers,
    body: body && method !== "GET" ? JSON.stringify(body) : undefined
  };
  const res = await fetch(url + (method === "GET" && body ? `?${new URLSearchParams(body)}` : ""), opts);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${t}`);
  }
  return res.json();
}

/* Bug submission and suggestions */
export function submitBug({ code, error, metadata } = {}) {
  return request("/submit", { method: "POST", body: { code, error, metadata } });
}

/* Post a solved bug / canonical solution */
export function submitSolution({ bug_text, code, solution_text, patch, tags = [] } = {}) {
  return request("/submit_solution", { method: "POST", body: { bug_text, code, solution_text, patch, tags } });
}

/* List bugs (dashboard) */
export function fetchBugs() {
  return request("/bugs");
}

/* Paginated fixes listing */
export function fetchFixes({ page = 1, page_size = 20, tag, language } = {}) {
  const q = new URLSearchParams({ page, page_size });
  if (tag) q.set("tag", tag);
  if (language) q.set("language", language);
  return request(`/fixes?${q.toString()}`, { method: "GET" });
}

/* Single fix */
export function fetchFix(fixId) {
  return request(`/fixes/${encodeURIComponent(fixId)}`, { method: "GET" });
}

/* Comments */
export function fetchComments(fixId) {
  return request(`/fixes/${encodeURIComponent(fixId)}/comments`, { method: "GET" });
}
export function postComment(fixId, { text } = {}) {
  return request(`/fixes/${encodeURIComponent(fixId)}/comments`, { method: "POST", body: { text } });
}

/* Voting and acceptance */
export function voteFix(fixId, vote = 1) {
  // endpoint accepts { fix_id, vote }
  return request("/vote", { method: "POST", body: { fix_id: fixId, vote } });
}
export function acceptFix(fixId) {
  return request(`/fixes/${encodeURIComponent(fixId)}/accept`, { method: "POST", body: {} });
}
