
import {
  ShoppingCart,
  Truck,
  Package,
  DollarSign,
  CreditCard,
} from 'lucide-react';

/**
 * Dataset Tabs Component
 * Navigation between different snapshot modules (Sales, Purchases, Inventory, VAT, Bank)
 */

export default function DatasetTabs({
  modules,
  activeModule,
  onModuleChange,
  recordCounts = {},
}) {
  const moduleConfig = {
    SALES: { icon: ShoppingCart, label: 'Sales', color: 'blue' },
    PURCHASES: { icon: Truck, label: 'Purchases', color: 'green' },
    INVENTORY: { icon: Package, label: 'Inventory', color: 'purple' },
    VAT: { icon: DollarSign, label: 'VAT', color: 'amber' },
    BANK: { icon: CreditCard, label: 'Bank', color: 'indigo' },
  };

  const colorClasses = {
    blue: 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400',
    green: 'border-b-2 border-green-600 text-green-600 dark:text-green-400',
    purple: 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400',
    amber: 'border-b-2 border-amber-600 text-amber-600 dark:text-amber-400',
    indigo: 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <div className="flex overflow-x-auto">
        {modules.map((module) => {
          const config = moduleConfig[module];
          const Icon = config.icon;
          const isActive = activeModule === module;
          const count = recordCounts[module] || 0;

          return (
            <button
              key={module}
              onClick={() => onModuleChange(module)}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all ${
                isActive
                  ? `${colorClasses[config.color]}`
                  : 'text-slate-600 dark:text-slate-400 border-b-2 border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
              {count > 0 && (
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    isActive
                      ? `bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
