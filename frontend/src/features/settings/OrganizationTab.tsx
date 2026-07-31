import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/api/client";
import { fetchOrganization, updateOrganization } from "./api";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({ name: z.string().min(2, "Name is required") });
type FormValues = z.infer<typeof schema>;

export function OrganizationTab() {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const { data: org, isLoading } = useQuery({ queryKey: ["organization"], queryFn: fetchOrganization });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (org) reset({ name: org.name });
  }, [org, reset]);

  const mutation = useMutation({
    mutationFn: updateOrganization,
    onSuccess: () => {
      toast.success("Organization updated");
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  if (isLoading || !org) return <PageSpinner />;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-primary">Organization</h2>
          <p className="mt-0.5 text-xs text-muted">Your company's workspace details.</p>
        </div>
        {!isAdmin && <Badge tone="neutral">View only</Badge>}
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="mt-4 flex flex-col gap-4">
        <Input
          label="Organization name"
          disabled={!isAdmin}
          error={errors.name?.message}
          {...register("name")}
        />
        <Input label="Workspace URL slug" value={org.slug} disabled />
        <Input label="Created" value={format(new Date(org.created_at), "MMMM d, yyyy")} disabled />

        {isAdmin && (
          <div className="flex justify-end">
            <Button type="submit" isLoading={mutation.isPending}>
              Save changes
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
