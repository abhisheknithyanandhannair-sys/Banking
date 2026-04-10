import { motion } from "framer-motion";
import logoSrc from "@/assets/fundable-logo-tight.png";

interface BrandMarkProps {
  compact?: boolean;
  animated?: boolean;
  className?: string;
}

export default function BrandMark({
  compact = false,
  animated = false,
  className = "",
}: BrandMarkProps) {
  const content = (
    <div className="flex items-center justify-center">
      <img
        src={logoSrc}
        alt="Fundable logo"
        className={compact ? "h-8 w-auto object-contain" : "h-10 w-auto object-contain"}
      />
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`inline-flex items-center justify-center rounded-[1.1rem] border border-slate-200/80 bg-white px-4 py-2.5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.65)] backdrop-blur-sm ${className}`}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center rounded-[1.1rem] border border-slate-200/80 bg-white px-4 py-2.5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.65)] backdrop-blur-sm ${className}`}>
      {content}
    </div>
  );
}
