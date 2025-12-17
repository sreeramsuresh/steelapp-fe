import * as React from "react";
import { Warehouse, Truck, Ship, ChevronDown } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "../../lib/utils";

/**
 * SourceTypeSelector Component
 * Dropdown selector for invoice line item source type
 * Options: Warehouse Stock, Local Drop-Ship, Import Drop-Ship
 */
const SourceTypeSelector = ({
  value = "WAREHOUSE",
  onChange,
  disabled = false,
  id,
  "data-testid": dataTestId,
}) => {
  const { isDarkMode } = useTheme();

  const options = [
    {
      value: "WAREHOUSE",
      label: "Warehouse Stock",
      shortLabel: "Warehouse",
      icon: Warehouse,
    },
    {
      value: "LOCAL_DROP_SHIP",
      label: "Local Drop-Ship",
      shortLabel: "Local Drop",
      icon: Truck,
    },
    {
      value: "IMPORT_DROP_SHIP",
      label: "Import Drop-Ship",
      shortLabel: "Import Drop",
      icon: Ship,
    },
  ];

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        data-testid={dataTestId}
        className={cn(
          "flex h-8 w-full min-w-[140px] max-w-[160px] items-center justify-between rounded-md border px-3 py-1.5 text-xs font-medium",
          "transition-all duration-200 cursor-pointer",
          "focus:outline-none focus:ring-1 focus:ring-teal-500",
          isDarkMode
            ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 focus:border-teal-500"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:border-teal-500",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <div className="flex items-center gap-2">
          <SelectedIcon
            className={cn(
              "h-4 w-4",
              isDarkMode ? "text-gray-400" : "text-gray-500",
            )}
          />
          <SelectPrimitive.Value />
        </div>
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5",
              isDarkMode ? "text-gray-400" : "text-gray-500",
            )}
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            isDarkMode
              ? "bg-gray-700 border-gray-600 text-gray-200"
              : "bg-white border-gray-300 text-gray-700",
          )}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => {
              const OptionIcon = option.icon;
              return (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-xs outline-none",
                    "focus:bg-accent focus:text-accent-foreground",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    isDarkMode
                      ? "hover:bg-gray-600 focus:bg-gray-600"
                      : "hover:bg-gray-100 focus:bg-gray-100",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <OptionIcon className="h-3 w-3" />
                    <SelectPrimitive.ItemText>
                      {option.shortLabel}
                    </SelectPrimitive.ItemText>
                  </div>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};

export default SourceTypeSelector;
