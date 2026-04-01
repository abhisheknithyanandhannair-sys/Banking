import axios from "axios";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeFinancialData } from "../api";
import Dashboard from "../components/Dashboard";
import FinancialInputForm from "../components/FinancialInputForm";
import { Button } from "../components/ui/button";
import { AnalysisInput, AnalysisResult, WhatIfScenario, emptyScenario } from "../types";

export default function DashboardPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [latestInput, setLatestInput] = useState<AnalysisInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string>("");
  const { theme, setTheme } = useTheme();

  const extractErrorMessage = (fallback: string) => (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail) && detail.length > 0) {
        return `Validation issue: ${detail[0]?.msg ?? fallback}`;
      }
    }
    return fallback;
  };

  const handleAnalyze = async (data: AnalysisInput) => {
    const baselineInput = { ...data, scenario: emptyScenario };
    setIsLoading(true);
    setError("");
    try {
      const response = await analyzeFinancialData(baselineInput);
      setLatestInput(baselineInput);
      setResult(response);
    } catch (err) {
      setError(extractErrorMessage("Unable to analyze the application right now. Please make sure the backend is running.")(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulate = async (scenario: WhatIfScenario) => {
    if (!latestInput) return;
    setIsSimulating(true);
    setError("");
    try {
      const response = await analyzeFinancialData({ ...latestInput, scenario });
      setResult(response);
    } catch (err) {
      setError(
        extractErrorMessage("Unable to run the what-if scenario right now. Keep the simulator values within the allowed ranges.")(err)
      );
    } finally {
      setIsSimulating(false);
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
                  Shared core + local adapters for SME credit readiness
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  Turn SME financials into country-aware readiness, blockers, mitigants, and scheme pathways.
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                  Shared ratio, cashflow, and documentation engines with local logic for Ireland, Spain, France, the
                  Netherlands, and Germany. Analyze the baseline case, then test what-if levers.
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

        <main className="grid gap-6 xl:grid-cols-[450px_minmax(0,1fr)]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <FinancialInputForm onAnalyze={handleAnalyze} loading={isLoading} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Dashboard
              result={result}
              loading={isLoading}
              simulationLoading={isSimulating}
              onSimulate={handleSimulate}
              canSimulate={Boolean(latestInput)}
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
