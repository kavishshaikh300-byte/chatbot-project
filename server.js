// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import OpenAI from "openai";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const client = new OpenAI({
//   apiKey: process.env.GROQ_API_KEY,
//   baseURL: "https://api.groq.com/openai/v1"
// });

// app.post("/chat", async (req, res) => {
//   try {

//     const userMessage =
//       req.body.contents?.slice(-1)[0]?.parts?.[0]?.text || "";

//     const completion = await client.chat.completions.create({
//       model: "llama-3.1-8b-instant",
//       messages: [{ role: "user", content: userMessage }]
//     });

//     res.json({
//       candidates: [{
//         content: {
//           parts: [{
//             text: completion.choices[0].message.content
//           }]
//         }
//       }]
//     });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.listen(3000, () =>
//   console.log("✅ Server running at http://localhost:3000")
// );

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

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend files
app.use(express.static(__dirname));

// Catch-all route using regex instead of "*"
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Grok API setup
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.contents?.slice(-1)[0]?.parts?.[0]?.text || "";

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: userMessage }],
    });

    res.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: completion.choices[0].message.content,
              },
            ],
          },
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Use Render PORT or default 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
