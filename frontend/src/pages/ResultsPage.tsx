import axios from "axios";
import { Download, Moon, RefreshCw, Sun, Users } from "lucide-react";
import { useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { analyzeFinancialData, submitAgentRequest } from "@/api";
import ApplicationInputSummary from "@/components/ApplicationInputSummary";
import BrandMark from "@/components/BrandMark";
import Dashboard from "@/components/Dashboard";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import PdfReportDocument from "@/components/PdfReportDocument";
import ResultsHero from "@/components/ResultsHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadApplicationSnapshot, saveApplicationSnapshot } from "@/lib/applicationStorage";
import { formatSectorLabel } from "@/lib/industries";
import { ApplicationSnapshot, WhatIfScenario } from "@/types";
import pdfLogoDataUrl from "@/assets/fundable-logo-tight.png?inline";

async function waitForPageImages(page: HTMLDivElement) {
  const images = Array.from(page.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
          }

          const finish = () => resolve();
          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });

          try {
            void image.decode().then(finish).catch(finish);
          } catch {
            // Older browser paths can ignore decode support and rely on load/error events.
          }
        })
    )
  );
}

export default function ResultsPage() {
  const { theme, setTheme } = useTheme();
  const pdfPageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [snapshot, setSnapshot] = useState<ApplicationSnapshot | null>(() => loadApplicationSnapshot());
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSuccessMessage, setLeadSuccessMessage] = useState("");
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

  if (!snapshot) {
    return <Navigate to="/register" replace />;
  }

  const handleSimulate = async (scenario: WhatIfScenario) => {
    setSimulationLoading(true);
    setError("");
    try {
      const result = await analyzeFinancialData({ ...snapshot.latestInput, scenario });
      const nextSnapshot = {
        ...snapshot,
        result,
        updatedAt: new Date().toISOString(),
      };
      setSnapshot(nextSnapshot);
      saveApplicationSnapshot(nextSnapshot);
    } catch (err) {
      setError(extractErrorMessage("Unable to run the scenario right now.")(err));
    } finally {
      setSimulationLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    const pages = pdfPageRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!pages.length) {
      return;
    }

    setPdfLoading(true);
    setError("");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [794, 1123],
      });

      for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index];
        await waitForPageImages(page);
        const canvas = await html2canvas(page, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          imageTimeout: 15000,
          windowWidth: page.scrollWidth,
          windowHeight: page.scrollHeight,
        });
        const imageData = canvas.toDataURL("image/png");

        if (index > 0) {
          pdf.addPage([794, 1123], "portrait");
        }
        pdf.addImage(imageData, "PNG", 0, 0, 794, 1123);

        if (index === 0) {
          pdf.addImage(pdfLogoDataUrl, "PNG", 60, 54, 156, 64);
        }
      }

      const fileName = `${snapshot.registration.companyName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-readiness-report.pdf`;
      pdf.save(fileName);
    } catch (err) {
      setError(extractErrorMessage("Unable to generate the PDF report right now.")(err));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleLeadSubmit = async ({
    contact_name,
    contact_email,
    contact_phone,
    notes,
  }: {
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    notes: string;
  }) => {
    setLeadLoading(true);
    setError("");
    try {
      const receipt = await submitAgentRequest({
        company_name: snapshot.registration.companyName,
        registration_number: snapshot.registration.registrationNumber,
        contact_name,
        contact_email,
        contact_phone,
        country: snapshot.latestInput.country,
        readiness_band: snapshot.result.readiness.band,
        readiness_score: snapshot.result.readiness.score,
        potential_amount_eur: snapshot.result.commercial_opportunity.potential_amount_eur,
        indicative_rate_from_pct: snapshot.result.commercial_opportunity.indicative_rate_from_pct,
        notes,
      });
      setLeadSuccessMessage(receipt.message);
    } catch (err) {
      setError(extractErrorMessage("Unable to capture the agent request right now.")(err));
    } finally {
      setLeadLoading(false);
    }
  };

  const agentPrompt = `You have a potential to unlock ${snapshot.result.commercial_opportunity.potential_amount_eur.toLocaleString(
    "en-IE",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }
  )} in funding from ${snapshot.result.commercial_opportunity.indicative_rate_from_pct.toFixed(
    1
  )}% indicative pricing. Speak with our team to explore the most suitable funding route for your business.`;

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
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Start a new application
                </Link>
                <div className="inline-flex w-fit items-center rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
                  Funding readiness report
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  Your funding readiness, explained clearly.
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                  This report combines three years of financial history, current trading evidence, and local market
                  context to show what is supporting the case for {snapshot.registration.companyName} in{" "}
                  {formatSectorLabel(snapshot.latestInput.country)}.
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

        <div className="space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <ResultsHero companyName={snapshot.registration.companyName} result={snapshot.result} />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-0 shadow-soft">
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Next Steps</p>
                  <p className="text-sm text-muted-foreground">
                    Download your report or ask a funding specialist to follow up with you directly.
                  </p>
                  {leadSuccessMessage ? (
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">{leadSuccessMessage}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={handleDownloadPdf} disabled={pdfLoading}>
                    <Download className="mr-2 h-4 w-4" />
                    {pdfLoading ? "Preparing PDF..." : "Download PDF Report"}
                  </Button>
                  <Button variant="outline" onClick={() => setLeadModalOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Speak with a funding specialist
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Dashboard
              result={snapshot.result}
              loading={false}
              simulationLoading={simulationLoading}
              onSimulate={handleSimulate}
              canSimulate
              showHero={false}
            />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <details className="rounded-[2rem] border bg-card/90 p-6 shadow-soft">
              <summary className="cursor-pointer list-none text-lg font-semibold">
                Application details
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The detailed information shared in your application is kept here for reference while the main report
                focuses on what it means for your funding options.
              </p>
              <div className="mt-6">
                <ApplicationInputSummary registration={snapshot.registration} input={snapshot.latestInput} />
              </div>
            </details>
          </motion.section>
        </div>
      </div>

      <PdfReportDocument
        snapshot={snapshot}
        agentPrompt={agentPrompt}
        onPageRef={(index, node) => {
          pdfPageRefs.current[index] = node;
        }}
      />

      <LeadCaptureModal
        open={leadModalOpen}
        registration={snapshot.registration}
        loading={leadLoading}
        successMessage={leadSuccessMessage}
        onClose={() => setLeadModalOpen(false)}
        onSubmit={handleLeadSubmit}
      />
    </div>
  );
}
