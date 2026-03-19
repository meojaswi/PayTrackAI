import fs from "node:fs/promises";
import path from "node:path";
import xlsx from "xlsx";
import Debtor from "../models/Debtor.js";

const headerAliases = {
  name: ["name", "debtor", "debtor name", "customer", "customer name", "party name", "company"],
  phone: ["phone", "phone number", "mobile", "mobile number", "contact", "contact number", "whatsapp number"],
  pendingAmount: ["pending", "pending amount", "amount", "due", "balance", "outstanding", "amount due"],
  status: ["status", "payment status", "followup status"],
  language: ["language", "preferred language"],
  followupDate: ["followup", "follow up", "follow-up", "followup date", "next followup date"],
  dueDate: ["due date", "duedate", "payment due date"],
  lastContact: ["last contact", "last contact date", "last followup", "last reminder"],
  overdueDays: ["overdue", "overdue days", "days overdue"],
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function resolveField(row, fieldName) {
  const aliases = headerAliases[fieldName] || [];

  for (const [key, value] of Object.entries(row)) {
    if (aliases.includes(normalizeHeader(key))) {
      return value;
    }
  }

  return "";
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/[^\d+]/g, "").trim();

  if (!digits) {
    return "";
  }

  if (digits.startsWith("+")) {
    return digits;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return digits;
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleanedValue = String(value || "").replace(/[^\d.-]/g, "");
  const parsedValue = Number(cleanedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = xlsx.SSF.parse_date_code(value);

    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function toTitleCase(value, fallback) {
  const cleaned = String(value || "").trim();

  if (!cleaned) {
    return fallback;
  }

  return cleaned
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapRowToDebtor(row, sourceFile) {
  const name = String(resolveField(row, "name") || "").trim();
  const phone = normalizePhone(resolveField(row, "phone"));

  return {
    name,
    phone,
    pendingAmount: toNumber(resolveField(row, "pendingAmount")),
    status: toTitleCase(resolveField(row, "status"), "New"),
    language: toTitleCase(resolveField(row, "language"), "Unknown"),
    followupDate: toDate(resolveField(row, "followupDate")),
    dueDate: toDate(resolveField(row, "dueDate")),
    lastContact: toDate(resolveField(row, "lastContact")),
    overdueDays: toNumber(resolveField(row, "overdueDays")),
    sourceFile,
  };
}

function buildDebtorResponse(debtor) {
  return {
    id: debtor._id,
    name: debtor.name,
    phone: debtor.phone,
    pendingAmount: debtor.pendingAmount,
    pendingAmountFormatted: formatCurrency(debtor.pendingAmount),
    status: debtor.status,
    language: debtor.language,
    followupDate: debtor.followupDate,
    dueDate: debtor.dueDate,
    lastContact: debtor.lastContact,
    overdueDays: debtor.overdueDays,
    sourceFile: debtor.sourceFile,
    createdAt: debtor.createdAt,
    updatedAt: debtor.updatedAt,
  };
}

function buildCrudPayload(payload = {}) {
  return {
    name: String(payload.name || "").trim(),
    phone: normalizePhone(payload.phone),
    pendingAmount: toNumber(payload.pendingAmount),
    status: toTitleCase(payload.status, "New"),
    language: toTitleCase(payload.language, "Unknown"),
    followupDate: toDate(payload.followupDate),
    dueDate: toDate(payload.dueDate),
    lastContact: toDate(payload.lastContact),
    overdueDays: toNumber(payload.overdueDays),
    sourceFile: payload.sourceFile ? String(payload.sourceFile).trim() : null,
  };
}

function validateDebtorPayload(payload) {
  if (!payload.name) {
    return "Name is required.";
  }

  if (!payload.phone) {
    return "Phone is required.";
  }

  return "";
}

export async function getDebtors(_request, response) {
  const debtors = await Debtor.find().sort({ createdAt: -1 }).lean();

  response.json({
    debtors: debtors.map(buildDebtorResponse),
  });
}

export async function getDebtorById(request, response) {
  const debtor = await Debtor.findById(request.params.id).lean();

  if (!debtor) {
    return response.status(404).json({ message: "Debtor not found." });
  }

  return response.json({
    debtor: buildDebtorResponse(debtor),
  });
}

export async function createDebtor(request, response) {
  const payload = buildCrudPayload(request.body);
  const validationError = validateDebtorPayload(payload);

  if (validationError) {
    return response.status(400).json({ message: validationError });
  }

  const existingDebtor = await Debtor.findOne({ phone: payload.phone }).lean();

  if (existingDebtor) {
    return response.status(409).json({ message: "A debtor with this phone already exists." });
  }

  const debtor = await Debtor.create(payload);

  return response.status(201).json({
    message: "Debtor created successfully.",
    debtor: buildDebtorResponse(debtor.toObject()),
  });
}

export async function updateDebtor(request, response) {
  const payload = buildCrudPayload(request.body);
  const validationError = validateDebtorPayload(payload);

  if (validationError) {
    return response.status(400).json({ message: validationError });
  }

  const existingDebtor = await Debtor.findOne({
    phone: payload.phone,
    _id: { $ne: request.params.id },
  }).lean();

  if (existingDebtor) {
    return response.status(409).json({ message: "Another debtor already uses this phone." });
  }

  const debtor = await Debtor.findByIdAndUpdate(request.params.id, payload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!debtor) {
    return response.status(404).json({ message: "Debtor not found." });
  }

  return response.json({
    message: "Debtor updated successfully.",
    debtor: buildDebtorResponse(debtor),
  });
}

export async function deleteDebtor(request, response) {
  const debtor = await Debtor.findByIdAndDelete(request.params.id).lean();

  if (!debtor) {
    return response.status(404).json({ message: "Debtor not found." });
  }

  return response.json({
    message: "Debtor deleted successfully.",
    debtor: buildDebtorResponse(debtor),
  });
}

export async function getImportSummary(_request, response) {
  const totalDebtors = await Debtor.countDocuments();
  const readyForSync = await Debtor.countDocuments({
    phone: { $nin: ["", null] },
  });

  response.json({
    stats: [
      { label: "Rows stored", value: String(totalDebtors) },
      { label: "Missing phone numbers", value: "0" },
      { label: "Ready for sync", value: String(readyForSync) },
    ],
  });
}

export async function uploadDebtors(request, response) {
  if (!request.file) {
    return response.status(400).json({ message: "Please upload an Excel file." });
  }

  const filePath = path.resolve(request.file.path);

  try {
    const workbook = xlsx.readFile(filePath, {
      cellDates: true,
      raw: false,
    });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return response.status(400).json({ message: "The uploaded file is empty." });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
      blankrows: false,
    });

    if (!rows.length) {
      return response.status(400).json({
        message: "No rows were found in the first worksheet.",
      });
    }

    let missingNameCount = 0;
    let missingPhoneNumbers = 0;
    let duplicatePhonesInFile = 0;
    const uniquePhoneNumbers = new Set();
    const preparedRows = [];

    for (const rawRow of rows) {
      const debtor = mapRowToDebtor(rawRow, request.file.originalname);

      if (!debtor.name) {
        missingNameCount += 1;
        continue;
      }

      if (!debtor.phone) {
        missingPhoneNumbers += 1;
        continue;
      }

      if (uniquePhoneNumbers.has(debtor.phone)) {
        duplicatePhonesInFile += 1;
        continue;
      }

      uniquePhoneNumbers.add(debtor.phone);
      preparedRows.push(debtor);
    }

    if (!preparedRows.length) {
      return response.status(400).json({
        message: "No valid debtor rows were found. Add at least name and phone columns.",
      });
    }

    const existingPhones = await Debtor.find(
      { phone: { $in: preparedRows.map((row) => row.phone) } },
      { phone: 1 },
    ).lean();
    const existingPhoneSet = new Set(existingPhones.map((item) => item.phone));

    await Debtor.bulkWrite(
      preparedRows.map((row) => ({
        updateOne: {
          filter: { phone: row.phone },
          update: { $set: row },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    const insertedCount = preparedRows.filter((row) => !existingPhoneSet.has(row.phone)).length;
    const updatedCount = preparedRows.length - insertedCount;
    const totalDebtors = await Debtor.countDocuments();
    const debtors = await Debtor.find({ phone: { $in: preparedRows.map((row) => row.phone) } })
      .sort({ updatedAt: -1 })
      .lean();

    return response.status(201).json({
      message: "Excel uploaded, parsed, and stored in MongoDB successfully.",
      fileName: request.file.originalname,
      sheetName: firstSheetName,
      summary: {
        uploadedRows: rows.length,
        storedRows: preparedRows.length,
        insertedCount,
        updatedCount,
        missingNameCount,
        missingPhoneNumbers,
        duplicatePhonesInFile,
        totalDebtors,
      },
      debtors: debtors.map(buildDebtorResponse),
    });
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
}
