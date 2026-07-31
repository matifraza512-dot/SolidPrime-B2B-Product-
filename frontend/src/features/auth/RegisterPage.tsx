import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { register as registerApi } from "./api";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { extractErrorMessage } from "@/api/client";
import { AuthShell } from "./LoginPage";

const schema = z.object({
  organization_name: z.string().min(2, "Company name is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      setSession({ access: data.access, refresh: data.refresh, user: data.user });
      toast.success("Workspace created — welcome to BizOps");
      navigate("/");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Set up your company's operations dashboard in seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-accent-hover hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input label="Company name" placeholder="Acme Inc." error={errors.organization_name?.message} {...register("organization_name")} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" placeholder="Ada" error={errors.first_name?.message} {...register("first_name")} />
          <Input label="Last name" placeholder="Lovelace" error={errors.last_name?.message} {...register("last_name")} />
        </div>
        <Input label="Work email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" placeholder="At least 8 characters" error={errors.password?.message} {...register("password")} />
        <Button type="submit" size="lg" isLoading={mutation.isPending} className="mt-2 w-full">
          Create workspace
        </Button>
      </form>
    </AuthShell>
  );
}
