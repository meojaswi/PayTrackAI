import Debtor from "../models/Debtor.js";
import Message from "../models/Message.js";
import { getGroqClient } from "./groqClient.js";

const generationModel = "llama-3.3-70b-versatile";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeText(value) {
  return String(value || "").trim();
}

function generateFallbackDraft({
  debtor,
  language,
  tone,
  channel,
  similarDebtors,
  recentMessages,
}) {
  const greeting =
    language === "Hindi"
      ? `Namaste ${debtor.name} ji,`
      : language === "Mixed"
        ? `Hello ${debtor.name} ji,`
        : `Hello ${debtor.name},`;

  const actionText =
    language === "Hindi"
      ? "Kripya payment update aaj share karein."
      : "Please share a payment update today.";

  return `${greeting} your pending payment of ${formatCurrency(
    debtor.pendingAmount
  )} is due from ${formatDate(debtor.dueDate)}. Current status is ${debtor.status || "Pending"}. This ${tone.toLowerCase()} ${channel} reminder used ${similarDebtors.length} related debtor records and ${recentMessages.length} prior message references. ${actionText}`;
}

function mapRetrievedDebtor(debtor, score) {
  return {
    id: debtor._id,
    name: debtor.name,
    status: debtor.status,
    language: debtor.language,
    pendingAmountFormatted: formatCurrency(debtor.pendingAmount),
    score,
  };
}

function mapRetrievedMessage(message, score) {
  return {
    id: message._id,
    debtorName: message.debtorName,
    channel: message.channel,
    language: message.language,
    tone: message.tone,
    status: message.status,
    content: message.content,
    score,
  };
}

async function generateWithGroq(context) {
  const client = getGroqClient();
  const response = await client.chat.completions.create({
    model: generationModel,
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content:
          "You write concise debt recovery reminders. Keep them professional, specific, and grounded only in the provided debtor and retrieval context. Do not invent payments, promises, or legal threats. Output only the message text, nothing else.",
      },
      {
        role: "user",
        content: JSON.stringify(context, null, 2),
      },
    ],
  });
  return response.choices[0].message.content.trim();
}

export async function generateRagDraft({
  debtorId,
  tone,
  channel,
  language,
  status,
}) {
  const debtor = await Debtor.findById(debtorId).lean();

  if (!debtor) {
    throw new Error("Debtor not found.");
  }

  const normalizedLanguage =
    normalizeText(language) || debtor.language || "English";
  const normalizedStatus = normalizeText(status) || debtor.status || "Pending";
  const normalizedTone = normalizeText(tone) || "Polite";
  const normalizedChannel = normalizeText(channel) || "WhatsApp";

  // Retrieve similar debtors and messages from DB
  const similarDebtors = await Debtor.find({
    _id: { $ne: debtor._id },
    $or: [{ language: normalizedLanguage }, { status: normalizedStatus }],
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  const recentMessages = await Message.find({
    $or: [
      { debtorId: debtor._id },
      { language: normalizedLanguage },
      { status: "Sent" },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const promptContext = {
    targetDebtor: {
      name: debtor.name,
      pendingAmount: formatCurrency(debtor.pendingAmount),
      status: debtor.status,
      language: debtor.language,
      dueDate: formatDate(debtor.dueDate),
      overdueDays: debtor.overdueDays || 0,
    },
    requestedStyle: {
      tone: normalizedTone,
      language: normalizedLanguage,
      channel: normalizedChannel,
    },
    retrievedDebtors: similarDebtors.map((d) => mapRetrievedDebtor(d, null)),
    retrievedMessages: recentMessages.map((m) => mapRetrievedMessage(m, null)),
  };

  let draftText;
  try {
    draftText = await generateWithGroq(promptContext);
  } catch (error) {
    console.error("Groq generation failed, using fallback:", error.message);
    draftText = generateFallbackDraft({
      debtor,
      language: normalizedLanguage,
      tone: normalizedTone,
      channel: normalizedChannel,
      similarDebtors,
      recentMessages,
    });
  }

  return {
    draftText,
    retrievalMode: "groq-rag",
    similarDebtors: similarDebtors.map((d) => mapRetrievedDebtor(d, null)),
    recentMessages: recentMessages.map((m) => mapRetrievedMessage(m, null)),
    retrievalContext: {
      debtorStatus: normalizedStatus,
      debtorLanguage: normalizedLanguage,
      similarCount: similarDebtors.length,
      recentMessagesFound: recentMessages.length,
    },
  };
}
