import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(path.resolve(), "public"))); // Serve frontend files

// Map frontend language → Judge0 language_id
const languageMap = {
  java: 62,       // Java (OpenJDK 17.0.1)
  python: 71,     // Python (3.8.1)
  cpp: 54,        // C++ (GCC 9.2.0)
  c: 50,          // C (GCC 9.2.0)
  javascript: 63, // JavaScript (Node.js 12.14.0)
};

// Compile & Run endpoint
app.post("/compile", async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.json({ output: "❌ Missing code or language" });
  }

  const langId = languageMap[language];
  if (!langId) {
    return res.json({ output: `❌ Language ${language} not supported` });
  }

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
          language_id: langId,
          source_code: code,
        }),
      }
    );

    const result = await response.json();

    // Collect outputs (stdout, stderr, compile errors)
    let output = "";
    if (result.stdout) output += result.stdout;
    if (result.stderr) output += `\n❌ Runtime Error:\n${result.stderr}`;
    if (result.compile_output) output += `\n⚠️ Compilation Error:\n${result.compile_output}`;
    if (!output.trim()) output = "⚠️ Unknown error";

    res.json({
      output,
      status: result.status?.description || "Unknown",
      time: result.time,
      memory: result.memory,
    });
  } catch (err) {
    res.json({ output: "❌ Server Error: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
