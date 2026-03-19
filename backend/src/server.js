import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import debtorsRouter from "./routes/debtors.js";
import dashboardRouter from "./routes/dashboard.js";
import messagesRouter from "./routes/messages.js";
import remindersRouter from "./routes/reminders.js";
import { connectToDatabase } from "./config/db.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/dashboard", dashboardRouter);
app.use("/api/debtors", debtorsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/reminders", remindersRouter);

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return response.status(400).json({
      message: "File size must be under 10MB.",
    });
  }
  const statusCode = error.message?.includes("Only .xlsx") ? 400 : 500;
  response.status(statusCode).json({
    message: error.message || "Something went wrong.",
  });
});

async function startServer() {
  await connectToDatabase(process.env.MONGODB_URI);
  app.listen(port, () => {
    console.log(`PayTrackAI backend running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
