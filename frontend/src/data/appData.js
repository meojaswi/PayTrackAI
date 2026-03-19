export const summaryCards = [
  {
    label: "Total Pending",
    value: "Rs 4,85,000",
    note: "12% higher than last month",
    theme: "slate",
  },
  {
    label: "Follow-ups Today",
    value: "18",
    note: "6 high-priority accounts",
    theme: "amber",
  },
  {
    label: "Overdue Cases",
    value: "39",
    note: "Need action within 24 hours",
    theme: "rose",
  },
  {
    label: "Collected This Week",
    value: "Rs 72,000",
    note: "8 successful recoveries",
    theme: "emerald",
  },
];

export const followupQueue = [
  {
    name: "Rakesh Traders",
    amount: "Rs 48,000",
    overdue: "16 days overdue",
    lastContact: "2 days ago",
    priority: "High",
  },
  {
    name: "Mohan Hardware",
    amount: "Rs 21,500",
    overdue: "Due today",
    lastContact: "Yesterday",
    priority: "Medium",
  },
  {
    name: "Shivani Textiles",
    amount: "Rs 73,000",
    overdue: "9 days overdue",
    lastContact: "4 days ago",
    priority: "High",
  },
];

export const alerts = [
  "5 customers promised payment today",
  "3 high-value accounts have not been contacted in 7 days",
  "2 new payments were logged this morning",
  "8 SMS reminders are ready for review",
];

export const debtors = [
  {
    name: "Rakesh Traders",
    phone: "+91 98765 12345",
    amount: "Rs 48,000",
    dueDate: "12 Mar 2026",
    overdue: "16",
    lastContact: "16 Mar 2026",
    language: "Hindi",
    status: "Overdue",
    followupDate: "18 Mar 2026",
  },
  {
    name: "Mohan Hardware",
    phone: "+91 98111 45678",
    amount: "Rs 21,500",
    dueDate: "18 Mar 2026",
    overdue: "0",
    lastContact: "17 Mar 2026",
    language: "English",
    status: "Due Today",
    followupDate: "18 Mar 2026",
  },
  {
    name: "Shivani Textiles",
    phone: "+91 98222 33445",
    amount: "Rs 73,000",
    dueDate: "09 Mar 2026",
    overdue: "9",
    lastContact: "14 Mar 2026",
    language: "Hindi",
    status: "Promised",
    followupDate: "19 Mar 2026",
  },
  {
    name: "Agarwal Distributors",
    phone: "+91 98989 99887",
    amount: "Rs 12,800",
    dueDate: "05 Mar 2026",
    overdue: "13",
    lastContact: "10 Mar 2026",
    language: "Mixed",
    status: "No Response",
    followupDate: "18 Mar 2026",
  },
  {
    name: "Vikas Metals",
    phone: "+91 97777 66554",
    amount: "Rs 31,200",
    dueDate: "14 Mar 2026",
    overdue: "4",
    lastContact: "15 Mar 2026",
    language: "English",
    status: "Partial Payment",
    followupDate: "20 Mar 2026",
  },
];

export const debtorProfile = {
  name: "Rakesh Traders",
  owner: "Rakesh Sharma",
  amount: "Rs 48,000",
  dueDate: "12 Mar 2026",
  phone: "+91 98765 12345",
  language: "Hindi",
  lastPayment: "Rs 10,000 on 02 Mar 2026",
  notes: "Usually responds better to polite but direct reminders in Hindi.",
  messages: [
    "10 Mar: Friendly reminder sent on WhatsApp",
    "14 Mar: Payment promised by weekend",
    "16 Mar: No update received after follow-up call",
  ],
  suggestion:
    "Namaste Rakesh ji, aapka Rs 48,000 ka baki payment 12 March se due hai. Kripya aaj payment update share kar dein. Agar transfer ho gaya ho to screenshot bhej dein.",
};

export const messageCampaigns = [
  {
    title: "Morning WhatsApp batch",
    audience: "12 overdue debtors",
    channel: "WhatsApp",
    language: "Hindi",
    status: "Ready",
  },
  {
    title: "Promise follow-up",
    audience: "5 debtors",
    channel: "SMS",
    language: "English",
    status: "Scheduled",
  },
  {
    title: "Gentle reminder set",
    audience: "18 mixed-language debtors",
    channel: "WhatsApp + SMS",
    language: "Mixed",
    status: "Draft",
  },
];

export const payments = [
  {
    debtor: "Shivani Textiles",
    amount: "Rs 25,000",
    date: "18 Mar 2026",
    mode: "Bank Transfer",
    status: "Received",
  },
  {
    debtor: "Vikas Metals",
    amount: "Rs 8,000",
    date: "17 Mar 2026",
    mode: "UPI",
    status: "Partial",
  },
  {
    debtor: "Rakesh Traders",
    amount: "Rs 10,000",
    date: "02 Mar 2026",
    mode: "Cheque",
    status: "Received",
  },
];

export const importStats = [
  { label: "Rows ready", value: "126" },
  { label: "Missing phone numbers", value: "4" },
  { label: "Duplicate entries", value: "2" },
  { label: "Ready for sync", value: "120" },
];

export const settingsGroups = [
  {
    title: "Messaging Defaults",
    items: [
      "Default tone: Polite but firm",
      "Preferred channel: WhatsApp first, SMS backup",
      "Require approval before every send",
    ],
  },
  {
    title: "Language Preferences",
    items: [
      "Primary language: Hindi",
      "Secondary language: English",
      "Enable mixed Hindi-English draft generation",
    ],
  },
  {
    title: "Business Rules",
    items: [
      "Escalate messages after 15 overdue days",
      "Highlight accounts above Rs 50,000",
      "Auto-create a follow-up task after no response",
    ],
  },
];
