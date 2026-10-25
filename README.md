# femsyc — Women's Health Companion 🌸

> **A beautiful, privacy-first, mobile-first web app built for women's health hackathons.**

`femsyc` combines cycle tracking, natural-language symptom analysis, medicine label scanning, nearby pharmacy navigation, pregnancy milestones, and cycle-aware nutrition into a unified wellness experience.

---

## 🌟 Visual Design & Aesthetic
- **Color Palette:** Soft blush pink (`#FFE4E8`, `#FFF0F3`), lavender (`#EDE9FE`), lilac (`#C084FC`), clean white, and deep plum (`#3B0764`).
- **Mobile-First Experience:** Tailored for mobile screens with rounded wellness cards, gentle drop shadows, accessible contrast, and a fixed 5-tab bottom navigation bar.
- **Bilingual Support:** One-tap toggle between **English** and **हिन्दी (Hindi)** for navigation, labels, and wellness tips.

---

## 🚀 Key Features

### 1. First-Launch Privacy Consent
- Clear, simple English explanation of data handling before the user enters the app.
- Explains that cycle dates and symptoms are saved strictly on the local device.
- In-memory processing notice for medicine photographs (zero disk storage).
- External AI processing notice (Google Gemini) and strict "no selling of data" pledge.
- "I agree" checkbox required to continue; timestamped consent is saved locally.

### 2. Today Dashboard
- **Circular Cycle Progress Dial:** Visual indicator showing current cycle day, phase (Menstrual, Follicular, Ovulatory, Luteal), and countdown to the next predicted period.
- **Fertility & Ovulation Estimates:** Highlighted approximate fertile window and LH surge/ovulation day.
- **One-Tap Period Logging:** Quick *"Period Starts Today"* button updates cycle calculation instantly.
- **Hydration Tracker:** Interactive water intake tracker (target 8 glasses / 2 Liters) with one-click logging.
- **Iron-Rich Food of the Day:** Curated food recommendation matched to the current cycle phase (e.g., lentils, spinach, pumpkin seeds) with bioavailability synergy tips.
- **Clinical Disclaimer:** Clear notice that statistical predictions are not contraception or pregnancy prevention.

### 3. Cycle Calendar
- Month-by-month calendar view with navigation.
- Color-coded highlights:
  - **Past & Predicted Periods:** Soft blush pink.
  - **Estimated Fertile Window:** Lavender.
  - **Ovulation Day:** Distinctive lilac ring.
  - **Today:** Bold indicator.
  - **Dates with Logged Symptoms:** Coral indicator dot.
- Selecting any calendar date displays that date's cycle day, estimated phase, logged symptoms, and a shortcut to log symptoms for that date.

### 4. Symptom AI Companion
- Natural-language text description input.
- **Voice-to-Text Dictation:** Built using the native Web Speech API (`SpeechRecognition`).
- **Tappable Symptom Chips:** *headache, cramps, bloating, mood swings, fatigue, nausea, back pain, acne, breast tenderness, spotting*.
- Server-side optional Gemini AI integration (`POST /api/symptoms`).
- **High-Urgency Banner:** Displays `"🚨 Please seek medical care now."` if severe symptoms (fainting, excessive bleeding, high fever) are detected.
- **Red-Flag Symptoms Section:** Guides users on when to seek urgent emergency care.
- **Generic OTC Options:** Lists generic active ingredients with a mandatory pharmacist consultation note.
- **Mandatory Exact Footer:** *"Health information only, not a diagnosis or medical advice. Consult a doctor or pharmacist."*
- **Offline / Zero-Config Demo Mode:** Automatically provides educational wellness guidance if the Gemini API key is not configured or network is unavailable.

### 5. Medicine Label Scan
- Camera capture and image upload (`<input type="file" accept="image/*" capture="environment" />`).
- Supports JPEG, PNG, and WebP up to 5 MB.
- Client-side and server-side MIME type and file size validation.
- In-memory visual preview with image removal option.
- Analyzes packaging for active ingredients, indications, general adult dosage guidelines, side effects, contraindications, and relevance to cycle symptoms.
- Packaging verification warnings and clear disclaimers that pharmacist confirmation is mandatory before taking any medication.
- **Privacy Guarantee:** Images are processed in RAM only and are *never saved* to disk or browser storage.

### 6. Nearby Pharmacy Finder
- Uses Leaflet and OpenStreetMap tiles.
- Requests browser geolocation on demand (*never stored in localStorage*).
- Queries the free OpenStreetMap Overpass API for `amenity=pharmacy`.
- Interactive map markers and distance calculation in kilometers.
- *"Get Directions"* button opens turn-by-turn navigation directly in Google Maps.
- Graceful handling of denied location permissions, network timeouts, and fallback to curated pharmacies.

### 7. History & Printable Doctor's Report
- Chronological timeline of logged symptoms grouped by date.
- **Symptom Frequency Distribution Bar Chart:** Visual frequency analysis across symptoms.
- Date filters: *All Time*, *Last 7 Days*, *Last 30 Days*.
- **Export Data (JSON):** Download complete cycle records, symptoms, and settings in one click.
- **Print Doctor's Report:** Clean clinical summary layout formatted for `window.print()` to save as a PDF or hand to a physician during consultations.

### 8. Pregnancy Mode (Extra Hackathon Feature)
- Switchable informational mode. **Never inferred automatically** from a missed period date.
- Week-by-week cards (weeks 4 through 40) with baby size fruit comparisons, fetal length, fetal weight, maternal bodily changes, and trimester guidance.
- General comfort tips for morning sickness, heartburn, backaches, and swelling.
- Prenatal appointment and scan manager.

### 9. In-App Reminders (Extra Hackathon Feature)
- Configurable reminders for periods, daily hydration, multivitamins/iron supplements, and custom medications.
- Clearly labeled as in-app reminders.

---

## 🔒 Privacy & Security Architecture
1. **Zero Persistent Server Logging:** No symptom descriptions, medicine photographs, prompts, or AI responses are written to server disks or logs.
2. **In-Memory Image Processing:** Uploaded images are converted to in-memory buffers for analysis and discarded immediately.
3. **No Client API Keys:** Gemini API keys are read strictly from server environment variables.
4. **Rate Limiting:** Built-in in-memory rate limiter on `/api/*` endpoints protects against abuse.
5. **Transparency Disclosures:** Clear settings disclosures explaining that browser `localStorage` is unencrypted and explaining DPDP Act educational scope.
6. **One-Tap Data Deletion:** The *"Withdraw Consent and Delete All My Data"* button wipes local storage and resets the application.

---

## 🛠️ Tech Stack
- **Frontend:** React 19, Vite, Plain CSS (scoped, responsive, print-optimized), Lucide React icons, Leaflet.
- **Backend:** Node.js, Express 5, CORS, Dotenv, `@google/genai` (optional).
- **Storage:** Browser `localStorage` (client-side only).

---

## 📦 Getting Started (Beginner-Friendly)

### 1. Prerequisites
- Node.js (version 20 or higher recommended).

### 2. Install Dependencies
Open a terminal in the project directory and run:
```bash
npm install --legacy-peer-deps
```

### 3. Run the App

#### Option A: Quick Full-Stack Production Server (Recommended)
Build the frontend and run the Express server on port 3001:
```bash
npm run build
npm start
```
Then open: **`http://localhost:3001`** in your browser.

#### Option B: Development Mode (Vite Hot-Reload + Backend API)
1. In terminal 1, start the backend server:
   ```bash
   node server.js
   ```
2. In terminal 2, start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open the Vite URL (typically `http://localhost:5173`). Requests to `/api/*` are automatically proxied to the backend.

---

## 🔑 Optional: Configuring Gemini AI
femsyc works **100% out of the box without an API key** using its built-in educational demo knowledge base.

To enable live Google Gemini AI responses:
1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
2. Open `.env` and add your Google Gemini API key:
   ```env
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Restart the server (`node server.js` or `npm start`).

---

## 🧪 Testing Checklist
- [x] **First-Launch Consent:** Triggers on clean launch; checkboxes and persistence verified.
- [x] **Cycle Dashboard:** Day progress, fertile window, ovulation day, water logging, and period start button tested.
- [x] **Calendar:** Navigation, period days, fertile days, and date details drawer verified.
- [x] **Symptom AI:** Text area, speech recognition, quick chips, urgency banner, and demo fallback verified.
- [x] **Medicine Scan:** 5 MB size check, MIME validation, camera input, and pharmacist warnings verified.
- [x] **Pharmacy Finder:** Leaflet map tiles, distance calculation, Google Directions link, and permission fallbacks verified.
- [x] **History & Doctor Report:** Symptom frequency bar chart, JSON download, and printable layout tested.
- [x] **Pregnancy Mode:** Explicit toggle, week-by-week cards, fruit comparisons, and appointment tracker tested.
- [x] **Reminders & Nutrition:** In-app reminder toggles and iron-rich foods catalog tested.
- [x] **Bilingual Support:** Smooth toggle between English and Hindi verified.
- [x] **Data Erasure:** One-click withdrawal of consent wipes device storage completely.

---

## 📄 License & Disclaimer
This project is built for educational and hackathon demonstration purposes. The health information provided is for general reference only and is not a substitute for professional clinical advice, diagnosis, or treatment. Always consult a licensed physician or pharmacist.
