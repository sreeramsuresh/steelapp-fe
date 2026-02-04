/**
 * Product Naming Help Panel Component
 *
 * Comprehensive help documentation for Product Naming System
 * Based on SSOT (Single Source of Truth) architecture for stainless steel products
 * Updated: 2024 - Post SSOT Refactor (Migration 163)
 */

import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Code,
  Database,
  FileText,
  HelpCircle,
  Package,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

// Collapsible section component
const HelpSection = ({ title, icon: Icon, children, isOpen, onToggle, critical }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} last:border-b-0`}>
      <button type="button" onClick={onToggle}
        className={`w-full flex items-center justify-between py-4 px-1 text-left hover:bg-opacity-50 transition-colors ${
          isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <Icon
              className={`h-5 w-5 ${critical ? "text-orange-500" : isDarkMode ? "text-teal-400" : "text-teal-600"}`}
            />
          )}
          <span
            className={`font-semibold ${critical ? "text-orange-500" : isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className={`h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
        ) : (
          <ChevronRight className={`h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
        )}
      </button>
      {isOpen && <div className={`pb-4 px-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{children}</div>}
    </div>
  );
};

const ProductNamingHelpPanel = ({ hasMismatch = false }) => {
  const { isDarkMode } = useTheme();

  // State to track which sections are open (all start collapsed)
  const [openSections, setOpenSections] = useState({
    overview: false,
    difference: false,
    generation: false,
    importance: false,
    incorrect: false,
    recovery: false,
    storage: false,
    originMill: false,
    faq: false,
    technical: false,
  });

  // Auto-expand troubleshooting sections when there's a mismatch
  useEffect(() => {
    if (hasMismatch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenSections((prev) => ({
        ...prev,
        incorrect: true,
        recovery: true,
        originMill: true,
        technical: true,
      }));
    }
  }, [hasMismatch]);

  const expandAll = () => {
    setOpenSections({
      overview: true,
      difference: true,
      generation: true,
      importance: true,
      incorrect: true,
      recovery: true,
      storage: true,
      originMill: true,
      faq: true,
      technical: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      overview: false,
      difference: false,
      generation: false,
      importance: false,
      incorrect: false,
      recovery: false,
      storage: false,
      originMill: false,
      faq: false,
      technical: false,
    });
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Header */}
      <div className={`px-5 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className={`h-5 w-5 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
            <h2 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Help &amp; Documentation
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={expandAll}
              className={`p-1.5 rounded transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-400 hover:text-teal-400"
                  : "hover:bg-gray-100 text-gray-600 hover:text-teal-600"
              }`}
              title="Expand All Sections"
            >
              <ChevronsDown className="h-4 w-4" />
            </button>
            <button type="button" onClick={collapseAll}
              className={`p-1.5 rounded transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-400 hover:text-teal-400"
                  : "hover:bg-gray-100 text-gray-600 hover:text-teal-600"
              }`}
              title="Collapse All Sections"
            >
              <ChevronsUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Section 1: Understanding the Product Naming System */}
        <HelpSection
          title="Understanding the Product Naming System"
          icon={BookOpen}
          isOpen={openSections.overview}
          onToggle={() => toggleSection("overview")}
        >
          <div className="space-y-3 text-sm">
            <p className="leading-relaxed">
              The Product Naming System defines how every stainless-steel product receives a{" "}
              <strong>permanent system identity</strong>. The identity is generated from core material specifications,
              ensuring:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Consistency across inventory, invoices, POs, DNs, and reports</li>
              <li>Accurate reconciliation</li>
              <li>Zero duplication</li>
              <li>Audit-safe traceability</li>
              <li>Seamless multi-batch stock management</li>
            </ul>
            <p
              className={`mt-3 p-2 rounded ${isDarkMode ? "bg-teal-900/30 border border-teal-700" : "bg-teal-50 border border-teal-200"}`}
            >
              This identity is <strong>fixed</strong>, <strong>non-editable</strong>, and{" "}
              <strong>automatically generated</strong>.
            </p>
          </div>
        </HelpSection>

        {/* Section 2: Product Identity vs Display Templates */}
        <HelpSection
          title="Product Identity vs Display Templates"
          icon={Package}
          isOpen={openSections.difference}
          onToggle={() => toggleSection("difference")}
        >
          <div className="space-y-4 text-sm">
            {/* Product Identity */}
            <div>
              <h4 className={`font-bold mb-2 ${isDarkMode ? "text-teal-400" : "text-teal-700"}`}>
                Product Identity (SSOT – Single Source of Truth)
              </h4>
              <p className="mb-2">
                This is the <strong>real identity</strong> of a product.
              </p>

              <div className={`p-3 rounded font-mono text-xs mb-3 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                <span className="text-gray-500">Pattern:</span>
                <br />
                SS-{"{Grade}"}-{"{Form}"}-{"{Finish}"}-{"{Width}"}mm-
                {"{Thickness}"}mm-{"{Length}"}mm
              </div>

              <p className="mb-1">
                <strong>Examples:</strong>
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>
                  <code className={`text-xs px-1 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    SS-304-Sheet-2B-1220mm-1.5mm-2440mm
                  </code>
                </li>
                <li>
                  <code className={`text-xs px-1 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    SS-316L-Coil-2B-1250mm-0.8mm-0mm
                  </code>
                </li>
              </ul>

              <p className="mt-3 mb-1">
                <strong>Key facts:</strong>
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Permanent and non-editable</li>
                <li>Generated from product master fields</li>
                <li>Used internally everywhere: DB keys, invoices, stock, APIs</li>
                <li className={`font-semibold ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
                  NO origin, NO mill, NO procurement channel in the identity
                </li>
              </ul>
            </div>

            {/* Display Templates */}
            <div>
              <h4 className={`font-bold mb-2 ${isDarkMode ? "text-teal-400" : "text-teal-700"}`}>
                Display Templates (Configured in Company Settings)
              </h4>
              <p className="mb-2">
                These control how products <strong>appear</strong> in UI, documents, and reports. They may include both
                product attributes and batch-level attributes.
              </p>

              <p className="mb-1">
                <strong>Allowed placeholders:</strong>
              </p>
              <div className={`p-2 rounded mb-2 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                <p className="text-xs mb-1">
                  <strong>Product-level:</strong>
                </p>
                <code className="text-xs">
                  {"{unique_name}"}, {"{Grade}"}, {"{Form}"}, {"{Finish}"}, {"{Width}"}, {"{Thickness}"}, {"{Length}"}
                </code>
                <p className="text-xs mt-2 mb-1">
                  <strong>Batch-level:</strong>
                </p>
                <code className="text-xs">
                  {"{Origin}"}, {"{Mill}"}, {"{MillCountry}"}, {"{BatchNumber}"}, {"{Container}"},{" "}
                  {"{ProcurementChannel}"}
                </code>
              </div>

              <p className="mb-1">
                <strong>Display Templates include:</strong>
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Product Dropdown Template</li>
                <li>Document Line Template</li>
                <li>Report Template</li>
              </ul>
            </div>

            <div
              className={`p-3 rounded border ${isDarkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200"}`}
            >
              <p>
                <strong>Identity</strong> = fixed, backend-controlled.
              </p>
              <p>
                <strong>Display</strong> = configurable, company-controlled.
              </p>
            </div>
          </div>
        </HelpSection>

        {/* Section 3: How the System Generates Unique Names */}
        <HelpSection
          title="How the System Generates Unique Names"
          icon={Settings}
          isOpen={openSections.generation}
          onToggle={() => toggleSection("generation")}
        >
          <div className="space-y-3 text-sm">
            <p>
              Unique names are generated by a <strong>PostgreSQL trigger</strong>:
            </p>

            <div className={`p-3 rounded font-mono text-xs ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
              <code>generate_product_name()</code>
              <br />
              <code>BEFORE INSERT OR UPDATE ON products</code>
            </div>

            <p className="mt-3">
              The <strong>SSOT pattern</strong> is:
            </p>
            <div
              className={`p-3 rounded font-mono text-xs overflow-x-auto ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}
            >
              <code>{`'SS-' || grade || '-' || form || '-' || finish || '-' ||`}</code>
              <br />
              <code>{`width_mm || 'mm-' || thickness_mm || 'mm-' || COALESCE(length_mm, '0') || 'mm'`}</code>
            </div>

            <p className="mt-3">
              <strong>Important rules:</strong>
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Deterministic &amp; reversible</li>
              <li>Same inputs → same unique name</li>
            </ul>

            <div
              className={`mt-3 p-3 rounded border ${isDarkMode ? "bg-red-900/30 border-red-700" : "bg-red-50 border-red-200"}`}
            >
              <p className="font-semibold mb-1">Product identity NEVER includes:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>origin</li>
                <li>mill</li>
                <li>supplier</li>
                <li>procurement channel</li>
                <li>container / BL / landed cost</li>
              </ul>
              <p className="mt-2 text-xs">
                These belong to <strong>batch / purchase-level data</strong>, not product master.
              </p>
            </div>
          </div>
        </HelpSection>

        {/* Section 4: Why These Naming Rules Matter */}
        <HelpSection
          title="Why These Naming Rules Matter"
          icon={CheckCircle}
          isOpen={openSections.importance}
          onToggle={() => toggleSection("importance")}
        >
          <ul className="list-disc list-inside space-y-1 text-sm ml-2">
            <li>Prevents duplicate products</li>
            <li>Ensures correct stock totals across multiple batches</li>
            <li>Supports accurate batch-based costing</li>
            <li>Ensures consistent invoicing &amp; reporting</li>
            <li>Maintains data integrity long-term</li>
            <li>Enables clear audit trails</li>
            <li>Simplifies UI &amp; prevents user confusion</li>
          </ul>
        </HelpSection>

        {/* Section 5: If a Name Looks Wrong */}
        <HelpSection
          title="If a Name Looks Wrong – What to Check"
          icon={AlertCircle}
          isOpen={openSections.incorrect}
          onToggle={() => toggleSection("incorrect")}
        >
          <div className="space-y-3 text-sm">
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Compare identity with SSOT pattern.</li>
              <li>If incorrect → update grade/form/finish/dimensions in the product master.</li>
              <li>Unique name regenerates automatically.</li>
              <li>
                Use <strong>Verify Naming Logic</strong> to run a sanity check.
              </li>
            </ol>

            <div
              className={`mt-3 p-3 rounded border ${isDarkMode ? "bg-yellow-900/30 border-yellow-700" : "bg-yellow-50 border-yellow-200"}`}
            >
              <p className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Legacy Data Note:
              </p>
              <p className="mt-1">
                If an old product contains origin/mill in its name (legacy design), run the naming cleanup migration.
                Origin/Mill now belong to <strong>stock batches</strong>, not product identity.
              </p>
            </div>
          </div>
        </HelpSection>

        {/* Section 6: Recovery Guide */}
        <HelpSection
          title="Recovery Guide – DB Reset / Restore"
          icon={Database}
          isOpen={openSections.recovery}
          onToggle={() => toggleSection("recovery")}
        >
          <div className="space-y-3 text-sm">
            <p>
              Naming logic lives in <strong>version-controlled migrations</strong>.
            </p>

            <p>
              <strong>If the DB is reset:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Re-run the product naming migrations.</li>
              <li>Verify generated names match SSOT patterns.</li>
            </ol>

            <p className="mt-3">
              <strong>Re-apply migration:</strong>
            </p>
            <div className={`p-2 rounded font-mono text-xs ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
              163_refactor_product_naming_ssot.sql
            </div>

            <p className="mt-3">This migration:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>
                Creates/updates the <code>generate_product_name()</code> trigger
              </li>
              <li>Adds display template columns to companies</li>
              <li>Cleans legacy names containing origin/mill</li>
            </ul>
          </div>
        </HelpSection>

        {/* Section 7: Why This Page Stores Naming Rules */}
        <HelpSection
          title="Why This Page Stores Naming Rules"
          icon={FileText}
          isOpen={openSections.storage}
          onToggle={() => toggleSection("storage")}
        >
          <div className="space-y-3 text-sm">
            <p>
              This page has <strong>two roles</strong>:
            </p>

            <div className="ml-2">
              <p className={`font-bold ${isDarkMode ? "text-teal-400" : "text-teal-700"}`}>
                1. DOCUMENTATION (Read-Only)
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Explains the SSOT identity pattern</li>
                <li>Clarifies identity vs display templates</li>
                <li>Provides debugging &amp; recovery guidance</li>
                <li>Helps staff understand product design philosophy</li>
              </ul>
            </div>

            <div className="ml-2 mt-3">
              <p className={`font-bold ${isDarkMode ? "text-teal-400" : "text-teal-700"}`}>
                2. CONFIGURATION (Editable Section)
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Allows admins to configure Display Templates</li>
                <li>Templates define how products appear in UI / documents</li>
                <li>Templates never affect core identity or stock behavior</li>
              </ul>
            </div>

            <p className="mt-3">This helps maintain:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Frontend ↔ backend alignment</li>
              <li>Audit clarity</li>
              <li>Staff education</li>
              <li>Clean data discipline</li>
            </ul>
          </div>
        </HelpSection>

        {/* Section 8: Why Origin & Mill Are NOT Part of Product Identity */}
        <HelpSection
          title="Why Origin & Mill Are NOT Part of Product Identity"
          icon={Package}
          isOpen={openSections.originMill}
          onToggle={() => toggleSection("originMill")}
        >
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Old behavior:</p>
              <p className="ml-2">
                Unique name included origin/mill → created separate products for identical materials.
              </p>
            </div>

            <div>
              <p className="font-semibold">New architecture (SSOT):</p>
              <p className="ml-2">
                Origin, mill, procurement belong to <strong>batches</strong>, not products.
              </p>
            </div>

            <p className="mt-3">
              <strong>Why:</strong>
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Avoids fragmentation of stock</li>
              <li>Same material spec = same product</li>
              <li>Accurate total stock calculation</li>
              <li>Batch-based costing stays correct</li>
              <li>Traceability preserved without polluting identity</li>
            </ul>

            <p className="mt-3">
              <strong>How it works now:</strong>
            </p>
            <div
              className={`p-3 rounded font-mono text-xs overflow-x-auto ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}
            >
              <pre>{`PRODUCT (Identity)
SS-316-Sheet-2B-1220mm-1.5mm-2440mm
    │
    ├─ Batch A → Origin: UAE, Mill: ISSF, Qty: 50
    ├─ Batch B → Origin: India, Mill: JSPL, Qty: 100
    └─ Batch C → Origin: China, Mill: TISCO, Qty: 75`}</pre>
            </div>

            <div
              className={`mt-3 p-3 rounded border ${isDarkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200"}`}
            >
              <p className="font-semibold">To show origin/mill on invoices or DNs:</p>
              <p className="mt-1">Use Document Line Template:</p>
              <code className={`text-xs block mt-1 p-1 rounded ${isDarkMode ? "bg-gray-900" : "bg-gray-200"}`}>
                {"{unique_name}"} | Origin: {"{Origin}"} | Mill: {"{Mill}"}
              </code>
            </div>
          </div>
        </HelpSection>

        {/* Section 9: FAQ */}
        <HelpSection
          title="FAQ – Common Questions (Updated)"
          icon={HelpCircle}
          isOpen={openSections.faq}
          onToggle={() => toggleSection("faq")}
        >
          <div className="space-y-4 text-sm">
            <div>
              <strong className="block mb-1">Q1: Can I edit the unique_name?</strong>
              <p>No. It is generated from product attributes. Editing attributes regenerates the name.</p>
            </div>

            <div>
              <strong className="block mb-1">Q2: Difference between product identity and display template?</strong>
              <p>
                <strong>Identity:</strong> fixed, what the product IS.
              </p>
              <p>
                <strong>Display Template:</strong> configurable, how the product APPEARS.
              </p>
            </div>

            <div>
              <strong className="block mb-1">Q3: Why did origin/mill move out of product names?</strong>
              <p>To avoid duplicate products and to use batch-level sourcing (LOCAL/IMPORTED, origin).</p>
            </div>

            <div>
              <strong className="block mb-1">Q4: How do I show origin/mill on invoices?</strong>
              <p>
                Use Company Settings → Document Line Template with <code>{"{Origin}"}</code> and <code>{"{Mill}"}</code>{" "}
                placeholders.
              </p>
            </div>

            <div>
              <strong className="block mb-1">Q5: What if new product forms appear?</strong>
              <p>Update the trigger logic; SSOT pattern remains the same.</p>
            </div>

            <div>
              <strong className="block mb-1">Q6: What is product_id vs unique_name?</strong>
              <p>
                <strong>product_id</strong> = primary key (integer, never changes)
              </p>
              <p>
                <strong>unique_name</strong> = generated identity string
              </p>
              <p>Changing attributes only changes unique_name, not product_id.</p>
            </div>

            <div>
              <strong className="block mb-1">Q7: We have old names with origin—what to do?</strong>
              <p>Run the cleanup migration; move origin/mill to batch records.</p>
            </div>

            <div>
              <strong className="block mb-1">Q8: Can two products have the same unique_name?</strong>
              <p>No. DB enforces a unique constraint.</p>
            </div>
          </div>
        </HelpSection>

        {/* Section 10: Technical Notes */}
        <HelpSection
          title="Technical Notes for Administrators"
          icon={Code}
          isOpen={openSections.technical}
          onToggle={() => toggleSection("technical")}
        >
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-1">Database Implementation:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>
                  Trigger: <code>generate_product_name()</code>
                </li>
                <li>
                  Trigger timing: <code>BEFORE INSERT OR UPDATE</code>
                </li>
                <li>
                  Migration: <code>163_refactor_product_naming_ssot.sql</code>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">SSOT Identity Pattern:</p>
              <div className={`p-2 rounded font-mono text-xs ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                SS-{"{Grade}"}-{"{Form}"}-{"{Finish}"}-{"{Width}"}mm-
                {"{Thickness}"}mm-{"{Length}"}mm
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">Display Template Rendering:</p>
              <p>
                Backend utility: <code>utils/templateRenderer.js</code>
              </p>
              <p className="mt-1">Functions:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>
                  <code>renderProductTemplate()</code>
                </li>
                <li>
                  <code>renderDropdownTemplate()</code>
                </li>
                <li>
                  <code>renderDocumentLineTemplate()</code>
                </li>
                <li>
                  <code>renderReportTemplate()</code>
                </li>
              </ul>
              <p className="mt-1">Templates support:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Product-level placeholders</li>
                <li>Batch-level placeholders</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Company Settings Columns (Migration 163):</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>
                  <code>product_dropdown_template</code>
                </li>
                <li>
                  <code>document_line_template</code>
                </li>
                <li>
                  <code>report_template</code>
                </li>
              </ul>
            </div>

            <div
              className={`p-3 rounded border ${isDarkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200"}`}
            >
              <p className="font-semibold">Cross-Module Consistency:</p>
              <p className="mt-1">
                All modules must reference <code>product_id</code> and use the same trigger-generated identity:
              </p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>Product Master</li>
                <li>Inventory &amp; Stock Batches</li>
                <li>POs &amp; SOs</li>
                <li>GRNs</li>
                <li>Invoices</li>
                <li>Delivery Notes</li>
                <li>Reports</li>
              </ul>
              <p className="mt-2 font-semibold text-xs">Module-specific naming variations are prohibited.</p>
            </div>

            <div>
              <p className="font-semibold mb-1">Troubleshooting:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Wrong identity → check trigger</li>
                <li>
                  Wrong display → check <code>templateRenderer.js</code>
                </li>
                <li>Missing origin/mill → check batch record</li>
                <li>Wrong template → check Company Settings</li>
              </ul>
            </div>
          </div>
        </HelpSection>
      </div>
    </div>
  );
};

export default ProductNamingHelpPanel;
