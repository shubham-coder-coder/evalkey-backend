import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

/* ======================
   TEST ROUTE
====================== */
app.get("/", (req, res) => {
  res.send("✅ Groq AI backend running");
});

/* ======================
   KEYWORD GENERATOR
====================== */
app.post("/generate", async (req, res) => {
  const { question, marks } = req.body;

  if (!question || !marks) {
    return res.status(400).json({
      keywords: [],
      error: "Question or marks missing",
    });
  }

  try {
    const prompt = `
You are an exam evaluator.

Generate ONLY IMPORTANT KEYWORDS.

Rules:
- No explanation
- No sentences
- No numbering
- Comma separated keywords only

Marks: ${marks}
Question: ${question}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are an exam keyword generator.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
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
    console.error("GROQ ERROR:", err);
    res.status(500).json({
      keywords: [],
      error: "Groq AI failed",
    });
  }
});

/* ======================
   START SERVER (RENDER SAFE)
====================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Groq backend running on port", PORT);
});
