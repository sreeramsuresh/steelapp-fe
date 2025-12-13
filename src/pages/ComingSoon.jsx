// React import removed (unused)
import { Construction, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ComingSoon = ({ title }) => {
  return (
    <div className="coming-soon">
      <div className="coming-soon-content">
        <Construction size={64} className="coming-soon-icon" />
        <h1>{title}</h1>
        <p>
          This feature is coming soon! We&apos;re working hard to bring you the
          best steel business management tools.
        </p>
        <div className="coming-soon-features">
          <h3>What&apos;s planned:</h3>
          <ul>
            {title === "Customer Management" && (
              <>
                <li>Add and manage customer profiles</li>
                <li>Customer contact history</li>
                <li>Credit limit management</li>
                <li>Customer analytics</li>
              </>
            )}
            {title === "Steel Products" && (
              <>
                <li>Product catalog management</li>
                <li>Inventory tracking</li>
                <li>Price lists and updates</li>
                <li>Product specifications</li>
              </>
            )}
            {title === "Price Calculator" && (
              <>
                <li>Real-time steel price calculation</li>
                <li>Weight and dimension calculator</li>
                <li>Custom pricing rules</li>
                <li>Bulk quantity discounts</li>
              </>
            )}
            {title === "Sales Analytics" && (
              <>
                <li>Revenue reports and charts</li>
                <li>Customer sales analysis</li>
                <li>Product performance metrics</li>
                <li>Monthly/quarterly reports</li>
              </>
            )}
            {title === "Revenue Trends" && (
              <>
                <li>Revenue trend visualization</li>
                <li>Forecasting and predictions</li>
                <li>Seasonal analysis</li>
                <li>Growth metrics</li>
              </>
            )}
            {title === "Company Settings" && (
              <>
                <li>Company profile management</li>
                <li>Invoice templates customization</li>
                <li>Tax settings and rates</li>
                <li>User management</li>
              </>
            )}
          </ul>
        </div>
        <div className="coming-soon-actions">
          <Link to="/" className="btn btn-primary">
            <ArrowLeft size={18} />
            Back to Invoices
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
