import PropTypes from "prop-types";
import { useCallback } from "react";

/**
 * SourceTypeSelector Component
 *
 * Radio button group for selecting the stock source type.
 * Three options: Warehouse (stock), Local Drop-Ship, Import Drop-Ship.
 *
 * Warehouse: Requires batch allocation from existing stock
 * Local Drop-Ship: Direct from local supplier, no stock allocation needed
 * Import Drop-Ship: Direct from import, no stock allocation needed
 */
const SourceTypeSelector = ({ value, onChange, disabled = false }) => {
  const sourceTypes = [
    {
      value: "WAREHOUSE",
      label: "Warehouse",
      description: "From existing stock",
      icon: "🏭",
    },
    {
      value: "LOCAL_DROP_SHIP",
      label: "Local Drop-Ship",
      description: "Direct from local supplier",
      icon: "🚚",
    },
    {
      value: "IMPORT_DROP_SHIP",
      label: "Import Drop-Ship",
      description: "Direct from import",
      icon: "🚢",
    },
  ];

  const handleChange = useCallback(
    (sourceType) => {
      if (!disabled && onChange) {
        onChange(sourceType);
      }
    },
    [onChange, disabled]
  );

  return (
    <div className="source-type-selector" data-testid="source-type-selector">
      <div className="source-type-label">
        Source Type <span className="required">*</span>
      </div>
      <div className="source-type-options">
        {sourceTypes.map((sourceType) => (
          <label
            key={sourceType.value}
            className={`source-type-option ${value === sourceType.value ? "selected" : ""} ${disabled ? "disabled" : ""}`}
            data-testid={`source-type-${sourceType.value.toLowerCase()}`}
          >
            <input
              type="radio"
              name="sourceType"
              value={sourceType.value}
              checked={value === sourceType.value}
              onChange={() => handleChange(sourceType.value)}
              disabled={disabled}
              data-testid={`source-type-radio-${sourceType.value.toLowerCase()}`}
            />
            <span className="source-type-icon">{sourceType.icon}</span>
            <div className="source-type-text">
              <span className="source-type-name">{sourceType.label}</span>
              <span className="source-type-desc">{sourceType.description}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

SourceTypeSelector.propTypes = {
  value: PropTypes.oneOf(["WAREHOUSE", "LOCAL_DROP_SHIP", "IMPORT_DROP_SHIP"]),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default SourceTypeSelector;
