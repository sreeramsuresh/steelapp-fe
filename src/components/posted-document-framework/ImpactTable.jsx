import { useTheme } from "../../contexts/ThemeContext";

const DOMAIN_LABELS = {
  vat: "VAT Impact",
  gl: "General Ledger Impact",
  stock: "Stock Movement Impact",
  allocation: "Allocation Impact",
};

const ImpactTable = ({ domains = [], columns = [], rows = [] }) => {
  const { isDarkMode } = useTheme();

  if (!columns.length || !rows.length) return null;

  const domainLabel = domains.length > 0 ? DOMAIN_LABELS[domains[0]] || "Impact Summary" : "Impact Summary";

  return (
    <div className="space-y-2">
      <h4 className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{domainLabel}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr
              className={`border-b ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-2 px-3 text-left font-medium ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const isTotal = row._isTotal;
              return (
                <tr
                  key={row._key || rowIdx}
                  className={`border-b last:border-0 ${
                    isDarkMode ? "border-gray-700/50" : "border-gray-100"
                  } ${isTotal ? (isDarkMode ? "bg-gray-800/50" : "bg-gray-50") : ""}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-2 px-3 ${col.align === "right" ? "text-right font-mono tabular-nums" : ""} ${
                        isTotal ? "font-semibold" : ""
                      } ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {row[col.key] ?? ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ImpactTable;
