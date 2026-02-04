import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { productService } from "../../services/productService";

/**
 * WarehouseAvailability Component
 *
 * Displays stock availability for a selected product across all warehouses.
 * Shows warehouse name and available quantity with unit.
 * Now supports interactive selection for warehouse allocation.
 *
 * Note: companyId is automatically determined from authenticated user context on backend
 */
const WarehouseAvailability = ({
  productId,
  selectedWarehouseId = null,
  onWarehouseSelect = null,
  autoSelectFirst = true,
}) => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) {
      setWarehouses([]);
      return;
    }

    const fetchWarehouseStock = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch warehouse availability for the selected product
        // companyId is automatically added by backend from authenticated user
        const response = await productService.getWarehouseStock(productId);

        // productService returns { data: [...] } via axios
        setWarehouses(response.data || []);
      } catch (err) {
        console.error("Failed to fetch warehouse stock:", err);
        setError("Failed to load warehouse availability");
        setWarehouses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouseStock();
  }, [productId]);

  // Auto-select first warehouse with stock if enabled and no selection exists
  useEffect(() => {
    if (autoSelectFirst && warehouses.length > 0 && !selectedWarehouseId && onWarehouseSelect) {
      const firstWithStock = warehouses.find((wh) => parseFloat(wh.availableQuantity || 0) > 0);
      if (firstWithStock) {
        onWarehouseSelect(firstWithStock.warehouseId);
      }
    }
  }, [warehouses, selectedWarehouseId, autoSelectFirst, onWarehouseSelect]);

  if (!productId) {
    return null;
  }

  if (loading) {
    return (
      <div className="warehouse-availability">
        <div className="availability-label">Warehouse Availability</div>
        <div className="availability-loading">Loading warehouse stock...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="warehouse-availability">
        <div className="availability-label">Warehouse Availability</div>
        <div className="availability-error">{error}</div>
      </div>
    );
  }

  if (warehouses.length === 0) {
    return (
      <div className="warehouse-availability">
        <div className="availability-label">Warehouse Availability</div>
        <div className="availability-empty">No warehouses found</div>
      </div>
    );
  }

  const handleWarehouseClick = (warehouse) => {
    if (onWarehouseSelect) {
      onWarehouseSelect(warehouse.warehouseId);
    }
  };

  return (
    <div className="warehouse-availability" data-testid="warehouse-availability">
      <label htmlFor="warehouse-list" className="availability-label">
        Warehouse Availability
        {selectedWarehouseId && onWarehouseSelect && <span className="selection-hint"> (Click to change)</span>}
      </label>
      <div id="warehouse-list" className="warehouse-list" data-testid="warehouse-list">
        {warehouses.map((warehouse, index) => {
          const hasStock = parseFloat(warehouse.availableQuantity || 0) > 0;
          const isSelected = warehouse.warehouseId === selectedWarehouseId;

          return (
            <button
              type="button"
              key={warehouse.warehouseId}
              className={`warehouse-item ${isSelected ? "selected" : ""} ${hasStock ? "has-stock" : "no-stock"}`}
              data-testid={`warehouse-item-${index}`}
              data-warehouse-id={warehouse.warehouseId}
              data-has-stock={hasStock}
              data-selected={isSelected}
              onClick={() => handleWarehouseClick(warehouse)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleWarehouseClick(warehouse);
                }
              }}
              style={{ cursor: onWarehouseSelect ? "pointer" : "default" }}
            >
              <div className="warehouse-info">
                <span className="warehouse-name">{warehouse.warehouseName}</span>
                {warehouse.warehouseCode && <span className="warehouse-code">({warehouse.warehouseCode})</span>}
              </div>
              <div className="warehouse-stock">
                <span className="stock-quantity" data-testid={`warehouse-stock-${index}`}>
                  {parseFloat(warehouse.availableQuantity || 0).toFixed(2)}
                </span>
                <span className="stock-unit">{warehouse.unit}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

WarehouseAvailability.propTypes = {
  productId: PropTypes.number,
  selectedWarehouseId: PropTypes.number,
  onWarehouseSelect: PropTypes.func,
  autoSelectFirst: PropTypes.bool,
};

export default WarehouseAvailability;
