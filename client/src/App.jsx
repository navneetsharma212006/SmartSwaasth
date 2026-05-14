import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
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


import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/scan" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
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
          <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        </Routes>
      </main>
      <Footer />
    </div>
  );
}