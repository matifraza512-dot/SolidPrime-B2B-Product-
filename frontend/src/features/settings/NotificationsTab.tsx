import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { PageSpinner } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/api/client";
import { fetchNotificationPreferences, updateNotificationPreferences } from "./api";
import type { NotificationPreferences } from "./api";

const items: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  {
    key: "notify_deal_won_lost",
    label: "Deal won or lost",
    description: "Get notified when a pipeline deal moves to Won or Lost.",
  },
  {
    key: "notify_task_assigned",
    label: "Task assigned to me",
    description: "Get notified when someone assigns you a task.",
  },
  {
    key: "notify_customer_created",
    label: "New customer added",
    description: "Get notified whenever a teammate adds a new customer.",
  },
  {
    key: "email_weekly_digest",
    label: "Weekly email digest",
    description: "A Monday-morning summary of your team's activity.",
  },
];

export function NotificationsTab() {
  const queryClient = useQueryClient();
  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: fetchNotificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  if (isLoading || !prefs) return <PageSpinner />;

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-primary">Notification preferences</h2>
      <p className="mt-0.5 text-xs text-muted">Choose what you want to be notified about.</p>
      <div className="mt-2 divide-y divide-border">
        {items.map((item) => (
          <Toggle
            key={item.key}
            label={item.label}
            description={item.description}
            checked={prefs[item.key]}
            onChange={(checked) => mutation.mutate({ [item.key]: checked })}
          />
        ))}
      </div>
    </Card>
  );
}
