import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login } from "./api";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { extractErrorMessage } from "@/api/client";
import { LogoMark } from "@/components/ui/LogoMark";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession({ access: data.access, refresh: data.refresh, user: data.user });
      toast.success(`Welcome back, ${data.user.first_name || data.user.email}`);
      navigate("/");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <AuthShell
      title="Log in to BizOps"
      subtitle="Manage your business operations in one place."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-accent-hover hover:underline transition-colors">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <Input
          label="Work email"
          type="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button
          type="submit"
          size="lg"
          isLoading={mutation.isPending}
          className="mt-2 w-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.15] animate-[pulse_8s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(600px circle at 20% 10%, #6366f1, transparent), radial-gradient(500px circle at 80% 80%, #38bdf8, transparent)",
        }}
      />
      <div
        className={`relative w-full max-w-sm transition-all duration-700 ease-out ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center justify-center transition-transform duration-300 hover:scale-110">
            <LogoMark className="h-14 w-14 drop-shadow-[0_0_18px_rgba(99,102,241,0.35)]" />
          </div>
          <h1
            className={`text-xl font-semibold text-primary transition-all duration-700 delay-100 ease-out ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            {title}
          </h1>
          <p
            className={`mt-1 text-sm text-muted transition-all duration-700 delay-150 ease-out ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            {subtitle}
          </p>
        </div>

        <div
          className={`rounded-xl border border-border bg-surface p-6 shadow-2xl transition-all duration-700 delay-200 ease-out hover:border-accent/30 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          {children}
        </div>

        <p
          className={`mt-5 text-center text-sm text-muted transition-all duration-700 delay-300 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          {footer}
        </p>
      </div>
    </div>
  );
}
