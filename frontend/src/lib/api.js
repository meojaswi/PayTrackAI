const defaultHeaders = {
  Accept: "application/json",
};

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload?.message
        ? payload.message
        : "Request failed.";

    throw new Error(message);
  }

  return payload;
}

export async function fetchDebtors() {
  const response = await fetch("/api/debtors", {
    headers: defaultHeaders,
  });

  return parseResponse(response);
}

export async function fetchImportSummary() {
  const response = await fetch("/api/debtors/import-summary", {
    headers: defaultHeaders,
  });

  return parseResponse(response);
}

export async function uploadDebtorSheet(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/debtors/upload", {
    method: "POST",
    body: formData,
  });

  return parseResponse(response);
}

export async function fetchDashboardData() {
  const response = await fetch("/api/dashboard", {
    headers: defaultHeaders,
  });

  return parseResponse(response);
}

export async function createDebtor(payload) {
  const response = await fetch("/api/debtors", {
    method: "POST",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function updateDebtor(id, payload) {
  const response = await fetch(`/api/debtors/${id}`, {
    method: "PATCH",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function deleteDebtor(id) {
  const response = await fetch(`/api/debtors/${id}`, {
    method: "DELETE",
    headers: defaultHeaders,
  });

  return parseResponse(response);
}

export async function fetchMessagesDashboard() {
  const response = await fetch("/api/messages", {
    headers: defaultHeaders,
  });

  return parseResponse(response);
}

export async function generateMessageDraft(payload) {
  const response = await fetch("/api/messages/draft", {
    method: "POST",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function saveMessageDraft(payload) {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: {
      ...defaultHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}
export const generateReminder = async ({
  name,
  amount,
  days,
  language,
  tone,
}) => {
  const res = await fetch("/api/reminders/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, amount, days, language, tone }),
  });
  if (!res.ok) throw new Error("Failed to generate reminder");
  return res.json(); // { success, message, language, tone }
};
