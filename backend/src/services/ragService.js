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
  const amount = formatCurrency(debtor.pendingAmount);
  const due = formatDate(debtor.dueDate);

  const templates = {
    English: {
      Polite: `Dear ${debtor.name}, this is a gentle reminder that your payment of ${amount} was due on ${due}. We request you to kindly arrange the payment at your earliest convenience. Thank you for your cooperation.`,
      Firm: `Dear ${debtor.name}, your payment of ${amount} due on ${due} remains unpaid. Please clear this immediately to avoid further follow-up. Kindly confirm once done.`,
      Urgent: `Dear ${debtor.name}, your payment of ${amount} due on ${due} is critically overdue. Immediate action is required. Please pay now and share the confirmation.`,
    },
    Hindi: {
      Polite: `प्रिय ${debtor.name} जी, आपको सूचित किया जाता है कि ${due} को देय ${amount} की राशि अभी तक लंबित है। कृपया इसे शीघ्र अति शीघ्र जमा करने की व्यवस्था करें। आपके सहयोग के लिए धन्यवाद।`,
      Firm: `${debtor.name} जी, आपकी ${amount} की बकाया राशि जो ${due} को देय थी, अभी तक प्राप्त नहीं हुई है। कृपया तुरंत भुगतान करें और हमें सूचित करें।`,
      Urgent: `${debtor.name} जी, आपका ${amount} का भुगतान जो ${due} को देय था, अत्यंत विलंबित हो चुका है। तत्काल भुगतान करें अन्यथा आगे की कार्यवाही की जाएगी।`,
    },
    Mixed: {
      Polite: `Hello ${debtor.name} ji, aapka ${amount} ka payment ${due} se pending hai. Please jaldi se payment karein. Shukriya.`,
      Firm: `Hello ${debtor.name} ji, aapka ${amount} ka payment ${due} se due hai aur abhi tak nahi aaya. Kripya turant payment karein aur confirm karein.`,
      Urgent: `${debtor.name} ji, aapka ${amount} ka payment bahut zyada overdue ho gaya hai. Abhi turant payment karein, warna aage ki action leni padegi.`,
    },
  };

  return templates[language]?.[tone] || templates["English"]["Polite"];
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
        content: `You write concise debt recovery reminders. 
- If language is Hindi, respond ONLY in Devanagari script (हिंदी)
- If language is Mixed, use a mix of Hindi and English
- If language is English, respond in English
- Tone must be ${context.requestedStyle.tone}: Polite=gentle, Firm=direct, Urgent=strict
- Output ONLY the message text, no labels or explanations`,
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
