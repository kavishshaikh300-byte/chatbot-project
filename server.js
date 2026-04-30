import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage =
      req.body.contents?.slice(-1)[0]?.parts?.[0]?.text || "";

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      stream: true,
      messages: [
        {
          role: "system",
          content: `
You are a helpful AI assistant.
- Give clear answers
- Always format properly
- Use markdown for code
- End with ONE follow-up question
`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
    });

    res.setHeader("Content-Type", "text/plain");

    for await (const chunk of completion) {
      const text = chunk.choices[0]?.delta?.content || "";
      res.write(text);
    }

    res.end();
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
