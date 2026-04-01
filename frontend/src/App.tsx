import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { analyzeFinancialData } from "./api";
import Dashboard from "./components/Dashboard";
import FinancialInputForm from "./components/FinancialInputForm";
import { Button } from "./components/ui/button";
import { AnalysisInput, AnalysisResult, WhatIfScenario, emptyScenario } from "./types";

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [latestInput, setLatestInput] = useState<AnalysisInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string>("");
  const { theme, setTheme } = useTheme();

  const handleAnalyze = async (data: AnalysisInput) => {
    const baselineInput = {
      ...data,
      scenario: emptyScenario,
    };

    setIsLoading(true);
    setError("");
    try {
      const response = await analyzeFinancialData(baselineInput);
      setLatestInput(baselineInput);
      setResult(response);
    } catch {
      setError("Unable to analyze the application right now. Please make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulate = async (scenario: WhatIfScenario) => {
    if (!latestInput) {
      return;
    }

    setIsSimulating(true);
    setError("");
    try {
      const response = await analyzeFinancialData({
        ...latestInput,
        scenario,
      });
      setResult(response);
    } catch {
      setError("Unable to run the what-if scenario right now. Please check that the backend is available.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-glow">
      <div className="container py-8 md:py-10">
        <header className="mb-8 rounded-[2rem] border bg-card/90 p-6 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="inline-flex w-fit items-center rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
                Shared core + local adapters for SME credit readiness
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  Turn SME financials into country-aware readiness, blockers, mitigants, and scheme pathways.
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                  This workspace combines shared ratio, cashflow, and documentation engines with local logic for
                  Ireland, Spain, France, the Netherlands, and Germany. Analyze the baseline case, then test what-if
                  levers such as margin, payroll, DSO, inventory days, capex timing, tenor, and interest shocks.
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

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
              {error}
            </div>
          ) : null}
        </header>

        <main className="grid gap-6 xl:grid-cols-[450px_minmax(0,1fr)]">
          <FinancialInputForm onAnalyze={handleAnalyze} loading={isLoading} />
          <Dashboard
            result={result}
            loading={isLoading}
            simulationLoading={isSimulating}
            onSimulate={handleSimulate}
            canSimulate={Boolean(latestInput)}
          />
        </main>
      </div>
    </div>
  );
}
