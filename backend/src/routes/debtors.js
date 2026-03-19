import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import {
  createDebtor,
  deleteDebtor,
  getDebtorById,
  getDebtors,
  getImportSummary,
  updateDebtor,
  uploadDebtors,
} from "../controllers/debtorsController.js";

const uploadsDirectory = path.resolve("uploads");
fs.mkdirSync(uploadsDirectory, { recursive: true });

const upload = multer({
  dest: uploadsDirectory,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    const isExcelFile = /\.(xlsx|xls|csv)$/i.test(file.originalname);

    if (!isExcelFile) {
      return callback(new Error("Only .xlsx, .xls, or .csv files are allowed."));
    }

    callback(null, true);
  },
});

const router = express.Router();

router.get("/", getDebtors);
router.get("/import-summary", getImportSummary);
router.post("/", createDebtor);
router.patch("/:id", updateDebtor);
router.delete("/:id", deleteDebtor);
router.get("/:id", getDebtorById);
router.post("/upload", upload.single("file"), uploadDebtors);

export default router;
