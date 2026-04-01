import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ArrowRight, Globe, TrendingUp, ShieldCheck, ChevronDown, Building2 } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const phrases = ["Country-Aware Readiness", "Blockers & Mitigants", "Scheme Pathways"];

const countries = [
  { code: "IE", name: "Ireland", flag: "🇮🇪", scheme: "SBCI", detail: "Microfinance Ireland route" },
  { code: "ES", name: "Spain", flag: "🇪🇸", scheme: "CIRBE", detail: "ICO guarantee pathways" },
  { code: "FR", name: "France", flag: "🇫🇷", scheme: "Bpifrance", detail: "BdF credit scoring" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", scheme: "BMKB", detail: "BKR event registry" },
  { code: "DE", name: "Germany", flag: "🇩🇪", scheme: "KfW", detail: "Company register checks" },
];

const features = [
  {
    Icon: Globe,
    title: "Multi-Country Intelligence",
    description:
      "Country-specific adapters for Ireland, Spain, France, Netherlands, and Germany — each with local scheme pathways, blockers, and regulatory context.",
    color: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-500",
  },
  {
    Icon: TrendingUp,
    title: "Real-Time What-If Analysis",
    description:
      "Adjust margin, payroll, DSO, inventory days, capex timing, tenor, and interest shocks. See readiness band drift and evidence expectations instantly.",
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-500",
  },
  {
    Icon: ShieldCheck,
    title: "Open Banking Ready",
    description:
      "Upload CSV/Excel statements or connect via Open Banking. Automated cashflow analysis with seasonality detection and liquidity runway scoring.",
    color: "from-purple-500/20 to-violet-500/20",
    iconColor: "text-purple-500",
  },
];

const stats = [
  { value: "5", label: "Countries" },
  { value: "18", label: "Financial Ratios" },
  { value: "3", label: "Readiness Bands" },
  { value: "100%", label: "Country-Aware" },
];

// ─── Particle component ───────────────────────────────────────────────────────

function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Typed phrase component ───────────────────────────────────────────────────

function TypingPhrase() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % phrases.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block min-w-[16ch]">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="inline-block bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent"
        >
          {phrases[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  Icon,
  title,
  description,
  color,
  iconColor,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  iconColor: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${color} p-6 backdrop-blur-sm`}
    >
      <div className="mb-4 inline-flex rounded-xl bg-white/10 p-3">
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-7 text-white/70">{description}</p>
    </motion.div>
  );
}

// ─── Country card ─────────────────────────────────────────────────────────────

function CountryCard({
  flag,
  name,
  scheme,
  detail,
  index,
}: {
  flag: string;
  name: string;
  scheme: string;
  detail: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ scale: 1.06, y: -4 }}
      className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-sm transition-shadow hover:shadow-lg hover:shadow-indigo-500/20"
    >
      <span className="text-4xl">{flag}</span>
      <div>
        <p className="font-semibold text-white">{name}</p>
        <span className="mt-1 inline-block rounded-full bg-indigo-500/30 px-2.5 py-0.5 text-xs font-medium text-indigo-200">
          {scheme}
        </span>
      </div>
      <p className="text-xs text-white/60">{detail}</p>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StartupPage() {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="overflow-x-hidden bg-[#080d1a] text-white">
      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[80px]" />
        </div>

        <Particles />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm"
        >
          <Building2 className="h-4 w-4 text-indigo-400" />
          SME Credit Readiness Platform
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mb-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Turn SME Financials
          <br />
          into{" "}
          <TypingPhrase />
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mb-10 max-w-2xl text-base leading-8 text-white/60 sm:text-lg"
        >
          Shared ratio, cashflow, and documentation engines with country-specific adapters for Ireland, Spain, France,
          the Netherlands, and Germany. Analyze, simulate, and act.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="flex flex-col items-center gap-3 sm:flex-row"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/dashboard")}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-shadow hover:shadow-xl hover:shadow-indigo-500/40"
          >
            Start Analysis
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={scrollToFeatures}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            Learn More
          </motion.button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToFeatures}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          aria-label="Scroll down"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-6 w-6 text-white/40" />
          </motion.div>
        </motion.button>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-white/5 bg-white/[0.02] py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <RevealSection key={stat.label} delay={i * 0.08}>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/50">{stat.label}</div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section ref={featuresRef} className="py-24">
        <div className="container">
          <RevealSection>
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-indigo-400">Platform</p>
              <h2 className="text-3xl font-bold sm:text-4xl">Everything you need for SME credit analysis</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-white/60">
                Combine financial ratios, cashflow scoring, and documentation checks with country-specific intelligence.
              </p>
            </div>
          </RevealSection>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, i) => (
              <RevealSection key={feature.title} delay={i * 0.1}>
                <FeatureCard {...feature} />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Countries ── */}
      <section className="py-24">
        <div className="container">
          <RevealSection>
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-indigo-400">Coverage</p>
              <h2 className="text-3xl font-bold sm:text-4xl">Five countries, one platform</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-white/60">
                Each country adapter handles local credit bureau checks, government scheme pathways, and regulatory
                documentation requirements.
              </p>
            </div>
          </RevealSection>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {countries.map((country, i) => (
              <CountryCard key={country.code} {...country} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="py-24">
        <div className="container">
          <RevealSection>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm md:p-10">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold sm:text-3xl">Powerful analysis dashboard</h2>
                <p className="mt-3 text-sm text-white/60">
                  Readiness bands, blocker lists, scheme pathways, and what-if simulation — all in one view.
                </p>
              </div>

              {/* Mock dashboard UI */}
              <div className="space-y-4">
                {/* Mock header row */}
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 h-3 w-24 rounded-full bg-white/20" />
                    <div className="flex items-end gap-3">
                      <div className="text-5xl font-bold text-emerald-400">76</div>
                      <span className="mb-1 rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">
                        Green
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "76%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        className="h-full rounded-full bg-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 h-3 w-28 rounded-full bg-white/20" />
                    <div className="space-y-2">
                      {["Strong DSCR of 1.42x", "Healthy liquidity runway", "Documentation complete"].map((text) => (
                        <div key={text} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <div className="text-xs text-white/60">{text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mock ratio row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Current Ratio", value: "1.82" },
                    { label: "DSCR Proxy", value: "1.42x" },
                    { label: "Gross Margin", value: "38.5%" },
                    { label: "Working Capital", value: "42 days" },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-white/50">{metric.label}</div>
                      <div className="mt-1 text-lg font-semibold">{metric.value}</div>
                    </div>
                  ))}
                </div>

                {/* Mock blockers row */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 text-sm font-medium text-white/80">Top Blockers</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
                        <span className="text-white/70">Accounts aged &gt;12 months</span>
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-300">medium</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
                        <span className="text-white/70">High leverage ratio 4.2x</span>
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-300">high</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 text-sm font-medium text-white/80">Scheme Pathways</div>
                    <div className="space-y-2">
                      <div className="rounded-xl bg-indigo-500/10 px-3 py-2 text-xs">
                        <div className="font-medium text-indigo-300">SBCI-backed bank route</div>
                        <div className="mt-0.5 text-white/50">Preferred via AIB, BoI, PTSB</div>
                      </div>
                      <div className="rounded-xl bg-indigo-500/10 px-3 py-2 text-xs">
                        <div className="font-medium text-indigo-300">Microfinance Ireland</div>
                        <div className="mt-0.5 text-white/50">Loans up to €25k</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="container">
          <RevealSection>
            <div className="relative overflow-hidden rounded-3xl p-px">
              {/* Gradient border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="relative rounded-3xl bg-[#0c1220] px-8 py-16 text-center sm:px-16">
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                <h2 className="relative text-3xl font-bold sm:text-4xl">Ready to analyze your first SME case?</h2>
                <p className="relative mx-auto mt-4 max-w-lg text-sm leading-8 text-white/60">
                  Enter financial statements or upload a spreadsheet. Get readiness band, blockers, and scheme pathways
                  in seconds.
                </p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/dashboard")}
                  className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-10 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition-shadow hover:shadow-2xl hover:shadow-indigo-500/40"
                >
                  Get Started Now
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
          <span>Banking Partner — SME Credit Readiness Platform</span>
          <span>Ireland · Spain · France · Netherlands · Germany</span>
        </div>
      </footer>
    </div>
  );
}
