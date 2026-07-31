import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute, RoleRoute } from "./ProtectedRoute";
import { PageSpinner } from "@/components/ui/Spinner";

const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/features/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const CustomersPage = lazy(() => import("@/features/customers/CustomersPage").then((m) => ({ default: m.CustomersPage })));
const AuditLogPage = lazy(() => import("@/features/audit-log/AuditLogPage").then((m) => ({ default: m.AuditLogPage })));
const PipelinePage = lazy(() => import("@/features/pipeline/PipelinePage").then((m) => ({ default: m.PipelinePage })));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const IntegrationsPage = lazy(() => import("@/features/integrations/IntegrationsPage").then((m) => ({ default: m.IntegrationsPage })));
const ProjectsPage = lazy(() => import("@/features/projects/ProjectsPage").then((m) => ({ default: m.ProjectsPage })));
const InvoicesPage = lazy(() => import("@/features/invoices/InvoicesPage").then((m) => ({ default: m.InvoicesPage })));
const TasksPage = lazy(() => import("@/features/tasks/TasksPage").then((m) => ({ default: m.TasksPage })));
const NotificationsPage = lazy(() => import("@/features/notifications/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageSpinner />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  { path: "/login", element: withSuspense(<LoginPage />) },
  { path: "/register", element: withSuspense(<RegisterPage />) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: withSuspense(<DashboardPage />) },
          { path: "/customers", element: withSuspense(<CustomersPage />) },
          { path: "/projects", element: withSuspense(<ProjectsPage />) },
          { path: "/invoices", element: withSuspense(<InvoicesPage />) },
          { path: "/tasks", element: withSuspense(<TasksPage />) },
          { path: "/pipeline", element: withSuspense(<PipelinePage />) },
          { path: "/notifications", element: withSuspense(<NotificationsPage />) },
          { path: "/integrations", element: withSuspense(<IntegrationsPage />) },
          {
            element: <RoleRoute allow={["admin"]} />,
            children: [
              { path: "/audit-log", element: withSuspense(<AuditLogPage />) },
            ],
          },
          { path: "/settings", element: withSuspense(<SettingsPage />) },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
