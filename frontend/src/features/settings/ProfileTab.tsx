import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { extractErrorMessage } from "@/api/client";
import { updateProfile, changePassword } from "./api";
import { useAuthStore } from "@/store/authStore";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  job_title: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
      job_title: user?.job_title || "",
    },
  });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password updated");
      passwordForm.reset();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-primary">Profile information</h2>
        <p className="mt-0.5 text-xs text-muted">Your name and contact details across the workspace.</p>
        <form
          onSubmit={profileForm.handleSubmit((v) => profileMutation.mutate(v))}
          className="mt-4 flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              error={profileForm.formState.errors.first_name?.message}
              {...profileForm.register("first_name")}
            />
            <Input label="Last name" {...profileForm.register("last_name")} />
          </div>
          <Input label="Email" value={user?.email || ""} disabled />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" {...profileForm.register("phone")} />
            <Input label="Job title" {...profileForm.register("job_title")} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={profileMutation.isPending}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-primary">Change password</h2>
        <p className="mt-0.5 text-xs text-muted">You'll stay signed in on this device after changing it.</p>
        <form
          onSubmit={passwordForm.handleSubmit((v) => passwordMutation.mutate(v))}
          className="mt-4 flex flex-col gap-4"
        >
          <Input
            label="Current password"
            type="password"
            error={passwordForm.formState.errors.old_password?.message}
            {...passwordForm.register("old_password")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="New password"
              type="password"
              error={passwordForm.formState.errors.new_password?.message}
              {...passwordForm.register("new_password")}
            />
            <Input
              label="Confirm new password"
              type="password"
              error={passwordForm.formState.errors.confirm_password?.message}
              {...passwordForm.register("confirm_password")}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={passwordMutation.isPending}>
              Update password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
