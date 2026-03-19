import express from "express";
import {
  generateMessageDraft,
  getMessagesDashboard,
  saveMessageDraft,
} from "../controllers/messagesController.js";

const router = express.Router();

router.get("/", getMessagesDashboard);
router.post("/draft", generateMessageDraft);
router.post("/", saveMessageDraft);

export default router;
