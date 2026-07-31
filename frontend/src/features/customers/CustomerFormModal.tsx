import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { extractErrorMessage } from "@/api/client";
import { createCustomer, updateCustomer } from "./api";
import type { Customer } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  status: z.enum(["lead", "active", "churned"]),
  industry: z.string().optional(),
  lifetime_value: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CustomerFormModal({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
}) {
  const isEdit = !!customer;
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { status: "lead" } });

  useEffect(() => {
    if (open) {
      reset(
        customer
          ? {
              name: customer.name,
              company: customer.company,
              email: customer.email,
              phone: customer.phone,
              status: customer.status,
              industry: customer.industry,
              lifetime_value: String(customer.lifetime_value ?? ""),
              notes: customer.notes,
            }
          : { status: "lead" }
      );
    }
  }, [open, customer, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        lifetime_value: values.lifetime_value ? Number(values.lifetime_value) : undefined,
      };
      return isEdit ? updateCustomer(customer!.public_id, payload) : createCustomer(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Customer updated" : "Customer created");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      onClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit customer" : "New customer"}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Company" error={errors.company?.message} {...register("company")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" error={errors.status?.message} {...register("status")}>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="churned">Churned</option>
          </Select>
          <Input label="Industry" error={errors.industry?.message} {...register("industry")} />
        </div>
        <Input
          label="Lifetime value ($)"
          type="number"
          step="0.01"
          error={errors.lifetime_value?.message}
          {...register("lifetime_value")}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-secondary">Notes</label>
          <textarea
            rows={3}
            className="rounded-lg border border-border-strong bg-surface p-3 text-sm text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            {...register("notes")}
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEdit ? "Save changes" : "Create customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
