import Groq from "groq-sdk";

let cachedClient = null;

export function getGroqClient() {
  if (!cachedClient) {
    cachedClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return cachedClient;
}
