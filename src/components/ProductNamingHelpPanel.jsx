/**
 * Product Naming Help Panel Component
 *
 * Comprehensive help documentation for Product Naming System
 * Based on concatenated naming architecture for stainless steel products
 */

import { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Package,
  Settings,
  Shield,
  AlertCircle,
  Database,
  FileText,
  CheckCircle,
  Code,
  ChevronsDown,
  ChevronsUp,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Collapsible section component
const HelpSection = ({ title, icon: Icon, children, isOpen, onToggle }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} last:border-b-0`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between py-4 px-1 text-left hover:bg-opacity-50 transition-colors ${
          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />}
          <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        ) : (
          <ChevronRight className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        )}
      </button>
      {isOpen && (
        <div className={`pb-4 px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

const ProductNamingHelpPanel = ({ onClose }) => {
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
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-5 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
            <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Help & Documentation
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className={`p-1.5 rounded transition-colors ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-teal-400' : 'hover:bg-gray-100 text-gray-600 hover:text-teal-600'
              }`}
              title="Expand All Sections"
            >
              <ChevronsDown className="h-4 w-4" />
            </button>
            <button
              onClick={collapseAll}
              className={`p-1.5 rounded transition-colors ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-teal-400' : 'hover:bg-gray-100 text-gray-600 hover:text-teal-600'
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
        {/* Section 1: What the Naming System Is */}
        <HelpSection
          title="Understanding the Product Naming System"
          icon={BookOpen}
          isOpen={openSections.overview}
          onToggle={() => toggleSection('overview')}
        >
          <p className="text-sm leading-relaxed">
            This system defines how every stainless-steel product receives a unique, permanent system ID.
            It ensures consistency across inventory, orders, invoices, and reports.
            The naming logic is fixed, rule-based, and automatically generated from product attributes.
          </p>
        </HelpSection>

        {/* Section 2: Difference Between Unique ID and Display Name */}
        <HelpSection
          title="Unique ID vs Display Name – What's the Difference?"
          icon={Package}
          isOpen={openSections.difference}
          onToggle={() => toggleSection('difference')}
        >
          <div className="space-y-3 text-sm">
            <div>
              <strong className="block mb-1">Unique ID:</strong>
              <p>Permanent, deterministic, system-generated from product attributes, non-editable. Used internally everywhere.</p>
            </div>
            <div>
              <strong className="block mb-1">Display Name:</strong>
              <p>Short, editable label for user convenience.</p>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Unique ID follows strict patterns documented in the 60% panel.</li>
              <li>Display Name typically excludes Origin and Mill for brevity, but follows the same base structure. Display Name is derived from the same product master attributes.</li>
              <li>Only Unique ID is used for stock tracing and system references.</li>
            </ul>
          </div>
        </HelpSection>

        {/* Section 3: How Unique IDs Are Generated */}
        <HelpSection
          title="How the System Generates Unique IDs"
          icon={Settings}
          isOpen={openSections.generation}
          onToggle={() => toggleSection('generation')}
        >
          <div className="space-y-2 text-sm">
            <p>
              Unique IDs are generated automatically by backend concatenation logic using a strict template. 
              Each product form (COIL, SHEET, PLATE, PIPE, TUBE, etc.) has a defined concatenation pattern 
              that determines field order and delimiters.
            </p>
            <p>
              The backend reads product master attributes (grade, finish, form, thickness, width, length, origin, mill) 
              and concatenates them in strict order using defined delimiters to assemble the Unique ID.
            </p>
            <p>
              Once created, the Unique ID is linked to the product_id (primary key) and remains unchanged. 
              The Unique ID can be regenerated from product master attributes if needed, but the product_id linkage is permanent.
            </p>
          </div>
        </HelpSection>

        {/* Section 4: Why Naming Patterns Are Important */}
        <HelpSection
          title="Why These Naming Rules Matter"
          icon={CheckCircle}
          isOpen={openSections.importance}
          onToggle={() => toggleSection('importance')}
        >
          <ul className="list-disc list-inside space-y-1 text-sm ml-2">
            <li>Prevents duplicate or ambiguous products</li>
            <li>Ensures searchability, filtering, and sorting</li>
            <li>Supports reliable inventory reconciliation</li>
            <li>Maintains accuracy across orders, invoices, and documentation</li>
            <li>Ensures long-term consistency even when staff changes</li>
          </ul>
        </HelpSection>

        {/* Section 5: What to Do if Naming Looks Incorrect */}
        <HelpSection
          title="If a Name Looks Wrong – What You Should Check"
          icon={AlertCircle}
          isOpen={openSections.incorrect}
          onToggle={() => toggleSection('incorrect')}
        >
          <div className="space-y-2 text-sm">
            <p>Compare the product's Unique ID with the patterns shown in the 60% section.</p>
            <p>
              If the dimensions or attributes look incorrect, edit the product master attributes—the Unique ID 
              will be automatically regenerated from the updated attributes.
            </p>
            <p>
              If the Unique ID itself is off-pattern, use the Verify Naming Logic button to check system logic.
            </p>
            <p>If verification flags an issue, follow the recovery steps in the next section.</p>
            <div className={`mt-3 p-3 rounded-lg border ${
              isDarkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
            }`}>
              <p className="font-semibold">Important:</p>
              <p>Never attempt to manually edit the Unique ID field directly—it is always computed from product master attributes.</p>
            </div>
          </div>
        </HelpSection>

        {/* Section 6: Recovery After Database Reset / Migration */}
        <HelpSection
          title="Recovery Guide – If Database Is Reset or Restored"
          icon={Database}
          isOpen={openSections.recovery}
          onToggle={() => toggleSection('recovery')}
        >
          <div className="space-y-2 text-sm">
            <p>
              The concatenation template and naming logic are defined in backend code and migrations 
              (version-controlled in Git), ensuring they can always be restored.
            </p>
            <p>After a database reset, run migrations to recreate the naming engine.</p>
            <p>
              Use the 60% section concatenation templates to visually verify that generated Unique IDs 
              match expected patterns for each product form.
            </p>
            <p>If DB output differs from expected patterns, re-apply the migration that defines naming logic.</p>
          </div>
        </HelpSection>

        {/* Section 7: Why Company Settings Also Store Naming Rules */}
        <HelpSection
          title="Why This Page Stores the Naming Rules"
          icon={FileText}
          isOpen={openSections.storage}
          onToggle={() => toggleSection('storage')}
        >
          <ul className="list-disc list-inside space-y-1 text-sm ml-2">
            <li>Serves as a permanent, human-readable reference for the concatenation templates and field ordering rules</li>
            <li>Lets users confirm expected naming formats</li>
            <li>Supports disaster-recovery and system audits</li>
            <li>Ensures frontend and backend stay aligned</li>
            <li>Helps new staff understand product naming logic</li>
          </ul>
        </HelpSection>

        {/* Section 8: Origin and Mill – Why They're Part of Unique ID */}
        <HelpSection
          title="Why Origin and Mill Are Included in Unique ID"
          icon={Package}
          isOpen={openSections.originMill}
          onToggle={() => toggleSection('originMill')}
        >
          <div className="space-y-2 text-sm">
            <p>
              Origin (LOCAL/IMPORTED) distinguishes procurement source and is a mandatory field in the concatenation template.
            </p>
            <p>
              Mill/Brand differentiates identical grades from different manufacturers 
              (e.g., POSCO vs TISCO for SS304-2B-SHEET).
            </p>
            <p>
              These parameters ensure accurate traceability, pricing, and stock classification.
            </p>
            <p>
              They are typically excluded from Display Name to keep the UI concise, but are always present 
              in the Unique ID for complete traceability.
            </p>
          </div>
        </HelpSection>

        {/* Section 9: Frequently Asked Questions */}
        <HelpSection
          title="FAQ – Common Questions About Naming"
          icon={HelpCircle}
          isOpen={openSections.faq}
          onToggle={() => toggleSection('faq')}
        >
          <div className="space-y-3 text-sm">
            <div>
              <strong className="block mb-1">Q1: Can I edit the Unique ID?</strong>
              <p>
                No. It is always generated from product master attributes and linked to the immutable product_id. 
                Edit the attributes if needed—the Unique ID will regenerate automatically.
              </p>
            </div>
            <div>
              <strong className="block mb-1">Q2: Why does Display Name differ from Unique ID?</strong>
              <p>To make daily usage more readable while keeping traceability intact.</p>
            </div>
            <div>
              <strong className="block mb-1">Q3: What if a new product type is introduced?</strong>
              <p>A new naming pattern will be added here and in backend logic.</p>
            </div>
            <div>
              <strong className="block mb-1">Q4: Why not store naming rules in the frontend only?</strong>
              <p>Frontend is documentation; backend is the executor of logic.</p>
            </div>
            <div>
              <strong className="block mb-1">Q5: What is product_id and how does it relate to Unique ID?</strong>
              <p>
                product_id is the immutable database primary key. The Unique ID (concatenated name) is always 
                linked to this product_id. Even if attributes change and the Unique ID regenerates, the product_id 
                remains the same, preserving all historical references.
              </p>
            </div>
          </div>
        </HelpSection>

        {/* Section 10: Technical Notes (For Admins / Devs) */}
        <HelpSection
          title="Technical Notes for Administrators"
          icon={Code}
          isOpen={openSections.technical}
          onToggle={() => toggleSection('technical')}
        >
          <div className="space-y-2 text-sm">
            <p>
              Concatenation logic is implemented in backend services (e.g., gRPC product creation/update handlers) 
              and/or database functions. The concatenation template is deterministic and reversible.
            </p>
            <p>
              Concatenation templates and logic are version-controlled in Git (backend code + database migrations). 
              Any change to the template requires a migration and regeneration of affected Unique IDs.
            </p>
            <p>Company Settings documentation must always match backend naming logic.</p>
            <p>The Verify button compares DB output to expected patterns.</p>
            <p>If mismatch occurs, restore naming logic from migrations.</p>
            <div className={`mt-3 p-3 rounded-lg border ${
              isDarkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
            }`}>
              <p className="font-semibold">Cross-Module Consistency:</p>
              <p>
                All modules (Product Master, Inventory, PO, SO, GRN, Invoices, Reports) must use the same 
                concatenation logic. Module-specific naming variations are prohibited.
              </p>
            </div>
          </div>
        </HelpSection>
      </div>
    </div>
  );
};

export default ProductNamingHelpPanel;
