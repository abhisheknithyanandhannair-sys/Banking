import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import StartupPage from "./pages/StartupPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<StartupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
