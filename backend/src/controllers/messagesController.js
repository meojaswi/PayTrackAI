import Debtor from "../models/Debtor.js";
import Message from "../models/Message.js";
import { generateRagDraft } from "../services/ragService.js";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function normalizeInput(value, fallback) {
  const cleaned = String(value || "").trim();
  return cleaned || fallback;
}

function mapMessage(message) {
  return {
    id: message._id,
    debtorId: message.debtorId,
    debtorName: message.debtorName,
    channel: message.channel,
    language: message.language,
    tone: message.tone,
    status: message.status,
    retrievalMode: message.retrievalMode,
    content: message.content,
    retrievalContext: message.retrievalContext,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

function buildCampaigns(debtors, messages) {
  const overdueDebtors = debtors.filter((debtor) => (debtor.overdueDays || 0) > 0);
  const promisedDebtors = debtors.filter((debtor) => debtor.status === "Promised");
  const noResponseDebtors = debtors.filter((debtor) => debtor.status === "No Response");

  return [
    {
      title: "Overdue WhatsApp batch",
      audience: `${overdueDebtors.length} overdue debtors`,
      channel: "WhatsApp",
      language: "Mixed",
      status: overdueDebtors.length ? "Ready" : "Waiting",
    },
    {
      title: "Promise follow-up",
      audience: `${promisedDebtors.length} promised accounts`,
      channel: "SMS",
      language: "English",
      status: promisedDebtors.length ? "Ready" : "Waiting",
    },
    {
      title: "No-response reminder set",
      audience: `${noResponseDebtors.length} no-response debtors`,
      channel: "WhatsApp + SMS",
      language: "Mixed",
      status: messages.length ? "Draft" : "New",
    },
  ];
}

export async function getMessagesDashboard(_request, response) {
  const [debtors, messages] = await Promise.all([
    Debtor.find().sort({ updatedAt: -1 }).lean(),
    Message.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  response.json({
    campaigns: buildCampaigns(debtors, messages),
    debtors: debtors.map((debtor) => ({
      id: debtor._id,
      name: debtor.name,
      phone: debtor.phone,
      language: debtor.language,
      status: debtor.status,
      pendingAmountFormatted: formatCurrency(debtor.pendingAmount),
      embeddingUpdatedAt: debtor.embeddingUpdatedAt,
    })),
    recentMessages: messages.map(mapMessage),
  });
}

export async function generateMessageDraft(request, response) {
  const debtorId = normalizeInput(request.body.debtorId, "");
  const tone = normalizeInput(request.body.tone, "Polite");
  const channel = normalizeInput(request.body.channel, "WhatsApp");
  const incomingLanguage = normalizeInput(request.body.language, "");
  const incomingStatus = normalizeInput(request.body.status, "");

  if (!debtorId) {
    return response.status(400).json({ message: "Debtor selection is required." });
  }

  const debtor = await Debtor.findById(debtorId).lean();

  if (!debtor) {
    return response.status(404).json({ message: "Debtor not found." });
  }

  const ragResult = await generateRagDraft({
    debtorId,
    tone,
    channel,
    language: incomingLanguage,
    status: incomingStatus,
  });
  const resolvedLanguage = normalizeInput(incomingLanguage, debtor.language || "English");

  return response.json({
    draft: {
      debtorId: debtor._id,
      debtorName: debtor.name,
      channel,
      language: resolvedLanguage,
      tone,
      status: "Draft",
      retrievalMode: ragResult.retrievalMode,
      content: ragResult.draftText,
      retrievalContext: ragResult.retrievalContext,
    },
    retrievedDebtors: ragResult.similarDebtors,
    recentMessages: ragResult.recentMessages,
  });
}

export async function saveMessageDraft(request, response) {
  const debtorId = normalizeInput(request.body.debtorId, "");
  const content = normalizeInput(request.body.content, "");

  if (!debtorId) {
    return response.status(400).json({ message: "Debtor selection is required." });
  }

  if (!content) {
    return response.status(400).json({ message: "Draft content is required." });
  }

  const debtor = await Debtor.findById(debtorId).lean();

  if (!debtor) {
    return response.status(404).json({ message: "Debtor not found." });
  }

  const message = await Message.create({
    debtorId: debtor._id,
    debtorName: debtor.name,
    channel: normalizeInput(request.body.channel, "WhatsApp"),
    language: normalizeInput(request.body.language, debtor.language || "English"),
    tone: normalizeInput(request.body.tone, "Polite"),
    status: normalizeInput(request.body.status, "Draft"),
    retrievalMode: normalizeInput(request.body.retrievalMode, "fallback"),
    content,
    retrievalContext: {
      debtorStatus: normalizeInput(request.body.retrievalContext?.debtorStatus, debtor.status || "Pending"),
      debtorLanguage: normalizeInput(
        request.body.retrievalContext?.debtorLanguage,
        debtor.language || "English",
      ),
      similarCount: Number(request.body.retrievalContext?.similarCount || 0),
      recentMessagesFound: Number(request.body.retrievalContext?.recentMessagesFound || 0),
    },
  });

  return response.status(201).json({
    message: "Draft saved successfully.",
    savedMessage: mapMessage(message.toObject()),
  });
}
