import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import StartupPage from "./pages/StartupPage";
import RegistrationPage from "./pages/RegistrationPage";
import ResultsPage from "./pages/ResultsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<StartupPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/dashboard" element={<Navigate to="/register" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
