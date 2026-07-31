from decimal import Decimal

from django.db import models, transaction
from common.models import OrganizationScopedModel


class Invoice(OrganizationScopedModel):
    """
    subtotal/tax_amount/total are denormalized and recomputed server-side
    every time line items change (see InvoiceViewSet.recalculate_totals) -
    never trust a client-sent total for a financial document. invoice_number
    is sequential per-organization (INV-0001, INV-0002...), assigned once
    at creation inside a transaction to avoid collisions.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        CANCELLED = "cancelled", "Cancelled"

    invoice_number = models.CharField(max_length=20, db_index=True)
    customer = models.ForeignKey(
        "customers.Customer", on_delete=models.PROTECT, related_name="invoices",
    )
    project = models.ForeignKey(
        "projects.Project", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="invoices",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    issue_date = models.DateField()
    due_date = models.DateField()
    notes = models.TextField(blank=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta(OrganizationScopedModel.Meta):
        indexes = [models.Index(fields=["organization", "status"])]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "invoice_number"], name="unique_invoice_number_per_org"
            )
        ]

    def __str__(self):
        return self.invoice_number

    @classmethod
    @transaction.atomic
    def next_number(cls, organization):
        last = (
            cls.objects.select_for_update()
            .filter(organization=organization)
            .order_by("-id")
            .first()
        )
        next_seq = 1
        if last and last.invoice_number.startswith("INV-"):
            try:
                next_seq = int(last.invoice_number.split("-")[1]) + 1
            except (IndexError, ValueError):
                next_seq = cls.objects.filter(organization=organization).count() + 1
        return f"INV-{next_seq:04d}"

    def recalculate_totals(self):
        subtotal = sum((item.line_total for item in self.line_items.all()), Decimal("0"))
        tax_amount = (subtotal * self.tax_rate / Decimal("100")).quantize(Decimal("0.01"))
        self.subtotal = subtotal
        self.tax_amount = tax_amount
        self.total = subtotal + tax_amount
        self.save(update_fields=["subtotal", "tax_amount", "total"])


class InvoiceLineItem(models.Model):
    """line_total is computed and stored on save() - never accepted from the client."""
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="line_items")
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def save(self, *args, **kwargs):
        self.line_total = (self.quantity * self.unit_price).quantize(Decimal("0.01"))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} x{self.quantity}"
