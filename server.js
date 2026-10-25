// femsyc backend server
// Provides optional server-side Gemini AI endpoints with zero disk logging, in-memory processing, and rate limiting.

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load from .env first
dotenv.config();

// 2. Also check .env.txt in case user saved as text file in Windows Notepad
const envTxtPath = path.join(__dirname, ".env.txt");
if (fs.existsSync(envTxtPath)) {
  try {
    const rawTxt = fs.readFileSync(envTxtPath, "utf-8");
    const parsed = dotenv.parse(rawTxt);
    for (const key in parsed) {
      if (!process.env[key] || process.env[key].trim() === "") {
        process.env[key] = parsed[key];
      }
    }
  } catch (err) {
    console.warn("Could not parse .env.txt fallback:", err.message);
  }
}

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

// Clean and trim GEMINI_API_KEY
let rawKey = process.env.GEMINI_API_KEY || "";
rawKey = rawKey.trim().replace(/^["']|["']$/g, "");
const GEMINI_API_KEY = rawKey;

// Normalize Model Name: "Gemini 3.8 Flash" -> "gemini-3.8-flash"
let rawModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
rawModel = rawModel.trim().toLowerCase().replace(/\s+/g, "-");
if (rawModel.includes("3.8") || rawModel.includes("flash")) {
  rawModel = "gemini-3.8-flash";
}
const MODEL_NAME = rawModel || "gemini-3.8-flash";

// CORS configuration - allow Vite dev server and same-origin
app.use(cors());

// Limit JSON payload to 10 MB (to support in-memory base64 medicine images up to 5 MB)
app.use(express.json({ limit: "10mb" }));

// In-memory rate limiting map: ip -> { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || "anonymous";
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    record.count++;
  }

  rateLimitMap.set(ip, record);

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: "Rate limit exceeded. Please wait a moment before trying again."
    });
  }

  next();
}

// Initialize Gemini SDK if key is provided
let aiClient = null;
if (GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    console.error("Failed to initialize Google Gen AI client:", err.message);
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    geminiConfigured: !!GEMINI_API_KEY,
    modelName: MODEL_NAME,
    timestamp: new Date().toISOString()
  });
});

// Helper: Curated demo symptom analysis when Gemini is unavailable or not configured
function getDemoSymptomAnalysis(description = "", cycleDay = 14) {
  const lower = description.toLowerCase();
  const detected = [];
  if (lower.includes("cramp") || lower.includes("pain") || lower.includes("ache")) detected.push("Abdominal/Pelvic Cramping");
  if (lower.includes("head") || lower.includes("migraine")) detected.push("Tension / Hormonal Headache");
  if (lower.includes("bloat")) detected.push("Abdominal Bloating & Water Retention");
  if (lower.includes("tired") || lower.includes("fatigue")) detected.push("Fatigue / Low Energy");
  if (lower.includes("nausea")) detected.push("Mild Nausea");
  if (lower.includes("mood") || lower.includes("irritab")) detected.push("Mood Fluctuation / Irritability");
  if (lower.includes("breast") || lower.includes("tender")) detected.push("Breast Tenderness");
  if (lower.includes("spotting") || lower.includes("bleed")) detected.push("Light Spotting");
  if (detected.length === 0) detected.push("General Menstrual/Cycle Discomfort");

  let urgency = "low";
  if (lower.includes("severe") || lower.includes("unbearable") || lower.includes("faint") || lower.includes("fever") || lower.includes("soaking")) {
    urgency = "high";
  }

  return {
    is_demo: true,
    detected_symptoms: detected,
    possible_causes: [
      `Cycle Day ~${cycleDay}: Prostaglandin shifts causing uterine muscle contraction`,
      "Natural estrogen/progesterone fluctuations affecting vascular tone and serotonin levels",
      "Temporary fluid retention and digestive tract sensitivity influenced by cycle hormones"
    ],
    home_care_tips: [
      "Apply a gentle warm heating pad (38-40°C) to the lower abdomen or lower back for 15-20 minutes.",
      "Stay well-hydrated with warm herbal teas (peppermint, chamomile, or fresh ginger slice infusion).",
      "Gentle stretching, restorative yoga (Child's Pose / Supta Baddha Konasana), and deep diaphragmatic breathing.",
      "Incorporate magnesium-rich foods (roasted pumpkin seeds, spinach, or a small square of dark chocolate)."
    ],
    common_otc_options: [
      "Ibuprofen (generic NSAID) — commonly used for prostaglandin-mediated menstrual cramps. Note: Always verify with a pharmacist.",
      "Acetaminophen / Paracetamol (generic analgesic) — alternative for pain or headache relief if NSAIDs are contraindicated."
    ],
    red_flags_to_see_a_doctor: [
      "Heavy bleeding that soaks through one or more sanitary pads/tampons per hour for two consecutive hours",
      "Sudden, excruciating, sharp unilateral pelvic pain or fainting/dizziness",
      "Fever (> 38°C / 100.4°F) accompanied by unusual pelvic pain or foul-smelling vaginal discharge",
      "Severe pain unresponsive to standard over-the-counter measures"
    ],
    urgency,
    pharmacist_consult_note: "Always consult a licensed pharmacist or physician before starting any over-the-counter medication to ensure safety, appropriate dosing, and check for drug interactions."
  };
}

// Symptom AI Endpoint
app.post("/api/symptoms", rateLimiter, async (req, res) => {
  const { description = "", cycleDay = 14 } = req.body;

  if (!description || typeof description !== "string" || description.trim().length === 0) {
    return res.status(400).json({ error: "Symptom description is required." });
  }

  // If no Gemini API Key is configured, return clearly labelled demo fallback
  if (!aiClient || !GEMINI_API_KEY) {
    return res.json(getDemoSymptomAnalysis(description, cycleDay));
  }

  try {
    const prompt = `You are a women's health companion clinical information assistant.
Analyze the following user-reported symptoms for a user currently at estimated Cycle Day ${cycleDay}:
"${description}"

Strict Instructions:
1. Provide valid JSON strictly conforming to this schema:
{
  "detected_symptoms": ["string"],
  "possible_causes": ["string"],
  "home_care_tips": ["string"],
  "common_otc_options": ["string"],
  "red_flags_to_see_a_doctor": ["string"],
  "urgency": "low" | "medium" | "high"
}
2. Use GENERIC medicine names only (e.g. Ibuprofen, Acetaminophen).
3. DO NOT prescribe medications, DO NOT invent specific dosages, DO NOT definitively diagnose any disease.
4. DO NOT imply that cycle day proves the cause of the symptom.
5. In common_otc_options, always mention consulting a pharmacist.
6. If the user mentions fainting, soaking a pad per hour, severe agonizing pain, or high fever, set urgency to "high".
7. Return ONLY the raw JSON object. Do not include markdown codeblocks or extra text.`;

    const response = await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });

    let rawText = response.text || "";
    // Clean potential markdown fencing
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(rawText);
    parsed.is_demo = false;
    return res.json(parsed);
  } catch (error) {
    console.warn("Gemini symptoms endpoint fallback activated:", error.message);
    const fallback = getDemoSymptomAnalysis(description, cycleDay);
    fallback.fallback_reason = "AI service temporarily unavailable. Showing educational guidance.";
    return res.json(fallback);
  }
});

// Helper: Curated demo medicine scan result
function getDemoMedicineAnalysis(fileName = "Sample Medicine") {
  return {
    is_demo: true,
    medicine_name: "Ibuprofen (Generic Non-Steroidal Anti-Inflammatory Drug - NSAID)",
    what_it_is_used_for: "Commonly used for temporary relief of mild to moderate menstrual cramps (dysmenorrhea), muscular aches, backaches, and headaches.",
    general_adult_dosage_guidance: "Refer strictly to the manufacturer package label (typically 200mg - 400mg every 4-6 hours with food or milk as needed). Consult a licensed pharmacist for personal dosage verification.",
    side_effects: "Mild stomach upset, nausea, heartburn, or dizziness. Taking with meals minimizes gastric irritation.",
    who_should_avoid_it: "Individuals with a history of stomach ulcers, gastrointestinal bleeding, severe kidney/liver impairment, aspirin-sensitive asthma, or those in the third trimester of pregnancy.",
    relevance_to_logged_symptoms: "Targeted at reducing prostaglandin synthesis, the primary inflammatory chemical driving uterine cramping and pelvic discomfort.",
    verification_warning: "Packaging recognition can misidentify strengths, formulations, or specific combination ingredients. Always confirm product details with a licensed pharmacist before ingestion."
  };
}

// Medicine Scan Endpoint
app.post("/api/medicine", rateLimiter, async (req, res) => {
  const { imageBase64, mimeType, fileName } = req.body;

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "Image data and MIME type are required." });
  }

  // Validate allowed MIME types
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimeTypes.includes(mimeType)) {
    return res.status(400).json({ error: "Invalid image format. Allowed formats: JPEG, PNG, WebP." });
  }

  // Validate base64 payload size (max approx 5 MB raw image -> ~7 MB base64)
  if (imageBase64.length > 7.5 * 1024 * 1024) {
    return res.status(400).json({ error: "Image file exceeds the 5 MB limit." });
  }

  // If Gemini is not configured, return realistic demo analysis immediately
  if (!aiClient || !GEMINI_API_KEY) {
    return res.json(getDemoMedicineAnalysis(fileName));
  }

  try {
    const prompt = `You are an educational women's health medicine label analyzer.
Analyze the provided medicine packaging or blister strip image.
Strictly return a JSON object with this exact structure:
{
  "medicine_name": "Generic active ingredient and brand name if clearly visible",
  "what_it_is_used_for": "General medical indications",
  "general_adult_dosage_guidance": "General adult label instructions with explicit instruction to check label and consult pharmacist",
  "side_effects": "Common known side effects",
  "who_should_avoid_it": "Known contraindications, allergies, pregnancy precautions",
  "relevance_to_logged_symptoms": "How this relates to women's cycle health or pain relief",
  "verification_warning": "Warning about verifying strength and formulation with a pharmacist"
}

Important rules:
- NEVER recommend starting, stopping, or altering medication.
- Emphasize pharmacist verification.
- Return ONLY valid JSON, no markdown fences.`;

    // Process entirely in RAM, zero disk write
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const response = await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType
              }
            }
          ]
        }
      ]
    });

    let rawText = response.text || "";
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(rawText);
    parsed.is_demo = false;
    return res.json(parsed);
  } catch (error) {
    console.warn("Gemini medicine scan fallback activated:", error.message);
    const fallback = getDemoMedicineAnalysis(fileName);
    fallback.fallback_reason = "Vision AI service temporarily offline. Showing educational sample.";
    return res.json(fallback);
  }
});

// Serve static frontend build if present
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// Fallback for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("femsyc API server running. Vite client dev server at http://localhost:5173");
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌸 femsyc Women's Health Companion is RUNNING!`);
  console.log(`👉 Open your browser at: http://localhost:${PORT}`);
  console.log(`✨ Gemini AI Connected: ${!!GEMINI_API_KEY} (${MODEL_NAME})`);
  console.log(`======================================================\n`);

  // Automatically open browser for beginner convenience
  try {
    const openCmd = process.platform === "win32" ? `start http://localhost:${PORT}` : `open http://localhost:${PORT}`;
    exec(openCmd);
  } catch (e) {
    // Ignore error if browser open fails
  }
});
