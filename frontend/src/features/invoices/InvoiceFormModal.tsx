import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createInvoice, updateInvoice, fetchCustomerOptions, fetchProjectOptions,
} from "./api";
import type { Invoice, InvoiceStatus, LineItem } from "./api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { extractErrorMessage } from "@/api/client";

interface InvoiceFormModalProps {
  invoice?: Invoice;
  onClose: () => void;
}

const statusOptions: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

function emptyLine(): LineItem {
  return { description: "", quantity: "1", unit_price: "0" };
}

export function InvoiceFormModal({ invoice, onClose }: InvoiceFormModalProps) {
  const isEdit = Boolean(invoice);
  const queryClient = useQueryClient();

  const [customer, setCustomer] = useState(invoice?.customer ?? "");
  const [project, setProject] = useState(invoice?.project ?? "");
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status ?? "draft");
  const [issueDate, setIssueDate] = useState(invoice?.issue_date ?? new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(invoice?.due_date ?? "");
  const [taxRate, setTaxRate] = useState(invoice?.tax_rate ?? "0");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.line_items?.length ? invoice.line_items : [emptyLine()]
  );

  const { data: customers } = useQuery({ queryKey: ["customer-options"], queryFn: fetchCustomerOptions });
  const { data: projects } = useQuery({ queryKey: ["project-options"], queryFn: fetchProjectOptions });

  const subtotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const taxAmount = subtotal * ((Number(taxRate) || 0) / 100);
  const total = subtotal + taxAmount;

  function updateLine(index: number, field: keyof LineItem, value: string) {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addLine() {
    setLineItems((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        customer,
        project: project || null,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        tax_rate: taxRate,
        notes,
        line_items: lineItems
          .filter((item) => item.description.trim())
          .map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
      };
      return isEdit ? updateInvoice(invoice!.public_id, payload) : createInvoice(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Invoice updated" : "Invoice created");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      onClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !dueDate || !lineItems.some((i) => i.description.trim())) return;
    mutation.mutate();
  }

  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface-raised p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary">
            {isEdit ? `Edit ${invoice!.invoice_number}` : "New Invoice"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Customer</label>
              <Select value={customer} onChange={(e) => setCustomer(e.target.value)}>
                <option value="">Select a customer</option>
                {customers?.map((c) => (
                  <option key={c.public_id} value={c.public_id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Project (optional)</label>
              <Select value={project} onChange={(e) => setProject(e.target.value)}>
                <option value="">None</option>
                {projects?.map((p) => (
                  <option key={p.public_id} value={p.public_id}>{p.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Issue date</label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Due date</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Status</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs text-muted">Line items</label>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <Plus className="h-3 w-3" /> Add line
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_90px_90px_28px] items-center gap-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateLine(i, "description", e.target.value)}
                    placeholder="Description"
                  />
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLine(i, "quantity", e.target.value)}
                    placeholder="Qty"
                  />
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateLine(i, "unit_price", e.target.value)}
                    placeholder="Price"
                  />
                  <span className="text-right font-tabular text-xs text-secondary">
                    {currency.format((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={lineItems.length === 1}
                    className="rounded-md p-1 text-muted hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-border pt-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted">Notes</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </div>
            <div className="w-48 shrink-0 space-y-1 text-right text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-tabular">{currency.format(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  Tax
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-12 rounded border border-border bg-canvas px-1 py-0.5 text-right font-tabular text-xs"
                  />
                  %
                </span>
                <span className="font-tabular">{currency.format(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-1 text-sm font-semibold text-primary">
                <span>Total</span>
                <span className="font-tabular">{currency.format(total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || !customer || !dueDate}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
