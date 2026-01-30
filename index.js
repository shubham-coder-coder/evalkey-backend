import functions from "firebase-functions";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/generateKeywords", async (req, res) => {
  try {
    const { question, marks } = req.body;

    if (!question || !marks) {
      return res.status(400).json({ error: "Missing data" });
    }

    const prompt = `
You are an exam evaluator.

Generate ONLY important keywords.
No explanation.
No sentences.
No numbering.

Return comma-separated keywords only.

Marks: ${marks}
Question: ${question}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      }
    );

    const data = await response.json();

    const text =
      data?.choices?.[0]?.message?.content || "";

    const keywords = text
      .replace(/\n/g, ",")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    res.json({ keywords });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

export const generateKeywords = functions.https.onRequest(app);
