/**
 * FTA Help Panel Component
 *
 * Comprehensive help documentation for FTA Integration Settings
 * Based on UAE VAT Law and FTA requirements
 */

import { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Phone,
  Mail,
  Lock,
  Key,
  Settings,
  BookOpen,
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

// Status indicator badge
const StatusBadge = ({ status, label }) => {
  const colors = {
    verified:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    unverified:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    notfound: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    invalid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status]}`}
    >
      {label}
    </span>
  );
};

const FTAHelpPanel = ({ onClose }) => {
  const { isDarkMode } = useTheme();

  // State to track which sections are open (all start collapsed)
  const [openSections, setOpenSections] = useState({
    overview: false,
    access: false,
    setup: false,
    howItWorks: false,
    beforeAccess: false,
    troubleshooting: false,
    security: false,
    reference: false,
  });

  const expandAll = () => {
    setOpenSections({
      overview: true,
      access: true,
      setup: true,
      howItWorks: true,
      beforeAccess: true,
      troubleshooting: true,
      security: true,
      reference: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      overview: false,
      access: false,
      setup: false,
      howItWorks: false,
      beforeAccess: false,
      troubleshooting: false,
      security: false,
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
            <HelpCircle
              className={`h-5 w-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
            />
            <h2
              className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Help & Documentation
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
        {/* Overview Section */}
        <HelpSection
          title="Overview"
          icon={BookOpen}
          isOpen={openSections.overview}
          onToggle={() => toggleSection('overview')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What is TRN Verification?</h4>
              <p className="text-sm">
                A Tax Registration Number (TRN) is a unique 15-digit identifier
                issued by the UAE Federal Tax Authority (FTA) to businesses
                registered for Value Added Tax (VAT). TRN verification confirms
                that a trading partner&apos;s tax registration is valid, active,
                and matches their business details.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Why TRN Verification Matters</h4>
              <p className="text-sm mb-2">
                Under UAE VAT Law (Federal Decree-Law No. 8 of 2017), every tax
                invoice must include valid TRN details. Invalid or incorrect
                TRNs can result in:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Rejected input VAT claims</strong> - FTA may disallow
                  VAT recovery
                </li>
                <li>
                  <strong>Administrative penalties</strong> - Fines of AED 2,500
                  to AED 20,000
                </li>
                <li>
                  <strong>Audit exposure</strong> - Systematic TRN errors
                  trigger scrutiny
                </li>
                <li>
                  <strong>Business relationship risks</strong> - Trading with
                  unregistered entities
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">
                Benefits of Automatic Verification
              </h4>
              <div
                className={`text-sm rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}>
                      <th className="px-3 py-2 text-left">Manual</th>
                      <th className="px-3 py-2 text-left">Automatic</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">
                        Visit FTA portal for each check
                      </td>
                      <td className="px-3 py-2">Instant verification in app</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">Time-consuming for bulk</td>
                      <td className="px-3 py-2">Verify hundreds in seconds</td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2">No audit trail</td>
                      <td className="px-3 py-2">Full history logged</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </HelpSection>

        {/* How to Get FTA API Access */}
        <HelpSection
          title="How to Get FTA API Access"
          icon={Key}
          isOpen={openSections.access}
          onToggle={() => toggleSection('access')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Prerequisites</h4>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>An active FTA e-Services account</li>
                <li>A valid UAE Trade License</li>
                <li>Your company&apos;s TRN (must be VAT-registered)</li>
                <li>An authorized signatory with valid Emirates ID</li>
                <li>Technical contact details</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Step-by-Step Registration</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside ml-2">
                <li>
                  <strong>Log in to FTA e-Services Portal</strong>
                  <br />
                  <span className="ml-5">
                    Visit:{' '}
                    <ExtLink href="https://eservices.tax.gov.ae">
                      eservices.tax.gov.ae
                    </ExtLink>
                  </span>
                </li>
                <li>
                  <strong>Navigate to Developer/API Services</strong>
                  <br />
                  <span className="ml-5">
                    Select &quot;Apply for API Credentials&quot;
                  </span>
                </li>
                <li>
                  <strong>Complete Application Form</strong>
                  <br />
                  <span className="ml-5">
                    Specify &quot;TRN Verification API&quot;
                  </span>
                </li>
                <li>
                  <strong>Submit Documentation</strong>
                  <br />
                  <span className="ml-5">
                    Trade License, Authorization letter, Emirates ID
                  </span>
                </li>
                <li>
                  <strong>Review and Approval</strong>
                  <br />
                  <span className="ml-5">
                    FTA reviews within 5-10 business days
                  </span>
                </li>
              </ol>
            </div>

            <div
              className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}
            >
              <div className="flex items-start gap-2">
                <Clock
                  className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                />
                <div className="text-sm">
                  <strong>Timeline & Fees</strong>
                  <ul className="mt-1 space-y-0.5">
                    <li>Processing: 5-10 business days</li>
                    <li>Fee: Currently free for TRN verification</li>
                    <li>Renewal: Annual (reminder sent via email)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </HelpSection>

        {/* Setting Up the Integration */}
        <HelpSection
          title="Setting Up the Integration"
          icon={Settings}
          isOpen={openSections.setup}
          onToggle={() => toggleSection('setup')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Required Information</h4>
              <div
                className={`text-sm rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}>
                      <th className="px-3 py-2 text-left">Field</th>
                      <th className="px-3 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">API URL</td>
                      <td className="px-3 py-2">
                        The FTA API endpoint from your credentials
                      </td>
                    </tr>
                    <tr
                      className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <td className="px-3 py-2 font-medium">API Key</td>
                      <td className="px-3 py-2">
                        Your unique authentication key (case-sensitive)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Configuration Steps</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside ml-2">
                <li>
                  Enter API URL (exactly as provided, no trailing slashes)
                </li>
                <li>Enter API Key (paste exactly, do not share)</li>
                <li>
                  Click <strong>Save</strong> (credentials are encrypted)
                </li>
                <li>
                  Click <strong>Test Connection</strong> to verify
                </li>
              </ol>
            </div>

            <div
              className={`p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}
            >
              <div className="flex items-start gap-2">
                <Lock
                  className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
                />
                <div className="text-sm">
                  <strong>Understanding Soft-Lock</strong>
                  <p className="mt-1">
                    Once saved and tested successfully, settings enter
                    &quot;soft-lock&quot; state. This prevents accidental
                    changes to working credentials. Click &quot;Unlock&quot; to
                    make changes. Only Administrators can modify these settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </HelpSection>

        {/* How It Works Once Configured */}
        <HelpSection
          title="How It Works"
          icon={CheckCircle}
          isOpen={openSections.howItWorks}
          onToggle={() => toggleSection('howItWorks')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">
                Where TRN Verification Appears
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Customer creation/editing forms</li>
                <li>Supplier registration/updates</li>
                <li>Export/Import order creation</li>
                <li>Invoice generation</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">
                Verification Status Indicators
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <StatusBadge status="verified" label="Verified" />
                  <span>TRN is valid and active with FTA</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status="unverified" label="Unverified" />
                  <span>Format valid, not yet checked with FTA</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status="notfound" label="Not Found" />
                  <span>TRN does not exist in FTA registry</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status="invalid" label="Invalid Format" />
                  <span>Does not match 15-digit UAE format</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">
                Details Displayed After Verification
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>Business Name (as registered with FTA)</li>
                <li>Registration Date</li>
                <li>Last Verified timestamp</li>
                <li>Verification Method (API or Manual)</li>
              </ul>
            </div>
          </div>
        </HelpSection>

        {/* Before You Have API Access */}
        <HelpSection
          title="Before You Have API Access"
          icon={AlertCircle}
          isOpen={openSections.beforeAccess}
          onToggle={() => toggleSection('beforeAccess')}
        >
          <div className="space-y-4">
            <div
              className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-50'}`}
            >
              <div className="flex items-start gap-2">
                <CheckCircle
                  className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                />
                <div className="text-sm">
                  <strong>The System Still Works</strong>
                  <p className="mt-1">
                    Without API access, you still get local format validation
                    and a direct link to FTA&apos;s manual verification portal.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Manual Verification Steps</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside ml-2">
                <li>
                  Click &quot;Verify Manually&quot; link next to any TRN field
                </li>
                <li>
                  FTA page opens:{' '}
                  <ExtLink href="https://tax.gov.ae/en/trn.verification.aspx">
                    tax.gov.ae/trn.verification
                  </ExtLink>
                </li>
                <li>Enter TRN and complete CAPTCHA</li>
                <li>View result on FTA website</li>
                <li>Return and update status in the app</li>
              </ol>
            </div>
          </div>
        </HelpSection>

        {/* Troubleshooting */}
        <HelpSection
          title="Troubleshooting"
          icon={AlertCircle}
          isOpen={openSections.troubleshooting}
          onToggle={() => toggleSection('troubleshooting')}
        >
          <div className="space-y-4">
            <div
              className={`text-sm rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}>
                    <th className="px-3 py-2 text-left">Error</th>
                    <th className="px-3 py-2 text-left">Solution</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr
                    className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <td className="px-3 py-2 font-medium">Invalid API Key</td>
                    <td className="px-3 py-2">
                      Re-copy from FTA credentials, check for spaces
                    </td>
                  </tr>
                  <tr
                    className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <td className="px-3 py-2 font-medium">
                      Connection Timeout
                    </td>
                    <td className="px-3 py-2">
                      Check internet, try again in few minutes
                    </td>
                  </tr>
                  <tr
                    className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <td className="px-3 py-2 font-medium">403 Forbidden</td>
                    <td className="px-3 py-2">
                      Check API status in FTA e-Services
                    </td>
                  </tr>
                  <tr
                    className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <td className="px-3 py-2 font-medium">TRN Not Found</td>
                    <td className="px-3 py-2">
                      Verify TRN, allow 24-48h for new registrations
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                FTA Contact
              </h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  600 599 994
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  taxpayerservices@tax.gov.ae
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Sun-Thu, 8:00 AM - 8:00 PM
                </li>
              </ul>
            </div>
          </div>
        </HelpSection>

        {/* Security & Compliance */}
        <HelpSection
          title="Security & Compliance"
          icon={Shield}
          isOpen={openSections.security}
          onToggle={() => toggleSection('security')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">
                How Credentials Are Protected
              </h4>
              <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                <li>
                  <strong>Encryption at Rest:</strong> AES-256 encryption in
                  database
                </li>
                <li>
                  <strong>Encryption in Transit:</strong> TLS 1.2+ for all API
                  communication
                </li>
                <li>
                  <strong>No Client Exposure:</strong> Credentials never sent to
                  browser
                </li>
                <li>
                  <strong>Access Control:</strong> Administrator role only
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Audit Trail</h4>
              <p className="text-sm">
                All activities logged for compliance: configuration changes,
                connection tests, credential updates, lock/unlock actions. Logs
                retained per UAE requirements (minimum 5 years per Article 78,
                VAT Executive Regulations).
              </p>
            </div>
          </div>
        </HelpSection>

        {/* Quick Reference */}
        <HelpSection
          title="Quick Reference"
          icon={FileText}
          isOpen={openSections.reference}
          onToggle={() => toggleSection('reference')}
        >
          <div className="space-y-4">
            <div
              className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <h4 className="font-medium mb-2">Key Links</h4>
              <ul className="text-sm space-y-1">
                <li>
                  <ExtLink href="https://eservices.tax.gov.ae">
                    FTA e-Services
                  </ExtLink>
                </li>
                <li>
                  <ExtLink href="https://tax.gov.ae/en/trn.verification.aspx">
                    Manual TRN Verification
                  </ExtLink>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">TRN Format</h4>
              <p className="text-sm">
                15 digits, numeric only (e.g.,{' '}
                <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                  100123456789012
                </code>
                )
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">UAE VAT Law References</h4>
              <ul className="text-sm space-y-0.5 list-disc list-inside ml-2">
                <li>
                  Tax Invoice Requirements: Article 59, Executive Regulations
                </li>
                <li>TRN Display Obligation: Article 53, VAT Law</li>
                <li>Record Keeping: Article 78, Executive Regulations</li>
                <li>Penalties: Cabinet Decision No. 40 of 2017</li>
              </ul>
            </div>
          </div>
        </HelpSection>
      </div>

      {/* Footer */}
      <div
        className={`px-5 py-2 border-t text-xs ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}
      >
        Last Updated: November 2024
      </div>
    </div>
  );
};

export default FTAHelpPanel;
