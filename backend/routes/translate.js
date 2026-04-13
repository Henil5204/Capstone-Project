const express = require("express");
const router  = express.Router();

// POST /api/translate
// Body: { texts: [...strings], targetLang: "zh" }
router.post("/", async (req, res) => {
  try {
    const { texts, targetLang } = req.body;
    if (!Array.isArray(texts) || !targetLang)
      return res.status(400).json({ success:false, message:"texts[] and targetLang required" });

    // Return as-is for English
    if (targetLang === "en")
      return res.json({ success:true, translations:texts });

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
      return res.status(500).json({ success:false, message:"AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY not set in .env" });

    const { TranslateClient, TranslateTextCommand } = require("@aws-sdk/client-translate");
    const client = new TranslateClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log(`🌐 Translating ${texts.length} strings → ${targetLang}`);

    // Batch: translate all in parallel
    const translations = await Promise.all(
      texts.map(async (text) => {
        if (!text || String(text).trim() === "") return text;
        try {
          const { TranslatedText } = await client.send(new TranslateTextCommand({
            Text:               String(text).slice(0, 5000), // AWS limit
            SourceLanguageCode: "en",
            TargetLanguageCode: targetLang,
          }));
          return TranslatedText || text;
        } catch (e) {
          return text; // fallback to original
        }
      })
    );

    console.log(`✅ Done translating to ${targetLang}`);
    res.json({ success:true, translations });

  } catch (err) {
    console.error("Translate route error:", err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});

module.exports = router;