import { useState } from "react";
import { Bell, Search, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";

interface TopbarProps {
  onOpenSearch: () => void;
}

export function Topbar({ onOpenSearch }: TopbarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-canvas px-6">
      <button
        onClick={onOpenSearch}
        className="relative flex h-9 w-full max-w-md items-center rounded-lg border border-border-strong bg-surface pl-9 pr-14 text-left text-sm text-muted outline-none hover:border-accent focus:border-accent focus:ring-1 focus:ring-accent"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        Search customers, deals, or jump to a page...
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border-strong bg-surface-raised px-1.5 py-0.5 text-[10px] text-muted">
          Ctrl+K
        </kbd>
      </button>

      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-secondary hover:bg-surface-hover hover:text-primary"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-hover">
              {user?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-primary leading-none">{user?.full_name}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border-strong bg-surface-raised p-1.5 shadow-xl">
                <div className="px-2.5 py-2">
                  <p className="text-sm font-medium text-primary">{user?.full_name}</p>
                  <p className="text-xs text-muted">{user?.email}</p>
                  <div className="mt-1.5"><Badge tone="accent">{user?.role}</Badge></div>
                </div>
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-secondary hover:bg-surface-hover hover:text-primary"
                >
                  <UserIcon className="h-3.5 w-3.5" /> Profile settings
                </button>
                <button
                  onClick={() => { logout(); navigate("/login"); }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-danger hover:bg-danger-soft"
                >
                  <LogOut className="h-3.5 w-3.5" /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
