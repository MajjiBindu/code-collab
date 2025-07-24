// backend/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Helper to get file extension based on language
function getExtension(language) {
  switch (language) {
    case "python3": return "py";
    case "cpp": return "cpp";
    case "java": return "java";
    case "nodejs": return "js";
    default: return "txt";
  }
}

// MAIN RUN ROUTE
app.post('/run', async (req, res) => {
  const { language, code } = req.body;

  console.log("▶️ Received run request");
  console.log("Language:", language);
  console.log("Code:\n", code);

  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: language,
      version: "*",
      files: [
        {
          name: "main." + getExtension(language),
          content: code
        }
      ]
    });

    console.log("✅ Response from API:", response.data);
    res.json(response.data);
  } catch (err) {
    console.error("❌ API ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: 'Execution failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
