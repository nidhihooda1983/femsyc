import React, { useState, useEffect } from "react";
import { translations } from "./translations";
import { 
  getConsent, 
  saveConsent, 
  getCycleData, 
  saveCycleData, 
  getSymptoms, 
  saveSymptom, 
  deleteSymptom,
  getWaterData,
  saveWaterData,
  getPregnancyData,
  savePregnancyData,
  getReminders,
  saveReminders,
  getSettings,
  saveSettings,
  getLanguage,
  saveLanguage,
  wipeAllLocalData
} from "./utils/storage";
import { getTodayString } from "./utils/cycleUtils";

// Components
import { ConsentModal } from "./components/ConsentModal";
import { TopHeader } from "./components/TopHeader";
import { BottomNav } from "./components/BottomNav";
import { TodayView } from "./components/TodayView";
import { CalendarView } from "./components/CalendarView";
import { SymptomAIView } from "./components/SymptomAIView";
import { MedicineScanView } from "./components/MedicineScanView";
import { PharmacyView } from "./components/PharmacyView";
import { HistoryView } from "./components/HistoryView";
import { PregnancyView } from "./components/PregnancyView";
import { RemindersView } from "./components/RemindersView";
import { NutritionView } from "./components/NutritionView";
import { SettingsView } from "./components/SettingsView";
import { PrintableReport } from "./components/PrintableReport";

import "./App.css";

export function App() {
  const todayStr = getTodayString();

  // Consent State
  const [consent, setConsent] = useState(() => getConsent());
  
  // Navigation View State
  const [currentView, setCurrentView] = useState("today");
  
  // Language State
  const [language, setLanguage] = useState(() => getLanguage());
  const t = translations[language] || translations.en;

  // Domain State
  const [cycleData, setCycleData] = useState(() => getCycleData());
  const [symptomsList, setSymptomsList] = useState(() => getSymptoms());
  const [waterGlasses, setWaterGlasses] = useState(() => getWaterData(todayStr));
  const [pregnancyData, setPregnancyData] = useState(() => getPregnancyData());
  const [reminders, setReminders] = useState(() => getReminders());
  const [settings, setSettings] = useState(() => getSettings());

  // Date context when switching from Calendar to Symptom logging
  const [targetSymptomDate, setTargetSymptomDate] = useState(todayStr);

  // Consent agreement handler
  const handleAgreeConsent = () => {
    saveConsent(true);
    setConsent({ agreed: true, timestamp: new Date().toISOString() });
  };

  // Withdraw consent and wipe everything
  const handleWithdrawConsentAndWipe = () => {
    wipeAllLocalData();
    setConsent(null);
    setCycleData({ lastPeriodDate: "", cycleLength: 28, periodLength: 5, history: [] });
    setSymptomsList([]);
    setWaterGlasses(0);
    setPregnancyData({ enabled: false, dueDate: "", appointments: [] });
    setReminders([]);
    setCurrentView("today");
  };

  // Language toggle
  const handleToggleLanguage = () => {
    const nextLang = language === "en" ? "hi" : "en";
    saveLanguage(nextLang);
    setLanguage(nextLang);
  };

  // Cycle updater
  const handleUpdateCycle = (newCycle) => {
    saveCycleData(newCycle);
    setCycleData(newCycle);
  };

  // Symptom logger
  const handleSaveSymptom = (entry) => {
    const updated = saveSymptom(entry);
    setSymptomsList(updated);
  };

  const handleDeleteSymptom = (id) => {
    const updated = deleteSymptom(id);
    setSymptomsList(updated);
  };

  // Hydration updater
  const handleUpdateWater = (glasses) => {
    const updated = saveWaterData(todayStr, glasses);
    setWaterGlasses(updated);
  };

  // Pregnancy updater
  const handleUpdatePregnancy = (data) => {
    savePregnancyData(data);
    setPregnancyData(data);
  };

  // Reminders updater
  const handleUpdateReminders = (data) => {
    saveReminders(data);
    setReminders(data);
  };

  // Settings updater
  const handleUpdateSettings = (data) => {
    saveSettings(data);
    setSettings(data);
  };

  // Calendar shortcut to log symptoms for a specific date
  const handleLogForDate = (dateStr) => {
    setTargetSymptomDate(dateStr);
    setCurrentView("symptoms");
  };

  return (
    <div className="app-wrapper">
      <div className="app-shell">
        {/* First Launch Consent Screen */}
        {(!consent || !consent.agreed) ? (
          <ConsentModal onAgree={handleAgreeConsent} t={t} />
        ) : (
          <>
            {/* Top Header */}
            <TopHeader
              currentView={currentView}
              setCurrentView={setCurrentView}
              language={language}
              onToggleLanguage={handleToggleLanguage}
              isPregnancyMode={pregnancyData.enabled}
              t={t}
            />

            {/* Main Scrollable Content */}
            <main className="main-content">
              {currentView === "today" && (
                <TodayView
                  cycleData={cycleData}
                  onUpdateCycle={handleUpdateCycle}
                  waterGlasses={waterGlasses}
                  onUpdateWater={handleUpdateWater}
                  onNavigateToSymptoms={() => {
                    setTargetSymptomDate(todayStr);
                    setCurrentView("symptoms");
                  }}
                  t={t}
                />
              )}

              {currentView === "calendar" && (
                <CalendarView
                  cycleData={cycleData}
                  symptomsList={symptomsList}
                  onLogForDate={handleLogForDate}
                  t={t}
                />
              )}

              {currentView === "symptoms" && (
                <SymptomAIView
                  cycleDay={14}
                  initialDate={targetSymptomDate}
                  onSaveSymptom={handleSaveSymptom}
                  t={t}
                />
              )}

              {currentView === "medicine" && (
                <MedicineScanView t={t} />
              )}

              {currentView === "pharmacies" && (
                <PharmacyView t={t} />
              )}

              {currentView === "history" && (
                <HistoryView
                  symptomsList={symptomsList}
                  onDeleteSymptom={handleDeleteSymptom}
                  t={t}
                />
              )}

              {currentView === "pregnancy" && (
                <PregnancyView
                  pregnancyData={pregnancyData}
                  onUpdatePregnancy={handleUpdatePregnancy}
                  t={t}
                />
              )}

              {currentView === "reminders" && (
                <RemindersView
                  reminders={reminders}
                  onUpdateReminders={handleUpdateReminders}
                  t={t}
                />
              )}

              {currentView === "nutrition" && (
                <NutritionView currentPhase="menstrual" t={t} />
              )}

              {currentView === "settings" && (
                <SettingsView
                  cycleData={cycleData}
                  onUpdateCycle={handleUpdateCycle}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onWithdrawConsentAndWipe={handleWithdrawConsentAndWipe}
                  t={t}
                />
              )}
            </main>

            {/* Bottom 5-Tab Navigation Bar */}
            <BottomNav
              currentView={currentView}
              setCurrentView={setCurrentView}
              t={t}
            />

            {/* Hidden printable medical summary rendered when window.print() is called */}
            <PrintableReport
              cycleData={cycleData}
              symptomsList={symptomsList}
              t={t}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
