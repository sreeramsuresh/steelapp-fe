/**
 * VAT Rules Help Panel Component
 *
 * Comprehensive help documentation for UAE VAT Rules
 * Based on UAE VAT Law (Federal Decree-Law No. 8 of 2017)
 */

import { useState } from 'react';
import {
  BookOpen,
  Calculator,
  MapPin,
  RefreshCw,
  FileText,
  FileMinus,
  ArrowDownCircle,
  Package,
  Lightbulb,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Info,
  ChevronsDown,
  ChevronsUp,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Collapsible section component
const HelpSection = ({ title, icon: Icon, children, isOpen, onToggle }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} last:border-b-0`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between py-4 px-1 text-left hover:bg-opacity-50 transition-colors ${
          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <Icon
              className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
            />
          )}
          <span
            className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown
            className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          />
        ) : (
          <ChevronRight
            className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          />
        )}
      </button>
      {isOpen && (
        <div
          className={`pb-4 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// External link component
const ExtLink = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
  >
    {children}
    <ExternalLink className="h-3 w-3" />
  </a>
);

// Info box component
const InfoBox = ({ type = 'info', title, children, icon: Icon }) => {
  const { isDarkMode } = useTheme();

  const styles = {
    info: isDarkMode
      ? 'bg-blue-900/30 border-blue-700'
      : 'bg-blue-50 border-blue-200',
    warning: isDarkMode
      ? 'bg-yellow-900/30 border-yellow-700'
      : 'bg-yellow-50 border-yellow-200',
    success: isDarkMode
      ? 'bg-green-900/30 border-green-700'
      : 'bg-green-50 border-green-200',
    danger: isDarkMode
      ? 'bg-red-900/30 border-red-700'
      : 'bg-red-50 border-red-200',
  };

  const iconColors = {
    info: isDarkMode ? 'text-blue-400' : 'text-blue-600',
    warning: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
    success: isDarkMode ? 'text-green-400' : 'text-green-600',
    danger: isDarkMode ? 'text-red-400' : 'text-red-600',
  };

  return (
    <div className={`p-3 rounded-lg border ${styles[type]}`}>
      <div className="flex items-start gap-2">
        {Icon && (
          <Icon
            className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColors[type]}`}
          />
        )}
        <div className="text-sm flex-1">
          {title && <strong className="block mb-1">{title}</strong>}
          {children}
        </div>
      </div>
    </div>
  );
};

const VATRulesHelpPanel = ({ onClose }) => {
  const { isDarkMode } = useTheme();

  // State to track which sections are open (all start collapsed)
  const [openSections, setOpenSections] = useState({
    overview: false,
    rates: false,
    zones: false,
    reverse: false,
    invoice: false,
    credit: false,
    input: false,
    import: false,
    scenarios: false,
    reference: false,
  });

  const expandAll = () => {
    setOpenSections({
      overview: true,
      rates: true,
      zones: true,
      reverse: true,
      invoice: true,
      credit: true,
      input: true,
      import: true,
      scenarios: true,
      reference: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      overview: false,
      rates: false,
      zones: false,
      reverse: false,
      invoice: false,
      credit: false,
      input: false,
      import: false,
      scenarios: false,
      reference: false,
    });
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div
      className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      {/* Header */}
      <div
        className={`px-5 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen
              className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
            />
            <h2
              className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              UAE VAT Rules Guide
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className={`p-1.5 rounded transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-teal-400'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-teal-600'
              }`}
              title="Expand All Sections"
            >
              <ChevronsDown className="h-4 w-4" />
            </button>
            <button
              onClick={collapseAll}
              className={`p-1.5 rounded transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-teal-400'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-teal-600'
              }`}
              title="Collapse All Sections"
            >
              <ChevronsUp className="h-4 w-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700`}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {/* Section 1: Overview of UAE VAT */}
        <HelpSection
          title="Overview of UAE VAT"
          icon={BookOpen}
          isOpen={openSections.overview}
          onToggle={() => toggleSection('overview')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What is UAE VAT?</h4>
              <p className="text-sm">
                Value Added Tax (VAT) was introduced in the UAE on January 1,
                2018, under Federal Decree-Law No. 8 of 2017. It&apos;s an
                indirect consumption tax applied on most goods and services at
                each stage of the supply chain. The standard rate is 5%, making
                it one of the lowest VAT rates globally.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Who Must Register?</h4>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Mandatory</strong>: Businesses with taxable supplies
                  exceeding AED 375,000 per year
                </li>
                <li>
                  <strong>Voluntary</strong>: Businesses with taxable supplies
                  between AED 187,500 and AED 375,000
                </li>
                <li>
                  <strong>Exempt</strong>: Small businesses below AED 187,500
                  threshold
                </li>
              </ul>
            </div>

            <InfoBox type="info" icon={Info} title="Key Principle">
              VAT is borne by the end consumer. Registered businesses collect
              VAT on behalf of the Federal Tax Authority (FTA) and can recover
              VAT paid on business purchases (input tax).
            </InfoBox>

            <div>
              <h4 className="font-medium mb-2">Tax Period & Filing</h4>
              <p className="text-sm mb-2">
                VAT returns must be filed quarterly or monthly, depending on
                your business size:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Quarterly</strong>: Most businesses (due 28 days after
                  period end)
                </li>
                <li>
                  <strong>Monthly</strong>: Businesses with annual turnover
                  exceeding AED 150 million
                </li>
              </ul>
            </div>
          </div>
        </HelpSection>

        {/* Section 2: Standard VAT Rates */}
        <HelpSection
          title="Standard VAT Rates"
          icon={Calculator}
          isOpen={openSections.rates}
          onToggle={() => toggleSection('rates')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">UAE VAT Rate Structure</h4>
              <div
                className={`text-sm rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}>
                      <th className="px-3 py-2 text-left">Rate</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-left">Application</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">5%</td>
                      <td className="px-3 py-2">Standard Rate</td>
                      <td className="px-3 py-2">Most goods and services</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">0%</td>
                      <td className="px-3 py-2">Zero-Rated</td>
                      <td className="px-3 py-2">
                        Exports, international transport, specific goods
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">N/A</td>
                      <td className="px-3 py-2">Exempt</td>
                      <td className="px-3 py-2">
                        Residential property, local passenger transport, etc.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">
                When to Apply Standard 5% VAT
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Domestic sales of goods within the UAE</li>
                <li>Services provided and consumed within the UAE</li>
                <li>
                  Imports from outside the GCC (unless specifically zero-rated)
                </li>
                <li>Hotel accommodations and food services</li>
                <li>Professional services (consulting, legal, accounting)</li>
              </ul>
            </div>

            <InfoBox type="warning" icon={AlertTriangle} title="Common Mistake">
              Don&apos;t confuse zero-rated with exempt! Zero-rated supplies
              (0%) allow input tax recovery, while exempt supplies don&apos;t.
              This significantly impacts your cash flow and VAT position.
            </InfoBox>

            <div>
              <h4 className="font-medium mb-2">
                Steel Trading - Standard Rate Application
              </h4>
              <p className="text-sm">
                For <strong>stainless steel trading</strong>, the standard 5%
                VAT applies to:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Local sales to UAE-based customers (B2B and B2C)</li>
                <li>
                  Sales to designated zone customers who are not qualified
                </li>
                <li>Services such as cutting, polishing, or fabrication</li>
              </ul>
            </div>
          </div>
        </HelpSection>

        {/* Section 3: Designated Zones & Zero-Rating */}
        <HelpSection
          title="Designated Zones & Zero-Rating"
          icon={MapPin}
          isOpen={openSections.zones}
          onToggle={() => toggleSection('zones')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What Are Designated Zones?</h4>
              <p className="text-sm mb-2">
                Designated Zones are specific free zones where special VAT rules
                apply. They are treated as being outside the UAE for VAT
                purposes. Cabinet Decision No. 58 of 2017 lists all designated
                zones.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Zero-Rating Conditions</h4>
              <p className="text-sm mb-2">
                Supplies to designated zones are zero-rated (0%) when ALL
                conditions are met:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  The customer is a &quot;Qualified Person&quot; registered in a
                  designated zone
                </li>
                <li>Goods are physically delivered to the designated zone</li>
                <li>
                  Proper documentation is maintained (delivery note, customs
                  declaration)
                </li>
                <li>
                  The customer&apos;s DAFZA/JAFZA/other zone certificate is
                  verified
                </li>
              </ul>
            </div>

            <InfoBox
              type="danger"
              icon={AlertTriangle}
              title="Critical Compliance Requirement"
            >
              You must verify the customer&apos;s qualified status BEFORE
              applying 0% VAT. If FTA later determines the customer was not
              qualified, you&apos;ll be liable for the VAT at 5% plus penalties.
            </InfoBox>

            <div>
              <h4 className="font-medium mb-2">Documentation Requirements</h4>
              <p className="text-sm mb-2">
                To support zero-rating, you must keep records of:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Customer&apos;s Designated Zone certificate or license</li>
                <li>Proof of delivery to the designated zone address</li>
                <li>
                  Tax invoice clearly stating &quot;Zero-Rated Supply&quot;
                </li>
                <li>Customs documentation if applicable</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Common Designated Zones</h4>
              <div className="text-sm grid grid-cols-2 gap-2">
                <ul className="space-y-0.5 list-disc list-inside ml-2">
                  <li>Jebel Ali Free Zone (JAFZA)</li>
                  <li>Dubai Airport Free Zone (DAFZA)</li>
                  <li>Hamriyah Free Zone</li>
                </ul>
                <ul className="space-y-0.5 list-disc list-inside ml-2">
                  <li>Ajman Free Zone</li>
                  <li>Ras Al Khaimah FTZ</li>
                  <li>Abu Dhabi Ports Free Zones</li>
                </ul>
              </div>
              <p className="text-sm mt-2">
                <ExtLink href="https://tax.gov.ae/en/designated.zones.aspx">
                  View full list of designated zones on FTA website
                </ExtLink>
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">ERP Implementation</h4>
              <p className="text-sm">In this ERP, when creating a customer:</p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  Mark customer as &quot;Designated Zone&quot; if qualified
                </li>
                <li>Upload zone certificate in customer documents</li>
                <li>System will automatically apply 0% VAT on invoices</li>
                <li>Ensure delivery address matches zone location</li>
              </ul>
            </div>
          </div>
        </HelpSection>

        {/* Section 4: Reverse Charge Mechanism */}
        <HelpSection
          title="Reverse Charge Mechanism"
          icon={RefreshCw}
          isOpen={openSections.reverse}
          onToggle={() => toggleSection('reverse')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What is Reverse Charge?</h4>
              <p className="text-sm">
                The reverse charge mechanism shifts the responsibility for
                reporting VAT from the supplier to the customer. Instead of the
                supplier charging VAT, the customer self-accounts for the VAT in
                their own VAT return (both as output and input tax, typically
                resulting in a net-zero position).
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">
                When Does Reverse Charge Apply?
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Imports from outside the GCC</strong>: VAT paid at
                  customs, you self-account in VAT return
                </li>
                <li>
                  <strong>Purchases from non-GCC suppliers</strong>: Services
                  received from abroad (consulting, software licenses)
                </li>
                <li>
                  <strong>Gold, silver, or platinum</strong>: Special rules for
                  precious metals trading
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">How It Works - Example</h4>
              <div
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <p className="text-sm font-medium mb-2">
                  Scenario: You import stainless steel coils from China worth
                  AED 100,000
                </p>
                <ol className="text-sm space-y-1 list-decimal list-inside ml-2">
                  <li>Customs assesses VAT: AED 5,000 (5% of AED 100,000)</li>
                  <li>You pay VAT to customs at the time of import</li>
                  <li>
                    In your VAT return, report:
                    <ul className="ml-6 mt-1 space-y-0.5 list-disc list-inside">
                      <li>Output VAT (Box 1): AED 5,000</li>
                      <li>Input VAT (Box 8): AED 5,000 (recoverable)</li>
                    </ul>
                  </li>
                  <li>Net effect: Zero VAT liability on this transaction</li>
                </ol>
              </div>
            </div>

            <InfoBox type="info" icon={Info} title="Cash Flow Consideration">
              Even though the net VAT is zero, you still pay VAT at customs
              upfront. This impacts cash flow until your next VAT return when
              you recover the input tax.
            </InfoBox>

            <div>
              <h4 className="font-medium mb-2">
                Invoice Requirements for Reverse Charge
              </h4>
              <p className="text-sm mb-2">
                If you&apos;re the supplier in a reverse charge situation (e.g.,
                UAE company providing services to a GCC customer):
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  Invoice must state &quot;Reverse Charge&quot; or &quot;Subject
                  to Reverse Charge by Customer&quot;
                </li>
                <li>No VAT should be charged on the invoice</li>
                <li>Customer&apos;s TRN must be shown</li>
                <li>
                  Invoice must clearly identify the reason for reverse charge
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">ERP Handling</h4>
              <p className="text-sm">
                This system handles reverse charge scenarios:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Import container records auto-flag reverse charge</li>
                <li>VAT paid at customs is tracked separately</li>
                <li>
                  Reports show reverse charge amounts for VAT return filing
                </li>
              </ul>
            </div>
          </div>
        </HelpSection>

        {/* Section 5: Tax Invoice Requirements */}
        <HelpSection
          title="Tax Invoice Requirements"
          icon={FileText}
          isOpen={openSections.invoice}
          onToggle={() => toggleSection('invoice')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What is a Tax Invoice?</h4>
              <p className="text-sm">
                A tax invoice is the primary evidence of a taxable supply under
                UAE VAT law. Only VAT-registered businesses can issue tax
                invoices. The invoice must comply with Article 59 of the
                Executive Regulations to allow customers to recover input VAT.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">
                Mandatory Information on Tax Invoices
              </h4>
              <div
                className={`text-sm rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}>
                      <th className="px-3 py-2 text-left">Field</th>
                      <th className="px-3 py-2 text-left">Requirement</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">Invoice Number</td>
                      <td className="px-3 py-2">
                        Sequential, unique identifier
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">Date of Issue</td>
                      <td className="px-3 py-2">Date invoice was created</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">
                        Supplier Name & Address
                      </td>
                      <td className="px-3 py-2">Full legal name and address</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">Supplier TRN</td>
                      <td className="px-3 py-2">
                        15-digit Tax Registration Number
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">
                        Customer Name & Address
                      </td>
                      <td className="px-3 py-2">Full legal name and address</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">Customer TRN</td>
                      <td className="px-3 py-2">
                        Required if customer is VAT-registered
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">
                        Item Description
                      </td>
                      <td className="px-3 py-2">
                        Clear description of goods/services
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">
                        Quantity & Unit Price
                      </td>
                      <td className="px-3 py-2">For each item supplied</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">Taxable Amount</td>
                      <td className="px-3 py-2">Total amount before VAT</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">VAT Rate</td>
                      <td className="px-3 py-2">
                        5%, 0%, or &quot;Exempt&quot;
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">VAT Amount</td>
                      <td className="px-3 py-2">VAT charged (in AED)</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">
                        Total Amount Due
                      </td>
                      <td className="px-3 py-2">Amount including VAT</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <InfoBox
              type="danger"
              icon={AlertTriangle}
              title="Critical - Missing TRN"
            >
              If your invoice is missing the supplier TRN or customer TRN (when
              applicable), the customer CANNOT recover input VAT, and you may
              face penalties of AED 2,500 per invoice (up to AED 20,000).
            </InfoBox>

            <div>
              <h4 className="font-medium mb-2">Simplified Tax Invoices</h4>
              <p className="text-sm mb-2">
                For transactions under AED 10,000, you can issue simplified tax
                invoices with fewer requirements:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Supplier name, address, and TRN</li>
                <li>Invoice date and number</li>
                <li>Description and total amount (including VAT)</li>
                <li>VAT amount or statement &quot;VAT included&quot;</li>
              </ul>
              <p className="text-sm mt-2">
                <strong>Note:</strong> Simplified invoices are typically used
                for retail or B2C transactions.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Invoice Issuance Timeline</h4>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Goods</strong>: Issue within 14 days of supply
                </li>
                <li>
                  <strong>Services</strong>: Issue within 14 days of service
                  completion or payment (whichever is earlier)
                </li>
                <li>
                  <strong>Continuous services</strong>: Issue within 14 days of
                  each billing period
                </li>
              </ul>
            </div>

            <InfoBox type="success" icon={Info} title="ERP Auto-Compliance">
              This ERP system automatically includes all required fields on tax
              invoices and ensures sequential numbering. Your company TRN is
              pulled from company settings, and customer TRNs are verified via
              FTA integration.
            </InfoBox>
          </div>
        </HelpSection>

        {/* Section 6: Credit Notes & Adjustments */}
        <HelpSection
          title="Credit Notes & Adjustments"
          icon={FileMinus}
          isOpen={openSections.credit}
          onToggle={() => toggleSection('credit')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What is a Credit Note?</h4>
              <p className="text-sm">
                A credit note is a document issued to reduce the value of a
                previously issued tax invoice. It adjusts the VAT reported to
                FTA and provides evidence for input tax adjustment by the
                customer. Credit notes are governed by Article 60 of the
                Executive Regulations.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">When to Issue Credit Notes</h4>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Goods returned</strong>: Customer returns defective or
                  incorrect items
                </li>
                <li>
                  <strong>Price reduction</strong>: Discount applied after
                  invoice issued
                </li>
                <li>
                  <strong>Invoice error</strong>: Overcharged quantity, wrong
                  price, incorrect VAT rate
                </li>
                <li>
                  <strong>Bad debt relief</strong>: Debt becomes uncollectible
                  (special rules apply)
                </li>
                <li>
                  <strong>Cancelled transaction</strong>: Sale cancelled after
                  invoice issued
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Credit Note Requirements</h4>
              <p className="text-sm mb-2">A valid credit note must include:</p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>The words &quot;Credit Note&quot; prominently displayed</li>
                <li>Unique sequential credit note number</li>
                <li>Date of issue</li>
                <li>Reference to original tax invoice number and date</li>
                <li>Supplier and customer details (name, address, TRN)</li>
                <li>Description of reason for credit</li>
                <li>Amount of taxable supply being reduced</li>
                <li>Amount of VAT being adjusted</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">
                VAT Treatment of Credit Notes
              </h4>
              <div
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <p className="text-sm font-medium mb-2">
                  Example: Original invoice for AED 10,000 + AED 500 VAT
                </p>
                <p className="text-sm mb-2">
                  Customer returns AED 2,000 worth of goods:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                  <li>
                    <strong>Credit Note Amount</strong>: AED 2,000
                  </li>
                  <li>
                    <strong>VAT Adjustment</strong>: AED 100 (5% of AED 2,000)
                  </li>
                  <li>
                    <strong>Your VAT return</strong>: Reduce output VAT by AED
                    100 in the period credit note is issued
                  </li>
                  <li>
                    <strong>Customer&apos;s VAT return</strong>: Reduce input
                    VAT by AED 100
                  </li>
                </ul>
              </div>
            </div>

            <InfoBox
              type="warning"
              icon={AlertTriangle}
              title="Timing is Critical"
            >
              Credit notes must be issued within the same tax period if
              possible, or the next tax period at the latest. Both you and your
              customer must adjust VAT in the period the credit note is issued,
              not when the original invoice was issued.
            </InfoBox>

            <div>
              <h4 className="font-medium mb-2">Debit Notes</h4>
              <p className="text-sm mb-2">
                Debit notes are used when the original invoice undercharged:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Price increase after original supply</li>
                <li>Additional goods delivered</li>
                <li>Error resulting in undercharge</li>
              </ul>
              <p className="text-sm mt-2">
                Debit notes increase both output VAT (supplier) and input VAT
                (customer).
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Bad Debt Relief</h4>
              <p className="text-sm mb-2">
                If a debt is written off as bad debt, you can recover the VAT
                you paid to FTA:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Debt must be at least 12 months overdue from due date</li>
                <li>You must have written off the debt in your accounts</li>
                <li>
                  You must notify the customer (they must adjust their input
                  VAT)
                </li>
                <li>
                  Claim relief by adjusting your VAT return (reduce output VAT)
                </li>
              </ul>
            </div>

            <InfoBox type="info" icon={Info} title="ERP Support">
              This system tracks credit notes linked to original invoices,
              auto-calculates VAT adjustments, and flags aging receivables for
              bad debt relief consideration.
            </InfoBox>
          </div>
        </HelpSection>

        {/* Section 7: Input Tax Recovery */}
        <HelpSection
          title="Input Tax Recovery"
          icon={ArrowDownCircle}
          isOpen={openSections.input}
          onToggle={() => toggleSection('input')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What is Input Tax?</h4>
              <p className="text-sm">
                Input tax is the VAT you pay on business purchases and expenses.
                If you&apos;re a registered business making taxable supplies,
                you can generally recover (reclaim) this VAT by deducting it
                from the output VAT you owe to FTA.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Recoverable Input Tax</h4>
              <p className="text-sm mb-2">You can recover VAT paid on:</p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Goods purchased for resale</li>
                <li>Raw materials and inventory</li>
                <li>Business assets (equipment, vehicles, machinery)</li>
                <li>Operating expenses (rent, utilities, professional fees)</li>
                <li>Imports (VAT paid at customs)</li>
                <li>Business travel and entertainment (within limits)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">
                Non-Recoverable Input Tax (Blocked)
              </h4>
              <p className="text-sm mb-2">You CANNOT recover VAT on:</p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Entertainment</strong>: Client entertainment, leisure
                  activities (Article 53)
                </li>
                <li>
                  <strong>Personal use</strong>: Goods/services for personal
                  consumption
                </li>
                <li>
                  <strong>Exempt supplies</strong>: Purchases related to making
                  exempt supplies
                </li>
                <li>
                  <strong>Motor vehicles</strong>: Cars not used 100% for
                  business (partial recovery rules apply)
                </li>
                <li>
                  <strong>Non-business activities</strong>: Expenses unrelated
                  to taxable business
                </li>
              </ul>
            </div>

            <InfoBox
              type="danger"
              icon={AlertTriangle}
              title="Entertainment Expenses"
            >
              UAE has strict rules on entertainment expenses. VAT on meals for
              business purposes may be recoverable, but VAT on client
              entertainment, gifts, and hospitality is typically blocked. Keep
              detailed records to justify business purpose.
            </InfoBox>

            <div>
              <h4 className="font-medium mb-2">
                Conditions for Input Tax Recovery
              </h4>
              <p className="text-sm mb-2">To claim input VAT, you must:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside ml-2">
                <li>Hold a valid tax invoice showing your name and TRN</li>
                <li>Use the goods/services for making taxable supplies</li>
                <li>Have paid the VAT (either directly or at customs)</li>
                <li>
                  Not fall under blocked categories (entertainment, personal
                  use)
                </li>
                <li>Claim within 5 years of the date of supply</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">
                Partial Exemption - Mixed Supplies
              </h4>
              <p className="text-sm">
                If you make both taxable and exempt supplies, you can only
                recover input VAT attributable to taxable supplies. Use the
                standard method:
              </p>
              <div
                className={`p-3 rounded-lg mt-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <p className="text-sm font-medium mb-1">
                  Recovery Percentage Formula:
                </p>
                <p className="text-sm">
                  (Taxable Supplies ÷ Total Supplies) × 100
                </p>
                <p className="text-sm mt-2 italic">
                  Example: If 80% of your supplies are taxable, you recover 80%
                  of general overheads VAT.
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Capital Assets Recovery</h4>
              <p className="text-sm">
                For capital assets (equipment, vehicles, property) costing over
                AED 5,000, you must apply the Capital Asset Adjustment rules if
                the asset&apos;s use changes within 5 years (10 years for
                property). This may result in additional VAT recovery or
                clawback.
              </p>
            </div>

            <InfoBox
              type="success"
              icon={Info}
              title="Steel Trading - Full Recovery"
            >
              In stainless steel trading, you typically make 100% taxable
              supplies (standard-rated or zero-rated exports). This means you
              can recover all input VAT on business purchases, maximizing cash
              flow.
            </InfoBox>

            <div>
              <h4 className="font-medium mb-2">ERP Input Tax Tracking</h4>
              <p className="text-sm">This system tracks input VAT from:</p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Purchase orders and supplier invoices</li>
                <li>Import containers (VAT paid at customs)</li>
                <li>Expense entries</li>
              </ul>
              <p className="text-sm mt-2">
                Reports aggregate recoverable input VAT for your VAT return
                filing.
              </p>
            </div>
          </div>
        </HelpSection>

        {/* Section 8: Import VAT & Export Zero-Rating */}
        <HelpSection
          title="Import VAT & Export Zero-Rating"
          icon={Package}
          isOpen={openSections.import}
          onToggle={() => toggleSection('import')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Import VAT - Overview</h4>
              <p className="text-sm">
                When importing goods into the UAE from outside the GCC, VAT is
                assessed and collected by UAE Customs at the point of entry.
                This is separate from customs duties and is based on the CIF
                value (Cost + Insurance + Freight) plus any customs duties.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Import VAT Calculation</h4>
              <div
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <p className="text-sm font-medium mb-2">
                  Example: Importing steel coils from China
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                  <li>
                    <strong>CIF Value</strong>: AED 100,000
                  </li>
                  <li>
                    <strong>Customs Duty (5%)</strong>: AED 5,000
                  </li>
                  <li>
                    <strong>Taxable Base</strong>: AED 105,000 (CIF + Customs
                    Duty)
                  </li>
                  <li>
                    <strong>Import VAT (5%)</strong>: AED 5,250
                  </li>
                  <li>
                    <strong>Total Payment at Customs</strong>: AED 10,250 (Duty
                    + VAT)
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Recovering Import VAT</h4>
              <p className="text-sm mb-2">
                As a VAT-registered business, you can recover import VAT:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  Report the import VAT in your VAT return (Box 8 - Input Tax)
                </li>
                <li>Must hold customs declaration showing VAT paid</li>
                <li>Goods must be used for making taxable supplies</li>
                <li>
                  Typically results in net-zero VAT liability (reverse charge
                  mechanism)
                </li>
              </ul>
            </div>

            <InfoBox
              type="warning"
              icon={AlertTriangle}
              title="Cash Flow Impact"
            >
              Even though import VAT is recoverable, you pay it upfront at
              customs. For large shipments, this can significantly impact
              working capital until the next VAT return period.
            </InfoBox>

            <div>
              <h4 className="font-medium mb-2">Import VAT Deferment Scheme</h4>
              <p className="text-sm mb-2">
                To ease cash flow, eligible businesses can apply for the Import
                VAT Deferment Scheme:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Defer payment of import VAT until the next VAT return</li>
                <li>
                  Report as both output and input VAT in the same return
                  (net-zero)
                </li>
                <li>Requires bank guarantee or bond</li>
                <li>Application through FTA e-Services</li>
              </ul>
            </div>

            <div className="border-t pt-4 mt-4 border-gray-300 dark:border-gray-600">
              <h4 className="font-medium mb-2">
                Export Zero-Rating - Overview
              </h4>
              <p className="text-sm">
                Exports of goods to destinations outside the GCC are zero-rated
                (0% VAT). This encourages UAE businesses to compete
                internationally while allowing them to recover input VAT on
                related costs.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">
                Conditions for Export Zero-Rating
              </h4>
              <p className="text-sm mb-2">
                To qualify for 0% VAT on exports, ALL of these must be met:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Physical export</strong>: Goods must physically leave
                  the UAE/GCC
                </li>
                <li>
                  <strong>Customs documentation</strong>: Export customs
                  declaration stamped by UAE Customs
                </li>
                <li>
                  <strong>Commercial evidence</strong>: Bill of Lading, Airway
                  Bill, or shipping documents
                </li>
                <li>
                  <strong>Export timeline</strong>: Goods exported within 90
                  days of supply (can extend to 12 months with approval)
                </li>
                <li>
                  <strong>Non-GCC destination</strong>: Exports within GCC do
                  not qualify for zero-rating
                </li>
              </ul>
            </div>

            <InfoBox
              type="danger"
              icon={AlertTriangle}
              title="Critical - Documentation Retention"
            >
              You must keep export documentation for at least 5 years. In case
              of FTA audit, failure to produce evidence may result in VAT
              assessment at 5% plus penalties.
            </InfoBox>

            <div>
              <h4 className="font-medium mb-2">
                Export Documentation Requirements
              </h4>
              <div
                className={`text-sm rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}>
                      <th className="px-3 py-2 text-left">Document</th>
                      <th className="px-3 py-2 text-left">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">Tax Invoice</td>
                      <td className="px-3 py-2">
                        Showing 0% VAT and &quot;Zero-Rated Export&quot;
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">
                        Customs Declaration
                      </td>
                      <td className="px-3 py-2">
                        Proof goods cleared UAE Customs for export
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">
                        Bill of Lading / Airway Bill
                      </td>
                      <td className="px-3 py-2">
                        Commercial transport document
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">
                        Commercial Invoice
                      </td>
                      <td className="px-3 py-2">
                        Detailing goods, prices, customer
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Indirect Exports</h4>
              <p className="text-sm">
                If you sell to a UAE-based customer who then exports the goods,
                the supply is standard-rated (5%) to you. The customer can claim
                zero-rating when they export. You cannot zero-rate unless you
                are the exporter of record.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">ERP Export & Import Handling</h4>
              <p className="text-sm">This system manages:</p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Import Containers</strong>: Track customs VAT paid,
                  link to purchases
                </li>
                <li>
                  <strong>Export Invoices</strong>: Auto-apply 0% VAT, require
                  export documentation upload
                </li>
                <li>
                  <strong>Compliance Alerts</strong>: Flag missing export
                  documents or expiring 90-day deadline
                </li>
              </ul>
            </div>
          </div>
        </HelpSection>

        {/* Section 9: Common Steel Trading Scenarios */}
        <HelpSection
          title="Common Steel Trading Scenarios"
          icon={Lightbulb}
          isOpen={openSections.scenarios}
          onToggle={() => toggleSection('scenarios')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Scenario-Based VAT Guidance</h4>
              <p className="text-sm">
                The following scenarios are common in stainless steel B2B
                trading. Each scenario includes the correct VAT treatment and
                practical considerations.
              </p>
            </div>

            {/* Scenario 1 */}
            <div
              className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
            >
              <h5 className="font-medium mb-2 text-sm">
                Scenario 1: Domestic Sale to UAE Customer
              </h5>
              <p className="text-sm mb-2">
                <strong>Situation:</strong> You sell 10 tons of stainless steel
                sheets to a UAE-based fabricator in Dubai.
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>VAT Rate</strong>: 5% (Standard Rate)
                </li>
                <li>
                  <strong>Invoice</strong>: Must include both your TRN and
                  customer&apos;s TRN (if registered)
                </li>
                <li>
                  <strong>Delivery</strong>: Within UAE mainland
                </li>
                <li>
                  <strong>Customer Recovery</strong>: Customer can recover 5% as
                  input VAT (if registered)
                </li>
              </ul>
            </div>

            {/* Scenario 2 */}
            <div
              className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
            >
              <h5 className="font-medium mb-2 text-sm">
                Scenario 2: Sale to JAFZA Qualified Customer
              </h5>
              <p className="text-sm mb-2">
                <strong>Situation:</strong> You sell 20 tons of steel coils to a
                company registered in Jebel Ali Free Zone.
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>VAT Rate</strong>: 0% (Zero-Rated) if customer is
                  &quot;Qualified Person&quot;
                </li>
                <li>
                  <strong>Pre-Requisite</strong>: Verify customer&apos;s JAFZA
                  certificate
                </li>
                <li>
                  <strong>Delivery</strong>: Must be to JAFZA address (physical
                  delivery proof required)
                </li>
                <li>
                  <strong>Invoice</strong>: State &quot;Zero-Rated Supply to
                  Designated Zone&quot;
                </li>
                <li>
                  <strong>Records</strong>: Keep zone certificate, delivery
                  note, and invoice
                </li>
              </ul>
            </div>

            {/* Scenario 3 */}
            <div
              className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
            >
              <h5 className="font-medium mb-2 text-sm">
                Scenario 3: Export to Saudi Arabia (GCC)
              </h5>
              <p className="text-sm mb-2">
                <strong>Situation:</strong> You export steel pipes to a customer
                in Riyadh, Saudi Arabia.
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>VAT Rate</strong>: 5% (Standard Rate) - GCC exports
                  are NOT zero-rated
                </li>
                <li>
                  <strong>Exception</strong>: If shipped to Saudi designated
                  zone, 0% may apply
                </li>
                <li>
                  <strong>Documentation</strong>: GCC customs declaration
                </li>
                <li>
                  <strong>Customer VAT</strong>: Customer pays Saudi VAT on
                  import to Saudi Arabia
                </li>
              </ul>
            </div>

            {/* Scenario 4 */}
            <div
              className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
            >
              <h5 className="font-medium mb-2 text-sm">
                Scenario 4: Export to India (Non-GCC)
              </h5>
              <p className="text-sm mb-2">
                <strong>Situation:</strong> You export 50 tons of stainless
                steel bars to Mumbai, India.
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>VAT Rate</strong>: 0% (Zero-Rated Export)
                </li>
                <li>
                  <strong>Documentation</strong>: UAE Customs export declaration
                  + Bill of Lading
                </li>
                <li>
                  <strong>Timeline</strong>: Export within 90 days of invoice
                  date
                </li>
                <li>
                  <strong>Input VAT</strong>: You can recover all VAT paid on
                  related costs
                </li>
                <li>
                  <strong>Invoice</strong>: Clearly state &quot;Zero-Rated
                  Export&quot;
                </li>
              </ul>
            </div>

            {/* Scenario 5 */}
            <div
              className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
            >
              <h5 className="font-medium mb-2 text-sm">
                Scenario 5: Importing from China
              </h5>
              <p className="text-sm mb-2">
                <strong>Situation:</strong> You import a 40ft container of steel
                coils from Shanghai.
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Customs Duty</strong>: Typically 5% on CIF value
                  (check HS Code)
                </li>
                <li>
                  <strong>Import VAT</strong>: 5% on (CIF + Customs Duty)
                </li>
                <li>
                  <strong>Payment</strong>: Pay at UAE Customs before clearance
                </li>
                <li>
                  <strong>Recovery</strong>: Report import VAT as both output
                  and input (net-zero)
                </li>
                <li>
                  <strong>Documentation</strong>: Keep customs declaration and
                  payment receipt
                </li>
              </ul>
            </div>

            {/* Scenario 6 */}
            <div
              className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
            >
              <h5 className="font-medium mb-2 text-sm">
                Scenario 6: Customer Returns Defective Goods
              </h5>
              <p className="text-sm mb-2">
                <strong>Situation:</strong> A customer returns AED 5,000 worth
                of defective steel sheets.
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Action</strong>: Issue a Credit Note
                </li>
                <li>
                  <strong>Credit Note Amount</strong>: AED 5,000
                </li>
                <li>
                  <strong>VAT Adjustment</strong>: AED 250 (5%)
                </li>
                <li>
                  <strong>Your VAT Return</strong>: Reduce output VAT by AED 250
                </li>
                <li>
                  <strong>Customer&apos;s VAT Return</strong>: Reduce input VAT
                  by AED 250
                </li>
                <li>
                  <strong>Timing</strong>: Issue credit note in same or next tax
                  period
                </li>
              </ul>
            </div>

            {/* Scenario 7 */}
            <div
              className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
            >
              <h5 className="font-medium mb-2 text-sm">
                Scenario 7: Cutting/Fabrication Service
              </h5>
              <p className="text-sm mb-2">
                <strong>Situation:</strong> Customer brings their steel for you
                to cut and polish.
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>VAT Rate</strong>: 5% on service fee
                </li>
                <li>
                  <strong>Service Invoice</strong>: Issue tax invoice for
                  service charge only
                </li>
                <li>
                  <strong>Customer Recovery</strong>: Customer can recover VAT
                  if registered
                </li>
                <li>
                  <strong>Timeline</strong>: Invoice within 14 days of service
                  completion
                </li>
              </ul>
            </div>

            <InfoBox type="success" icon={Lightbulb} title="Pro Tip">
              For complex transactions involving multiple steps (e.g., import,
              local fabrication, then export), track VAT at each stage. Input
              VAT from import and fabrication can be recovered when you
              zero-rate the final export.
            </InfoBox>
          </div>
        </HelpSection>

        {/* Section 10: Quick Reference & Checklists */}
        <HelpSection
          title="Quick Reference & Checklists"
          icon={CheckSquare}
          isOpen={openSections.reference}
          onToggle={() => toggleSection('reference')}
        >
          <div className="space-y-4">
            {/* Quick Rate Reference */}
            <div>
              <h4 className="font-medium mb-2">Quick VAT Rate Reference</h4>
              <div
                className={`text-sm rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}>
                      <th className="px-3 py-2 text-left">Supply Type</th>
                      <th className="px-3 py-2 text-left">VAT Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Local sale (UAE mainland)</td>
                      <td className="px-3 py-2 font-medium">5%</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">
                        Sale to designated zone (qualified)
                      </td>
                      <td className="px-3 py-2 font-medium">0%</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Export to non-GCC</td>
                      <td className="px-3 py-2 font-medium">0%</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Export to GCC</td>
                      <td className="px-3 py-2 font-medium">5%</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Import from non-GCC</td>
                      <td className="px-3 py-2 font-medium">5% (at customs)</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Cutting/fabrication service</td>
                      <td className="px-3 py-2 font-medium">5%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Checklist */}
            <div>
              <h4 className="font-medium mb-2">Tax Invoice Checklist</h4>
              <p className="text-sm mb-2">
                Before issuing any invoice, verify:
              </p>
              <div
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <ul className="text-sm space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Invoice has unique sequential number</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Your company name, address, and TRN displayed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Customer name, address, and TRN (if registered)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Date of invoice issuance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Clear description of goods/services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Quantity, unit price, and total amount</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Correct VAT rate applied (5%, 0%, or exempt)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>VAT amount calculated and displayed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Total amount including VAT</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Export Checklist */}
            <div>
              <h4 className="font-medium mb-2">Export Zero-Rating Checklist</h4>
              <p className="text-sm mb-2">
                To apply 0% VAT on exports, ensure:
              </p>
              <div
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <ul className="text-sm space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Customer is outside UAE and GCC</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Goods physically exported (not just sold to exporter)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Export customs declaration obtained</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Bill of Lading or Airway Bill obtained</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Export completed within 90 days of invoice (or 12 months
                      if approved)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Invoice states &quot;Zero-Rated Export&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>All documents filed and retained for 5 years</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Designated Zone Checklist */}
            <div>
              <h4 className="font-medium mb-2">
                Designated Zone Supply Checklist
              </h4>
              <p className="text-sm mb-2">To apply 0% VAT to zone supplies:</p>
              <div
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <ul className="text-sm space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Verify customer is in a designated zone (check FTA list)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Customer is a &quot;Qualified Person&quot; (hold
                      certificate)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Goods delivered to zone address (proof required)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Invoice references zone certificate number</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Invoice states &quot;Zero-Rated Supply to Designated
                      Zone&quot;
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* VAT Return Deadlines */}
            <div>
              <h4 className="font-medium mb-2">VAT Return Deadlines</h4>
              <div
                className={`text-sm rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}>
                      <th className="px-3 py-2 text-left">Filing Frequency</th>
                      <th className="px-3 py-2 text-left">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Quarterly Returns</td>
                      <td className="px-3 py-2">28 days after quarter end</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Monthly Returns</td>
                      <td className="px-3 py-2">28 days after month end</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Payment of VAT Due</td>
                      <td className="px-3 py-2">Same deadline as filing</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Penalty Reference */}
            <div>
              <h4 className="font-medium mb-2">Common Penalties</h4>
              <div
                className={`text-sm rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}>
                      <th className="px-3 py-2 text-left">Violation</th>
                      <th className="px-3 py-2 text-left">Penalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Late VAT return filing</td>
                      <td className="px-3 py-2">
                        AED 1,000 (first time), AED 2,000 (repeat)
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Late VAT payment</td>
                      <td className="px-3 py-2">
                        2% of unpaid tax (first month), +4% each month (max
                        300%)
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">
                        Tax invoice missing required info
                      </td>
                      <td className="px-3 py-2">
                        AED 2,500 per invoice (max AED 20,000 per return period)
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">
                        Failure to keep records (5 years)
                      </td>
                      <td className="px-3 py-2">AED 10,000</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Tax evasion (intentional)</td>
                      <td className="px-3 py-2">
                        Up to 5x the evaded amount + criminal prosecution
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key Resources */}
            <div>
              <h4 className="font-medium mb-2">Key Resources & Links</h4>
              <ul className="text-sm space-y-1">
                <li>
                  <ExtLink href="https://tax.gov.ae">
                    Federal Tax Authority (FTA) Portal
                  </ExtLink>
                </li>
                <li>
                  <ExtLink href="https://tax.gov.ae/en/legislation.aspx">
                    UAE VAT Law & Executive Regulations
                  </ExtLink>
                </li>
                <li>
                  <ExtLink href="https://tax.gov.ae/en/guides.aspx">
                    FTA VAT Guides & Public Clarifications
                  </ExtLink>
                </li>
                <li>
                  <ExtLink href="https://tax.gov.ae/en/designated.zones.aspx">
                    List of Designated Zones
                  </ExtLink>
                </li>
                <li>
                  <ExtLink href="https://eservices.tax.gov.ae">
                    FTA e-Services (TRN Verification, Filing)
                  </ExtLink>
                </li>
              </ul>
            </div>

            {/* ERP Quick Links */}
            <div>
              <h4 className="font-medium mb-2">ERP VAT Features</h4>
              <p className="text-sm mb-2">
                This Ultimate Steel ERP system helps you stay VAT compliant:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Company Settings → VAT Rates</strong>: Manage VAT
                  rates (5%, 0%, exempt)
                </li>
                <li>
                  <strong>Company Settings → FTA Integration</strong>:
                  Auto-verify customer TRNs
                </li>
                <li>
                  <strong>Customers</strong>: Mark designated zone customers,
                  attach zone certificates
                </li>
                <li>
                  <strong>Invoices</strong>: Auto-apply correct VAT, generate
                  compliant tax invoices
                </li>
                <li>
                  <strong>Credit Notes</strong>: Linked to original invoices,
                  auto VAT adjustment
                </li>
                <li>
                  <strong>Import Containers</strong>: Track customs VAT paid,
                  link to purchases
                </li>
                <li>
                  <strong>Reports</strong>: VAT summary reports for filing your
                  VAT return
                </li>
              </ul>
            </div>

            <InfoBox type="info" icon={Info} title="Still Have Questions?">
              For complex VAT scenarios specific to your business, consult a
              qualified UAE tax advisor. This guide provides general information
              and should not be considered legal or tax advice.
            </InfoBox>
          </div>
        </HelpSection>
      </div>

      {/* Footer */}
      <div
        className={`px-5 py-2 border-t text-xs ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}
      >
        Last Updated: December 2024
      </div>
    </div>
  );
};

export default VATRulesHelpPanel;
