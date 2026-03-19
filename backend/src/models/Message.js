import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    debtorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Debtor",
      required: true,
    },
    debtorName: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      default: "WhatsApp",
      trim: true,
    },
    language: {
      type: String,
      default: "English",
      trim: true,
    },
    tone: {
      type: String,
      default: "Polite",
      trim: true,
    },
    status: {
      type: String,
      default: "Draft",
      trim: true,
    },
    retrievalMode: {
      type: String,
      default: "fallback",
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    retrievalContext: {
      debtorStatus: {
        type: String,
        default: "",
      },
      debtorLanguage: {
        type: String,
        default: "",
      },
      similarCount: {
        type: Number,
        default: 0,
      },
      recentMessagesFound: {
        type: Number,
        default: 0,
      },
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

export default mongoose.model("Message", messageSchema);
