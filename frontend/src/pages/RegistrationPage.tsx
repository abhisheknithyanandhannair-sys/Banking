import axios from "axios";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { analyzeFinancialData } from "@/api";
import BrandMark from "@/components/BrandMark";
import FinancialInputForm from "@/components/FinancialInputForm";
import { Button } from "@/components/ui/button";
import { ApplicationSubmission, emptyScenario } from "@/types";
import { saveApplicationSnapshot } from "@/lib/applicationStorage";

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const extractErrorMessage = (fallback: string) => (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail) && detail.length > 0) {
        return `Validation issue: ${detail[0]?.msg ?? fallback}`;
      }
      if (typeof detail === "string" && detail.trim()) {
        return detail;
      }
      if (typeof err.response?.data?.message === "string" && err.response.data.message.trim()) {
        return err.response.data.message;
      }
      if (typeof err.message === "string" && err.message.trim()) {
        return err.message;
      }
    }
    return fallback;
  };

  const handleRegister = async ({ registration, analysisInput }: ApplicationSubmission) => {
    setIsLoading(true);
    setError("");
    try {
      const latestInput = { ...analysisInput, scenario: emptyScenario };
      const result = await analyzeFinancialData(latestInput);
      saveApplicationSnapshot({
        registration,
        latestInput,
        result,
        updatedAt: new Date().toISOString(),
      });
      navigate("/results");
    } catch (err) {
      setError(
        extractErrorMessage("Unable to register and analyze the SME right now. Please make sure the backend is running.")(err)
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-glow">
      <div className="container py-8 md:py-10">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 rounded-[2rem] border bg-card/90 p-6 shadow-soft backdrop-blur"
        >
          <div className="mb-6">
            <BrandMark animated compact className="border-slate-200/80 bg-white/96 dark:border-white/10 dark:bg-white/96" />
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Home
                </Link>
                <div className="inline-flex w-fit items-center rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
                  Business application
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  Share your business details and three years of financial history.
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                  We use this information to prepare your funding-readiness assessment, highlight key strengths and
                  watchouts, and recommend the most relevant next steps.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-fit"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </Button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <FinancialInputForm onSubmit={handleRegister} loading={isLoading} submitLabel="Register Application" />
        </motion.main>
      </div>
    </div>
  );
}
