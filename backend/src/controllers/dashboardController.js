import Debtor from "../models/Debtor.js";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function daysBetween(dateA, dateB) {
  const oneDayInMs = 24 * 60 * 60 * 1000;
  return Math.floor((dateA.getTime() - dateB.getTime()) / oneDayInMs);
}

function getOverdueDays(debtor, now) {
  if (debtor.overdueDays > 0) {
    return debtor.overdueDays;
  }

  if (!debtor.dueDate) {
    return 0;
  }

  const dueDate = new Date(debtor.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return 0;
  }

  return Math.max(daysBetween(now, dueDate), 0);
}

function buildPriority(debtor, overdueDays) {
  if (overdueDays >= 7 || debtor.pendingAmount >= 50000) {
    return "High";
  }

  return "Medium";
}

function buildStatus(debtor, overdueDays, now) {
  if (debtor.status && debtor.status !== "New") {
    return debtor.status;
  }

  if (!debtor.dueDate) {
    return "New";
  }

  const dueDate = new Date(debtor.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return "New";
  }

  const dayDelta = daysBetween(now, dueDate);

  if (dayDelta > 0) {
    return "Overdue";
  }

  if (dayDelta === 0) {
    return "Due Today";
  }

  return overdueDays > 0 ? "Overdue" : "New";
}

function buildReminderSuggestion(debtor) {
  return `Hello ${debtor.name}, your pending payment of ${formatCurrency(
    debtor.pendingAmount,
  )} is due. Please share an update today.`;
}

function buildDebtorRow(debtor, now) {
  const overdueDays = getOverdueDays(debtor, now);
  const status = buildStatus(debtor, overdueDays, now);

  return {
    id: debtor._id,
    name: debtor.name,
    phone: debtor.phone,
    amount: formatCurrency(debtor.pendingAmount),
    pendingAmount: debtor.pendingAmount,
    dueDate: formatDate(debtor.dueDate),
    overdue: overdueDays,
    lastContact: formatDate(debtor.lastContact),
    language: debtor.language,
    status,
    followupDate: formatDate(debtor.followupDate),
  };
}

function buildDebtorProfile(debtor, row) {
  if (!debtor || !row) {
    return {
      name: "No debtor selected",
      owner: "Upload debtor data to view the profile.",
      amount: formatCurrency(0),
      dueDate: "-",
      phone: "-",
      language: "-",
      lastPayment: "No payment records yet",
      notes: "Notes will appear here when debtor details are expanded.",
      messages: ["Import a debtor sheet to populate the recent activity timeline."],
      suggestion: "Generate a reminder once debtors are available.",
    };
  }

  return {
    name: debtor.name,
    owner: debtor.name,
    amount: row.amount,
    dueDate: row.dueDate,
    phone: debtor.phone,
    language: debtor.language,
    lastPayment: "No payment records yet",
    notes: `Imported from ${debtor.sourceFile || "manual entry"}. Follow up based on current status: ${row.status}.`,
    messages: [
      `Last contact: ${row.lastContact}`,
      `Next follow-up: ${row.followupDate}`,
      `Current status: ${row.status}`,
    ],
    suggestion: buildReminderSuggestion(debtor),
  };
}

export async function getDashboardData(_request, response) {
  const debtors = await Debtor.find().sort({ pendingAmount: -1, createdAt: -1 }).lean();
  const now = new Date();

  const debtorRows = debtors.map((debtor) => buildDebtorRow(debtor, now));
  const totalPendingAmount = debtors.reduce(
    (sum, debtor) => sum + (debtor.pendingAmount || 0),
    0,
  );
  const followupsToday = debtors.filter((debtor) => {
    if (!debtor.followupDate) {
      return false;
    }

    const followupDate = new Date(debtor.followupDate);
    return !Number.isNaN(followupDate.getTime()) && followupDate.toDateString() === now.toDateString();
  }).length;
  const overdueCases = debtorRows.filter((debtor) => debtor.overdue > 0).length;
  const highPriorityCount = debtorRows.filter(
    (debtor) => debtor.overdue >= 7 || debtor.pendingAmount >= 50000,
  ).length;
  const noResponseCount = debtorRows.filter((debtor) => debtor.status === "No Response").length;

  const summaryCards = [
    {
      label: "Total Pending",
      value: formatCurrency(totalPendingAmount),
      note: `${debtors.length} debtor accounts in MongoDB`,
      theme: "slate",
    },
    {
      label: "Follow-ups Today",
      value: String(followupsToday),
      note: `${highPriorityCount} high-priority accounts`,
      theme: "amber",
    },
    {
      label: "Overdue Cases",
      value: String(overdueCases),
      note: "Need action within 24 hours",
      theme: "rose",
    },
    {
      label: "Collected This Week",
      value: formatCurrency(0),
      note: "Payments API not connected yet",
      theme: "emerald",
    },
  ];

  const followupQueue = debtorRows.slice(0, 5).map((debtor) => ({
    name: debtor.name,
    amount: debtor.amount,
    overdue: debtor.overdue > 0 ? `${debtor.overdue} days overdue` : "Due today",
    lastContact: debtor.lastContact,
    priority: buildPriority(debtor, debtor.overdue),
  }));

  const alerts = [
    `${followupsToday} customers need follow-up today`,
    `${highPriorityCount} high-value or high-overdue accounts need attention`,
    `${noResponseCount} debtors are marked as no response`,
    `${debtors.length} total debtors imported from MongoDB`,
  ];

  const selectedDebtor = debtors[0] || null;
  const selectedDebtorRow = debtorRows[0] || null;

  response.json({
    summaryCards,
    followupQueue,
    alerts,
    debtors: debtorRows,
    debtorProfile: buildDebtorProfile(selectedDebtor, selectedDebtorRow),
  });
}
