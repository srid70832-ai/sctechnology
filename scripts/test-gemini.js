const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf-8');
let apiKey = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('GEMINI_API_KEY=')) {
    apiKey = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  }
}

async function testGemini() {
  const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Extract company: 'Google' from this text. Return JSON: {\"company\": \"Google\"}" }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[PASS] ${model} works! Output:`, data.candidates?.[0]?.content?.parts?.[0]?.text);
        return;
      } else {
        console.log(`[FAIL] ${model}:`, data.error?.message || res.statusText);
      }
    } catch (e) {
      console.log(`[ERR] ${model}:`, e.message);
    }
  }
}

testGemini();
