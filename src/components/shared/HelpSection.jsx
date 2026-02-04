import { Info } from "lucide-react";

/**
 * HelpSection Component
 * Displays helpful guidance, tips, or explanations about a feature or form
 * Supports bugs #18, #21, #22, #25, #27: Missing labels, filter explanations, badge legends, guidance
 */
const HelpSection = ({ title, items, variant = "info", icon: Icon = Info, showIcon = true }) => {
  const variantStyles = {
    info: "bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100",
    tip: "bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100",
    warning:
      "bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700 text-orange-900 dark:text-orange-100",
    success: "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-900 dark:text-green-100",
  };

  const headerTextColor = {
    info: "text-blue-900 dark:text-blue-100",
    tip: "text-amber-900 dark:text-amber-100",
    warning: "text-orange-900 dark:text-orange-100",
    success: "text-green-900 dark:text-green-100",
  };

  const iconColor = {
    info: "text-blue-600 dark:text-blue-400",
    tip: "text-amber-600 dark:text-amber-400",
    warning: "text-orange-600 dark:text-orange-400",
    success: "text-green-600 dark:text-green-400",
  };

  return (
    <div className={`p-4 rounded-lg border ${variantStyles[variant]}`}>
      <div className="flex items-start gap-3 mb-3">
        {showIcon && <Icon size={20} className={iconColor[variant]} />}
        {title && <h3 className={`font-semibold text-sm ${headerTextColor[variant]}`}>{title}</h3>}
      </div>
      {Array.isArray(items) ? (
        <ul className="space-y-1 text-sm list-disc list-inside">
          {items.map((item, _idx) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">{items}</p>
      )}
    </div>
  );
};

export default HelpSection;
