import { generateReminder } from "../services/paytrack.js";

export const generate = async (req, res) => {
  const { name, amount, days, language, tone } = req.body;

  if (!name || !amount || !days || !language || !tone) {
    return res.status(400).json({ error: "Missing fields: name, amount, days, language, tone" });
  }

  try {
    const result = await generateReminder({ name, amount, days, language, tone });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[PayTrackAI]", err.message);
    res.status(502).json({ error: "Reminder generation failed", detail: err.message });
  }
};