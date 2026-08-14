import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { fetchMe } from "@/features/auth/api";
import { PageSpinner } from "@/components/ui/Spinner";
import type { Role } from "@/types";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  const { data, isLoading, isError, isSuccess } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (isSuccess && data) updateUser(data);
  }, [isSuccess, data, updateUser]);

  useEffect(() => {
    if (isError) logout();
  }, [isError, logout]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isLoading) return <PageSpinner />;
  if (isError) return <Navigate to="/login" replace />;

  return <Outlet />;
}

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
