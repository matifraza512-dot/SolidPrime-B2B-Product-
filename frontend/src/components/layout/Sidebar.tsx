import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderKanban, Receipt, CheckSquare,
  TrendingUp, Bell, Plug, Settings, ScrollText,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/invoices", label: "Invoices", icon: Receipt },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/pipeline", label: "Pipeline", icon: TrendingUp },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/audit-log", label: "Audit Log", icon: ScrollText, adminOnly: true },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role);
  const orgName = useAuthStore((s) => s.user?.organization?.name);

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent to-info text-xs font-bold text-white">
          B
        </div>
        <span className="text-sm font-semibold text-primary truncate">{orgName || "BizOps"}</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navItems
          .filter((item) => !item.adminOnly || role === "admin")
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent-soft text-accent-hover"
                    : "text-secondary hover:bg-surface-hover hover:text-primary"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
