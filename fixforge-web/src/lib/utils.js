export function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
