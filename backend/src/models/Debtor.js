import mongoose from "mongoose";

const debtorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    pendingAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "New",
      trim: true,
    },
    language: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    followupDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    lastContact: {
      type: Date,
      default: null,
    },
    overdueDays: {
      type: Number,
      default: 0,
    },
    sourceFile: {
      type: String,
      default: null,
      trim: true,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    embeddingText: {
      type: String,
      default: "",
      trim: true,
    },
    embeddingUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Debtor", debtorSchema);
