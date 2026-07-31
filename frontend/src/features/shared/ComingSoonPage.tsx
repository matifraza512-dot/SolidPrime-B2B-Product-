import { Construction } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Placeholder for modules not yet built (Projects, Invoices, Tasks, Pipeline,
 * Notifications, Integrations, Audit Log UI, Settings). Routing, layout, and
 * nav are already wired for all of them — each becomes a real feature by
 * following the exact pattern in features/customers/ (api.ts, list page,
 * form modal) against its corresponding backend app.
 */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <EmptyState
      icon={Construction}
      title={`${title} — coming soon`}
      description="This module follows the same pattern as Customers and will be built next."
    />
  );
}
