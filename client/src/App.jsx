import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import AlarmModal from "./components/AlarmModal.jsx";
import HomePage from "./pages/HomePage.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DailyChecklistPage from "./pages/DailyChecklistPage.jsx";
import MedicineInteractionPage from "./pages/MedicineInteractionPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import HowItWorksPage from "./pages/HowItWorksPage.jsx";
import SafetyGuidePage from "./pages/SafetyGuidePage.jsx";
import FAQPage from "./pages/FAQPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import PatientsPage from "./pages/PatientsPage.jsx";
import PatientPlanPage from "./pages/PatientPlanPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import DoctorMedicinesPage from "./pages/DoctorMedicinesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { getSocket } from "./lib/socket.js";
import SwaasthSaathi from "./components/SwaasthSaathi.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  // Alarm state: null = no alarm, otherwise { medicine, timeStr }
  const [alarm, setAlarm] = useState(null);

  // Queue of pending alarms (if multiple medicines at the same time)
  const [alarmQueue, setAlarmQueue] = useState([]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    // Join personal notification room
    const joinRoom = () => {
      socket.emit("join_user_room", { userId: user._id });
    };

    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    // Listen for new dosage notifications → trigger alarm
    const handleNotif = (notif) => {
      if (notif.type !== "dosage") return;

      const alarmData = {
        medicine: {
          name: notif.medicineId?.name || notif.message?.match(/take (.+?) \(/)?.[1] || "Medicine",
          dosageInstructions: notif.meta?.dosageInstructions || "",
          dosagePerDay: notif.meta?.dosagePerDay || null,
        },
        timeStr: notif.meta?.dosageTime || "",
      };

      setAlarmQueue((prev) => [...prev, alarmData]);
    };

    socket.on("notification:new", handleNotif);

    // ── Service Worker → tab messaging ──────────────────────────────────────
    // When a push arrives while the tab is open (even if minimized/backgrounded),
    // the SW sends us a DOSAGE_ALARM postMessage so we can play audio immediately.
    const handleSwMessage = (event) => {
      if (event.data?.type !== "DOSAGE_ALARM") return;
      setAlarmQueue((prev) => [
        ...prev,
        {
          medicine: { name: event.data.medicineName || "Medicine" },
          timeStr: event.data.dosageTime || "",
        },
      ]);
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSwMessage);
    }

    return () => {
      socket.off("connect", joinRoom);
      socket.off("notification:new", handleNotif);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSwMessage);
      }
    };
  }, [user]);

  // Pop next alarm from queue when current one is dismissed
  useEffect(() => {
    if (alarm === null && alarmQueue.length > 0) {
      setAlarm(alarmQueue[0]);
      setAlarmQueue((prev) => prev.slice(1));
    }
  }, [alarm, alarmQueue]);

  const handleDismiss = () => setAlarm(null);

  // Snooze: put the same alarm back in queue after `minutes`
  const handleSnooze = (minutes) => {
    const snoozed = alarm;
    setAlarm(null); // AlarmModal handles its own countdown display
    setTimeout(() => {
      setAlarmQueue((prev) => [snoozed, ...prev]);
    }, minutes * 60 * 1000);
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Full-screen alarm overlay (above everything) */}
      {alarm && (
        <AlarmModal
          medicine={alarm.medicine}
          timeStr={alarm.timeStr}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      )}

      {/* SwaasthSaathi AI chatbot — patients only */}
      {user && user.role !== "caregiver" && <SwaasthSaathi />}

      <Navbar />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/scan" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/scan/:patientId" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/result/:patientId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route
            path="/medicine-interaction"
            element={<ProtectedRoute><MedicineInteractionPage /></ProtectedRoute>}
          />
          <Route
            path="/daily-checklist/:medicineId"
            element={<ProtectedRoute><DailyChecklistPage /></ProtectedRoute>}
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/safety-guide" element={<SafetyGuidePage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
          <Route path="/patient-plan/:patientId" element={<ProtectedRoute><PatientPlanPage /></ProtectedRoute>} />
          <Route path="/medicines/doctor/:doctorId" element={<ProtectedRoute><DoctorMedicinesPage /></ProtectedRoute>} />
          <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}