import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(path.resolve(), "public"))); // Serve frontend files

// Compile & Run endpoint
app.post("/compile", async (req, res) => {
  const { code } = req.body;

  try {
    const response = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          language_id: 62, // Java
          source_code: code,
        }),
      }
    );

    const result = await response.json();
    res.json({ output: result.stdout || result.stderr || "Unknown error" });
  } catch (err) {
    res.json({ output: "Error: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
