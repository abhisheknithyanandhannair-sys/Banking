import { useRef, type ComponentType, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ChevronDown, Globe2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import BrandMark from "@/components/BrandMark";

const features = [
  {
    Icon: Globe2,
    title: "Country-specific guidance",
    description:
      "See local funding routes, documentary expectations, and market considerations for Ireland, Spain, France, the Netherlands, and Germany.",
    accent: "from-sky-500/15 to-cyan-500/10",
  },
  {
    Icon: TrendingUp,
    title: "Three-year business story",
    description:
      "Bring together three years of financial history and recent cashflow evidence in a clear picture of funding readiness.",
    accent: "from-emerald-500/15 to-lime-500/10",
  },
  {
    Icon: ShieldCheck,
    title: "A report you can share",
    description:
      "Generate a polished branded report and move seamlessly into a conversation with a funding specialist when you are ready.",
    accent: "from-fuchsia-500/15 to-violet-500/10",
  },
];

const stats = [
  { value: "5", label: "markets covered" },
  { value: "3Y", label: "years reviewed" },
  { value: "24h", label: "next-step response" },
  { value: "1", label: "shareable report" },
];

function AmbientShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-400/15 blur-[110px]"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-[130px]"
        animate={{ x: [0, -40, 0], y: [0, 25, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-fuchsia-400/10 blur-[120px]"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function RevealSection({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FeatureCard({
  Icon,
  title,
  description,
  accent,
}: {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className={`rounded-[2rem] border border-white/10 bg-gradient-to-br ${accent} p-6 backdrop-blur-sm`}
    >
      <div className="inline-flex rounded-2xl border border-white/10 bg-white/10 p-3">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/70">{description}</p>
    </motion.div>
  );
}

export default function StartupPage() {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLElement>(null);

  return (
    <div className="overflow-x-hidden bg-[#07111f] text-white">
      <section className="relative min-h-screen px-4 pb-16 pt-8">
        <AmbientShapes />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <BrandMark animated className="border-white/15 bg-white/96 shadow-[0_22px_48px_-30px_rgba(0,0,0,0.5)]" />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/register")}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur-sm hover:bg-white/10"
            >
              Start Application
            </motion.button>
          </motion.div>

          <div className="grid gap-12 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100"
              >
                <Sparkles className="h-4 w-4" />
                Funding readiness for growing SMEs
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18 }}
                className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl"
              >
                See how ready your business is for funding.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.26 }}
                className="mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg"
              >
                Share three years of financial history, review a clear funding-readiness assessment, and get practical
                next steps tailored to your business.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.34 }}
                className="mt-10 flex flex-col items-start gap-4 sm:flex-row"
              >
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/register")}
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20"
                >
                  Start registration
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/10"
                >
                  See how it works
                </motion.button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-[2.25rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <BrandMark compact className="border-white/15 bg-white/96 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.5)]" />
                  <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-100">
                    Funding snapshot
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="rounded-[1.75rem] border border-white/10 bg-[#0c1a2d] p-5"
                  >
                    <p className="text-sm uppercase tracking-[0.18em] text-white/45">Readiness band</p>
                    <div className="mt-4 flex items-end gap-4">
                      <div className="text-6xl font-semibold">84</div>
                      <div className="mb-2 rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-medium text-emerald-200">
                        Green
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "84%" }}
                        transition={{ duration: 1.1, delay: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                      />
                    </div>
                  </motion.div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm uppercase tracking-[0.18em] text-white/45">Potential to unlock</p>
                      <p className="mt-4 text-3xl font-semibold">EUR 150K</p>
                      <p className="mt-2 text-sm text-white/65">Indicative pricing from 5.5%</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm uppercase tracking-[0.18em] text-white/45">Three-year view</p>
                      <p className="mt-4 text-sm leading-7 text-white/65">
                        Revenue is improving, margins are holding, liquidity is stable, and documentation is ready for
                        lender review.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="mx-auto mt-16 block"
            aria-label="Scroll to features"
          >
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="h-6 w-6 text-white/40" />
            </motion.div>
          </motion.button>
        </div>
      </section>

      <section className="border-y border-white/5 bg-white/[0.03] py-12">
        <div className="container grid gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <RevealSection key={stat.label} delay={index * 0.06}>
              <div className="text-center">
                <p className="text-4xl font-semibold">{stat.value}</p>
                <p className="mt-2 text-sm text-white/55">{stat.label}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      <section ref={featuresRef} className="py-24">
        <div className="container">
          <RevealSection>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Why businesses use it</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight">A clearer route from application to funding</h2>
              <p className="mt-5 text-base leading-8 text-white/60">
                Every step is designed to be easy to follow: cleaner presentation, clearer interpretation, and a more
                confident next step for the business owner.
              </p>
            </div>
          </RevealSection>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <RevealSection key={feature.title} delay={index * 0.08}>
                <FeatureCard {...feature} />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <RevealSection>
            <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/8 to-white/[0.02] p-8 backdrop-blur-xl md:p-12">
              <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div>
                  <BrandMark className="border-white/15 bg-white/96 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.5)]" />
                  <h2 className="mt-8 text-4xl font-semibold tracking-tight">Ready to explore your funding options?</h2>
                  <p className="mt-5 max-w-xl text-base leading-8 text-white/60">
                    Share your business details, add three years of financial history, and generate a polished report
                    that highlights your funding readiness and next steps.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-end">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/register")}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-950"
                  >
                    Start your application
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>
    </div>
  );
}
