import { ArrowLeft, BookOpen, Building2, Code, Layers, MessageSquare, Package, Shield, Users } from "lucide-react";

export const SETTINGS_NAV_ITEMS = [
  {
    section: null,
    items: [{ name: "Back to Business Management", path: "/app", icon: ArrowLeft }],
  },
  {
    section: "Company",
    items: [
      {
        name: "Company Profile",
        path: "/app/settings",
        icon: Building2,
        description: "Configure company details and integrations",
        requiredRoles: [
          "admin",
          "managing_director",
          "operations_manager",
          "finance_manager",
          "finance_manager_predefined",
        ],
      },
    ],
  },
  {
    section: "Finance",
    items: [
      {
        name: "Financial Settings",
        path: "/app/settings/financial",
        icon: BookOpen,
        description: "GL account defaults and base currency",
        requiredRoles: ["admin", "managing_director", "finance_manager", "finance_manager_predefined"],
      },
      {
        name: "GL Mapping Rules",
        path: "/app/settings/gl-mapping",
        icon: Layers,
        description: "Configure journal entry generation rules",
        requiredRoles: ["admin"],
      },
    ],
  },
  {
    section: "Administration",
    items: [
      {
        name: "User Management",
        path: "/app/users",
        icon: Users,
        description: "Manage users, roles and permissions",
        requiredPermission: "users.read",
      },
      {
        name: "Audit Trail",
        path: "/app/audit-logs",
        icon: Shield,
        description: "View all system activity and change history",
        requiredPermission: "audit_logs.read",
      },
      {
        name: "User Feedback",
        path: "/app/feedback",
        icon: MessageSquare,
        description: "View and manage user-reported issues",
        requiredRoles: ["admin", "managing_director"],
      },
    ],
  },
  {
    section: "Dev Only",
    items: [
      {
        name: "Dependabot",
        path: "/app/settings/dependabot",
        icon: Code,
        description: "View and manage Dependabot pull requests",
        requiredRoles: ["admin"],
      },
      {
        name: "Dependency Audit",
        path: "/app/settings/dependency-audit",
        icon: Package,
        description: "Audit all package versions and security vulnerabilities",
        requiredRoles: ["admin"],
      },
    ],
  },
];
