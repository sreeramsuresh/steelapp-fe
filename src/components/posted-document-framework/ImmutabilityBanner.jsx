import { Lock, ShieldCheck } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const VARIANT_STYLES = {
  info: {
    light: "bg-blue-50 border-blue-200 text-blue-800",
    dark: "bg-blue-900/20 border-blue-700/40 text-blue-300",
    icon: "text-blue-500",
  },
  warning: {
    light: "bg-amber-50 border-amber-200 text-amber-800",
    dark: "bg-amber-900/20 border-amber-700/40 text-amber-300",
    icon: "text-amber-500",
  },
  success: {
    light: "bg-emerald-50 border-emerald-200 text-emerald-800",
    dark: "bg-emerald-900/20 border-emerald-700/40 text-emerald-300",
    icon: "text-emerald-500",
  },
};

const ImmutabilityBanner = ({ text, variant = "info", documentType, compact = false }) => {
  const { isDarkMode } = useTheme();
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const colorClass = isDarkMode ? styles.dark : styles.light;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${colorClass}`}>
        <Lock className={`h-3.5 w-3.5 shrink-0 ${styles.icon}`} />
        <span>{text}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${colorClass}`}>
      <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-white/5" : "bg-white/60"}`}>
        <ShieldCheck className={`h-5 w-5 ${styles.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">
          {documentType ? `${documentType}: Immutable After Posting` : "Immutable After Posting"}
        </p>
        <p className="text-xs mt-1 opacity-80 leading-relaxed">{text}</p>
      </div>
    </div>
  );
};

export default ImmutabilityBanner;
