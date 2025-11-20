import React from 'react';
import {
  X,
  Shield,
  AlertTriangle,
  CheckCircle,
  Users,
  Clock,
  Lock,
  Info,
  TrendingUp,
  Database,
  ShoppingCart,
  FileText,
  DollarSign,
  Package,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Role Guide Modal
 * Comprehensive in-app guide for understanding roles, permissions, and best practices
 */
const RoleGuideModal = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  const roles = [
    {
      name: 'Director/Owner',
      icon: Shield,
      color: 'text-purple-500',
      level: 'Executive',
      description: 'Full system access with ability to grant any permission to anyone',
      permissions: 'ALL (61 permissions)',
      bestFor: 'Company owner, CEO, Managing Director',
      specialPowers: [
        'Access to everything automatically',
        'Can grant temporary permissions to anyone',
        'Can override any restriction',
        'All actions are logged for accountability',
      ],
    },
    {
      name: 'Finance Manager',
      icon: DollarSign,
      color: 'text-green-500',
      level: 'Department Head',
      description: 'Manages all financial operations including invoices, payments, and credit notes',
      permissions: '25 permissions',
      bestFor: 'Head of Finance, CFO, Finance Controller',
      keyAccess: [
        'Create, edit, and void invoices',
        'Record and manage payments',
        'Approve credit notes',
        'Access financial reports',
      ],
    },
    {
      name: 'Sales Manager',
      icon: TrendingUp,
      color: 'text-blue-500',
      level: 'Department Head',
      description: 'Leads sales team and manages customer relationships',
      permissions: '23 permissions',
      bestFor: 'Head of Sales, Sales Director',
      keyAccess: [
        'Manage all customers',
        'Approve quotations',
        'Create and edit invoices',
        'View sales reports',
      ],
    },
    {
      name: 'Warehouse Manager',
      icon: Package,
      color: 'text-orange-500',
      level: 'Department Head',
      description: 'Manages inventory, stock movements, and delivery operations',
      permissions: '13 permissions',
      bestFor: 'Warehouse Supervisor, Logistics Manager',
      keyAccess: [
        'Manage inventory levels',
        'Approve stock adjustments',
        'Create delivery notes',
        'Transfer between warehouses',
      ],
    },
    {
      name: 'Accountant',
      icon: FileText,
      color: 'text-teal-500',
      level: 'Staff',
      description: 'Day-to-day accounting operations',
      permissions: '17 permissions',
      bestFor: 'Accounting staff, Bookkeeper',
      keyAccess: [
        'Create invoices',
        'Record payments',
        'Generate reports',
        'View customer accounts',
      ],
    },
    {
      name: 'Sales Executive',
      icon: Users,
      color: 'text-indigo-500',
      level: 'Staff',
      description: 'Sales team member handling quotations and customer service',
      permissions: '13 permissions',
      bestFor: 'Sales Representative, Account Manager',
      keyAccess: [
        'Create quotations',
        'View assigned customers',
        'Create draft invoices',
        'Basic customer management',
      ],
    },
  ];

  const safeCombinations = [
    {
      roles: ['Sales Manager', 'Warehouse Manager'],
      reason: 'Common in small/medium companies',
      benefit: 'One person can handle both customer orders and delivery coordination',
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      roles: ['Sales Executive', 'Warehouse Staff'],
      reason: 'Small team flexibility',
      benefit: 'Sales person can also prepare deliveries',
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      roles: ['Finance Manager', 'Sales Manager'],
      reason: 'Business oversight',
      benefit: 'Owner or senior manager overseeing multiple departments',
      icon: CheckCircle,
      color: 'text-green-500',
    },
  ];

  const dangerousCombinations = [
    {
      roles: ['Accountant', 'Sales Executive'],
      risk: 'HIGH',
      reason: 'Separation of Duties Violation',
      why: 'Same person can create invoices AND record payments - fraud risk',
      impact: 'Could create fake invoices and record fake payments',
      icon: AlertTriangle,
      color: 'text-red-500',
    },
    {
      roles: ['Warehouse Manager', 'Accountant'],
      risk: 'MEDIUM',
      reason: 'Inventory and Financial Control',
      why: 'Can adjust inventory AND record related financial transactions',
      impact: 'Could manipulate stock values and cover with accounting entries',
      icon: AlertTriangle,
      color: 'text-orange-500',
    },
    {
      roles: ['Purchase Executive', 'Accountant'],
      risk: 'MEDIUM',
      reason: 'Procurement Fraud Risk',
      why: 'Can create purchase orders AND record payments',
      impact: 'Could create fake suppliers and payments',
      icon: AlertTriangle,
      color: 'text-orange-500',
    },
  ];

  const bestPractices = [
    {
      title: 'Start with Pre-defined Roles',
      description: 'Use the 10 built-in roles for 90% of cases. Only create custom roles for unique needs.',
      icon: Shield,
    },
    {
      title: 'Temporary Access for Special Cases',
      description: 'Instead of permanently changing roles, use temporary permissions with expiration dates.',
      icon: Clock,
    },
    {
      title: 'Review Regularly',
      description: 'Check user roles every quarter. Remove access that is no longer needed.',
      icon: Users,
    },
    {
      title: 'Document Permission Grants',
      description: 'Always provide a clear reason when granting custom permissions.',
      icon: FileText,
    },
    {
      title: 'Use Audit Logs',
      description: 'Monitor the audit trail to detect unusual permission changes.',
      icon: Database,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-blue-500">
              <Info className="text-white" size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Role & Permission Guide
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Complete guide to managing user roles and permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">

          {/* Available Roles */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-teal-500" size={24} />
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Available Roles
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role, index) => {
                const Icon = role.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700/50 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Icon className={role.color} size={24} />
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {role.name}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {role.level}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {role.description}
                    </p>
                    <div className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex justify-between">
                        <span>Permissions:</span>
                        <span className="font-semibold">{role.permissions}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Best for:</span> {role.bestFor}
                      </div>
                    </div>
                    {role.specialPowers && (
                      <div className={`mt-3 pt-3 border-t ${
                        isDarkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}>
                        <div className="text-xs space-y-1">
                          {role.specialPowers.map((power, i) => (
                            <div key={i} className="flex items-start gap-1">
                              <span className="text-purple-500">★</span>
                              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                {power}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {role.keyAccess && (
                      <div className={`mt-3 pt-3 border-t ${
                        isDarkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}>
                        <div className="text-xs space-y-1">
                          {role.keyAccess.map((access, i) => (
                            <div key={i} className="flex items-start gap-1">
                              <span className="text-teal-500">•</span>
                              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                {access}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Safe Combinations */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="text-green-500" size={24} />
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Safe Role Combinations
              </h3>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                (Recommended for efficiency)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {safeCombinations.map((combo, index) => {
                const Icon = combo.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      isDarkMode
                        ? 'bg-green-900/20 border-green-700'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Icon className={combo.color} size={20} />
                      <div className="flex-1">
                        {combo.roles.map((role, i) => (
                          <div key={i} className={`text-sm font-semibold ${
                            isDarkMode ? 'text-green-300' : 'text-green-700'
                          }`}>
                            {role}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div><strong>Why:</strong> {combo.reason}</div>
                      <div><strong>Benefit:</strong> {combo.benefit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Dangerous Combinations */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-red-500" size={24} />
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Dangerous Role Combinations
              </h3>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                (Avoid these!)
              </span>
            </div>
            <div className="space-y-4">
              {dangerousCombinations.map((combo, index) => {
                const Icon = combo.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      combo.risk === 'HIGH'
                        ? isDarkMode
                          ? 'bg-red-900/20 border-red-700'
                          : 'bg-red-50 border-red-300'
                        : isDarkMode
                          ? 'bg-orange-900/20 border-orange-700'
                          : 'bg-orange-50 border-orange-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={combo.color} size={24} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            combo.risk === 'HIGH'
                              ? 'bg-red-500 text-white'
                              : 'bg-orange-500 text-white'
                          }`}>
                            {combo.risk} RISK
                          </span>
                          <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {combo.reason}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className={`text-xs font-semibold mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Combination:
                            </div>
                            {combo.roles.map((role, i) => (
                              <div key={i} className={`text-sm ${
                                combo.risk === 'HIGH'
                                  ? isDarkMode ? 'text-red-300' : 'text-red-700'
                                  : isDarkMode ? 'text-orange-300' : 'text-orange-700'
                              }`}>
                                • {role}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className={`text-xs font-semibold mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Why Dangerous:
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {combo.why}
                            </p>
                          </div>
                        </div>
                        <div className={`mt-3 p-3 rounded ${
                          isDarkMode ? 'bg-gray-900/50' : 'bg-white'
                        }`}>
                          <div className={`text-xs font-semibold mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            ⚠️ Potential Impact:
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {combo.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Best Practices */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="text-blue-500" size={24} />
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Best Practices
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bestPractices.map((practice, index) => {
                const Icon = practice.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      isDarkMode
                        ? 'bg-blue-900/20 border-blue-700'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="text-blue-500 flex-shrink-0" size={20} />
                      <div>
                        <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {practice.title}
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {practice.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Multi-Role Example */}
          <section className={`p-6 rounded-lg border-2 ${
            isDarkMode ? 'bg-teal-900/20 border-teal-700' : 'bg-teal-50 border-teal-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-teal-500" size={24} />
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Multi-Role Example
              </h3>
            </div>
            <div className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p className="font-semibold">Scenario: Ahmed manages both Sales and Warehouse</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold mb-2">Assigned Roles:</div>
                  <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-blue-500" />
                      <span>Sales Manager</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-orange-500" />
                      <span>Warehouse Manager</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">What Ahmed Can Do:</div>
                  <div className={`p-3 rounded text-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div>✓ Create quotations and invoices</div>
                    <div>✓ Manage all customers</div>
                    <div>✓ Manage inventory levels</div>
                    <div>✓ Create delivery notes</div>
                    <div>✓ Approve stock adjustments</div>
                    <div className="mt-2 pt-2 border-t border-teal-500/30">
                      <strong>Total: 36 unique permissions</strong>
                      <div className="text-xs opacity-75">(Union of both roles)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Temporary Access Example */}
          <section className={`p-6 rounded-lg border-2 ${
            isDarkMode ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-purple-500" size={24} />
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Temporary Access Example
              </h3>
            </div>
            <div className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p className="font-semibold">Scenario: Give accountant temporary access to void invoices for year-end</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold mb-2">How to Do It:</div>
                  <div className={`p-3 rounded text-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div>1. Click on user's custom permissions</div>
                    <div>2. Grant "Void Invoices" permission</div>
                    <div>3. Set reason: "Year-end cleanup"</div>
                    <div>4. Set expiry: December 31, 2025</div>
                    <div className="mt-2 pt-2 border-t border-purple-500/30 text-green-400">
                      ✓ Permission automatically expires
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">Benefits:</div>
                  <div className={`p-3 rounded text-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div>✓ No need to permanently change role</div>
                    <div>✓ Automatically expires (no cleanup)</div>
                    <div>✓ Fully logged in audit trail</div>
                    <div>✓ Clear reason documented</div>
                    <div>✓ Can revoke anytime if needed</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 px-6 py-4 border-t flex items-center justify-between ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            For detailed API documentation, see <code className={`px-2 py-1 rounded ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>/docs/RBAC_SYSTEM.md</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleGuideModal;
