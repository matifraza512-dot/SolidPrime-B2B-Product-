import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Settings,
  Puzzle,
  ShieldCheck,
  Search,
  UserCircle,
} from "lucide-react";
import { globalSearch } from "./api";
import { useAuthStore } from "@/store/authStore";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-secondary aria-selected:bg-accent-soft aria-selected:text-primary";
const GROUP_CLASS = "px-2 py-1.5 text-xs font-medium text-muted";

const STATIC_ACTIONS = [
  { label: "Go to Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Go to Customers", path: "/customers", icon: Users },
  { label: "Go to Pipeline", path: "/pipeline", icon: GitBranch },
  { label: "Go to Integrations", path: "/integrations", icon: Puzzle },
  { label: "Go to Settings", path: "/settings", icon: Settings },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(rawQuery.trim()), 250);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  useEffect(() => {
    if (!open) {
      setRawQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () => globalSearch(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  function go(path: string) {
    onOpenChange(false);
    navigate(path);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Global command menu"
      className="fixed left-1/2 top-24 z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-surface-raised shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-border px-4">
        <Search className="h-4 w-4 text-muted" />
        <Command.Input
          value={rawQuery}
          onValueChange={setRawQuery}
          placeholder="Search customers, deals, or jump to a page..."
          className="h-12 w-full bg-transparent text-sm text-primary placeholder:text-muted outline-none"
        />
      </div>

      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="py-8 text-center text-sm text-muted">
          {isFetching ? "Searching..." : "No results found."}
        </Command.Empty>

        <Command.Group heading="Navigate" className={GROUP_CLASS}>
          {STATIC_ACTIONS.map((action) => (
            <Command.Item
              key={action.path}
              value={action.label}
              onSelect={() => go(action.path)}
              className={ITEM_CLASS}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Command.Item>
          ))}
          {role === "admin" && (
            <Command.Item value="Go to Audit Log" onSelect={() => go("/audit-log")} className={ITEM_CLASS}>
              <ShieldCheck className="h-4 w-4" />
              Go to Audit Log
            </Command.Item>
          )}
        </Command.Group>

        {!!data?.customers.length && (
          <Command.Group heading="Customers" className={GROUP_CLASS}>
            {data.customers.map((item) => (
              <Command.Item
                key={item.public_id}
                value={`customer-${item.label}-${item.public_id}`}
                onSelect={() => go("/customers")}
                className={ITEM_CLASS}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="truncate text-xs text-muted">{item.sublabel}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {!!data?.deals.length && (
          <Command.Group heading="Deals" className={GROUP_CLASS}>
            {data.deals.map((item) => (
              <Command.Item
                key={item.public_id}
                value={`deal-${item.label}-${item.public_id}`}
                onSelect={() => go("/pipeline")}
                className={ITEM_CLASS}
              >
                <GitBranch className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="truncate text-xs text-muted">{item.sublabel}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {!!data?.team.length && (
          <Command.Group heading="Team" className={GROUP_CLASS}>
            {data.team.map((item) => (
              <Command.Item
                key={item.public_id}
                value={`team-${item.label}-${item.public_id}`}
                onSelect={() => go("/settings")}
                className={ITEM_CLASS}
              >
                <UserCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="truncate text-xs text-muted">{item.sublabel}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
