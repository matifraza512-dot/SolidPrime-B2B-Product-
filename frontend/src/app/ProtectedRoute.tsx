import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Gate a route (or sub-tree) to specific roles. Renders a friendly 403
 * rather than silently redirecting, since the user IS authenticated —
 * they just lack permission, which is a different situation to communicate. */
export function RoleRoute({ allow }: { allow: Role[] }) {
  const role = useAuthStore((s) => s.user?.role);
  if (!role || !allow.includes(role)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold text-primary">You don't have access to this page</p>
        <p className="mt-1 text-sm text-muted">This area is restricted to {allow.join(" or ")} roles.</p>
      </div>
    );
  }
  return <Outlet />;
}
