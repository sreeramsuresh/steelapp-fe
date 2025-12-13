/**
 * Roles & Permissions Help Panel Component
 *
 * Comprehensive help documentation for Role-Based Access Control (RBAC)
 */

import { useState } from 'react';
import {
  HelpCircle,
  Users,
  Crown,
  Lock,
  Key,
  CheckCircle,
  AlertTriangle,
  Info,
  BookOpen,
  Lightbulb,
  ChevronDown,
  ChevronRight,
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

const RolesHelpPanel = () => {
  const { isDarkMode } = useTheme();
  const [openSections, setOpenSections] = useState([]);
  const [expandAll, setExpandAll] = useState(false);

  const toggleSection = (sectionId) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const _toggleAll = () => {
    if (expandAll) {
      setOpenSections([]);
    } else {
      setOpenSections([
        'overview',
        'system-roles',
        'director-roles',
        'custom-roles',
        'assigning-roles',
        'permissions',
        'best-practices',
      ]);
    }
    setExpandAll(!expandAll);
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
              onClick={() => {
                setOpenSections([
                  'overview',
                  'system-roles',
                  'director-roles',
                  'custom-roles',
                  'assigning-roles',
                  'permissions',
                  'best-practices',
                ]);
                setExpandAll(true);
              }}
              className={`p-1.5 rounded transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-teal-400'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-teal-600'
              }`}
              title="Expand All"
            >
              <ChevronsDown className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setOpenSections([]);
                setExpandAll(false);
              }}
              className={`p-1.5 rounded transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-teal-400'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-teal-600'
              }`}
              title="Collapse All"
            >
              <ChevronsUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {/* Overview */}
        <HelpSection
          title="What is Role-Based Access Control?"
          icon={BookOpen}
          isOpen={openSections.includes('overview')}
          onToggle={() => toggleSection('overview')}
        >
          <div className="space-y-3">
            <p>
              Role-Based Access Control (RBAC) is a security model that
              restricts system access based on a user&apos;s role within your
              organization. Instead of assigning permissions to individual
              users, you assign roles to users, and roles have specific
              permissions.
            </p>
            <div
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}
            >
              <div className="flex gap-2">
                <Info
                  className="text-blue-500 flex-shrink-0 mt-0.5"
                  size={18}
                />
                <div>
                  <p
                    className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}
                  >
                    How it works
                  </p>
                  <p
                    className={`text-sm mt-1 ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}
                  >
                    User → Assigned Roles → Role Permissions → System Access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </HelpSection>

        {/* System Roles */}
        <HelpSection
          title="Pre-defined System Roles"
          icon={Lock}
          isOpen={openSections.includes('system-roles')}
          onToggle={() => toggleSection('system-roles')}
        >
          <div className="space-y-3">
            <p>
              System roles are pre-configured roles that come with your ERP
              system. They cannot be deleted but you can customize their
              descriptions and director status.
            </p>
            <div className="space-y-2">
              <div
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
              >
                <h4
                  className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  The 12 System Roles:
                </h4>
                <ul
                  className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  <li>
                    • <strong>Managing Director</strong> - Chief executive with
                    full authority
                  </li>
                  <li>
                    • <strong>Operations Manager</strong> - Oversees daily
                    operations
                  </li>
                  <li>
                    • <strong>Finance Manager</strong> - Financial planning and
                    reporting
                  </li>
                  <li>
                    • <strong>Sales Manager</strong> - Manages sales team
                  </li>
                  <li>
                    • <strong>Purchase Manager</strong> - Procurement management
                  </li>
                  <li>
                    • <strong>Warehouse Manager</strong> - Inventory oversight
                  </li>
                  <li>
                    • <strong>Accounts Manager</strong> - AR/AP operations
                  </li>
                  <li>
                    • <strong>Sales Executive</strong> - Customer inquiries
                  </li>
                  <li>
                    • <strong>Purchase Executive</strong> - PO processing
                  </li>
                  <li>
                    • <strong>Stock Keeper</strong> - Stock records
                  </li>
                  <li>
                    • <strong>Accounts Executive</strong> - Invoicing/payments
                  </li>
                  <li>
                    • <strong>Logistics Coordinator</strong> - Shipping
                    coordination
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </HelpSection>

        {/* Director Roles */}
        <HelpSection
          title="Director Roles"
          icon={Crown}
          isOpen={openSections.includes('director-roles')}
          onToggle={() => toggleSection('director-roles')}
        >
          <div className="space-y-3">
            <p>
              Director roles are senior management positions with elevated
              access across the organization. These roles typically have broader
              permissions and oversight capabilities.
            </p>
            <div
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}
            >
              <div className="flex gap-2">
                <Crown
                  className="text-purple-500 flex-shrink-0 mt-0.5"
                  size={18}
                />
                <div>
                  <p
                    className={`font-semibold ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}
                  >
                    Default Director Roles
                  </p>
                  <ul
                    className={`text-sm mt-1 space-y-1 ${isDarkMode ? 'text-purple-200' : 'text-purple-800'}`}
                  >
                    <li>• Managing Director</li>
                    <li>• Operations Manager</li>
                    <li>• Finance Manager</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm">
              <strong>Note:</strong> You can modify which roles are marked as
              &quot;Director&quot; roles by editing the role in the Manage Roles
              modal.
            </p>
          </div>
        </HelpSection>

        {/* Custom Roles */}
        <HelpSection
          title="Creating Custom Roles"
          icon={Users}
          isOpen={openSections.includes('custom-roles')}
          onToggle={() => toggleSection('custom-roles')}
        >
          <div className="space-y-3">
            <p>
              In addition to system roles, you can create custom roles tailored
              to your organization&apos;s specific needs. Custom roles give you
              flexibility to define unique access patterns.
            </p>
            <div
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}
            >
              <div className="flex gap-2">
                <CheckCircle
                  className="text-green-500 flex-shrink-0 mt-0.5"
                  size={18}
                />
                <div>
                  <p
                    className={`font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-900'}`}
                  >
                    Steps to Create Custom Role
                  </p>
                  <ol
                    className={`text-sm mt-1 space-y-1 list-decimal list-inside ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}
                  >
                    <li>Click &quot;Manage Roles&quot; button</li>
                    <li>Click &quot;Create New Role&quot;</li>
                    <li>Enter role name and description</li>
                    <li>Optionally mark as director role</li>
                    <li>Save the role</li>
                  </ol>
                </div>
              </div>
            </div>
            <p className="text-sm">
              <strong>Naming convention:</strong> Use clear, descriptive names
              like &quot;Regional Sales Manager&quot; or &quot;Junior
              Accountant&quot; to make roles easily identifiable.
            </p>
          </div>
        </HelpSection>

        {/* Assigning Roles */}
        <HelpSection
          title="Assigning Roles to Users"
          icon={Users}
          isOpen={openSections.includes('assigning-roles')}
          onToggle={() => toggleSection('assigning-roles')}
        >
          <div className="space-y-3">
            <p>
              Users can be assigned multiple roles simultaneously. When a user
              has multiple roles, they inherit permissions from all assigned
              roles (cumulative permissions).
            </p>
            <div
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'}`}
            >
              <div className="flex gap-2">
                <Lightbulb
                  className="text-amber-500 flex-shrink-0 mt-0.5"
                  size={18}
                />
                <div>
                  <p
                    className={`font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-900'}`}
                  >
                    How to Assign Roles
                  </p>
                  <ol
                    className={`text-sm mt-1 space-y-1 list-decimal list-inside ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}
                  >
                    <li>Click the edit icon (✏️) next to a user</li>
                    <li>
                      In the &quot;Assigned Roles&quot; section, select roles
                      from the list
                    </li>
                    <li>Multiple roles can be selected</li>
                    <li>Click &quot;Save Changes&quot;</li>
                  </ol>
                </div>
              </div>
            </div>
            <p className="text-sm">
              <strong>Example:</strong> A user with both &quot;Sales
              Manager&quot; and &quot;Accounts Manager&quot; roles will have
              access to both sales and accounting features.
            </p>
          </div>
        </HelpSection>

        {/* Permissions */}
        <HelpSection
          title="Understanding Permissions"
          icon={Key}
          isOpen={openSections.includes('permissions')}
          onToggle={() => toggleSection('permissions')}
        >
          <div className="space-y-3">
            <p>
              Permissions define what actions a role can perform in the system.
              Each role can have different permissions for various modules like
              invoices, customers, products, etc.
            </p>
            <div className="space-y-2">
              <div
                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
              >
                <h4
                  className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Common Permission Types:
                </h4>
                <ul
                  className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  <li>
                    • <strong>Create</strong> - Add new records
                  </li>
                  <li>
                    • <strong>Read/View</strong> - View existing records
                  </li>
                  <li>
                    • <strong>Update/Edit</strong> - Modify existing records
                  </li>
                  <li>
                    • <strong>Delete</strong> - Remove records
                  </li>
                  <li>
                    • <strong>Approve</strong> - Approve transactions
                  </li>
                  <li>
                    • <strong>Export</strong> - Export data
                  </li>
                </ul>
              </div>
            </div>
            <p className="text-sm">
              <strong>Permission Inheritance:</strong> Users inherit ALL
              permissions from ALL their assigned roles. This means permissions
              are additive (union of all role permissions).
            </p>
          </div>
        </HelpSection>

        {/* Best Practices */}
        <HelpSection
          title="Best Practices"
          icon={Lightbulb}
          isOpen={openSections.includes('best-practices')}
          onToggle={() => toggleSection('best-practices')}
        >
          <div className="space-y-3">
            <div
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-teal-900/20' : 'bg-teal-50'}`}
            >
              <h4
                className={`font-semibold mb-2 ${isDarkMode ? 'text-teal-300' : 'text-teal-900'}`}
              >
                ✓ Security Best Practices
              </h4>
              <ul
                className={`text-sm space-y-1 ${isDarkMode ? 'text-teal-200' : 'text-teal-800'}`}
              >
                <li>
                  • <strong>Principle of Least Privilege:</strong> Grant users
                  only the minimum permissions needed
                </li>
                <li>
                  • <strong>Regular Audits:</strong> Review user roles and
                  permissions quarterly
                </li>
                <li>
                  • <strong>Separation of Duties:</strong> Avoid giving
                  conflicting permissions to single roles
                </li>
                <li>
                  • <strong>Use System Roles:</strong> Start with system roles
                  before creating custom ones
                </li>
                <li>
                  • <strong>Document Changes:</strong> Keep track of role
                  modifications and reasons
                </li>
              </ul>
            </div>
            <div
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}
            >
              <div className="flex gap-2">
                <AlertTriangle
                  className="text-red-500 flex-shrink-0 mt-0.5"
                  size={18}
                />
                <div>
                  <p
                    className={`font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-900'}`}
                  >
                    Common Mistakes to Avoid
                  </p>
                  <ul
                    className={`text-sm mt-1 space-y-1 ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}
                  >
                    <li>• Don&apos;t assign too many roles to one user</li>
                    <li>
                      • Don&apos;t create duplicate roles with similar
                      permissions
                    </li>
                    <li>
                      • Don&apos;t delete system roles (they can&apos;t be
                      deleted anyway)
                    </li>
                    <li>
                      • Don&apos;t forget to remove roles when employees change
                      positions
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </HelpSection>
      </div>
    </div>
  );
};

export default RolesHelpPanel;
