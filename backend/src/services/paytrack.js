const PAYTRACK_API_URL =
  process.env.PAYTRACK_API_URL || "http://localhost:8000";

export async function generateReminder({ name, amount, days, language, tone }) {
  const res = await fetch(`${PAYTRACK_API_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, amount, days, language, tone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(`PayTrackAI API error ${res.status}: ${err.detail}`);
  }
  return res.json();
}

export async function healthCheck() {
  try {
    const res = await fetch(`${PAYTRACK_API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
