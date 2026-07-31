from django.db import models
from common.models import OrganizationScopedModel


class Customer(OrganizationScopedModel):
    class Status(models.TextChoices):
        LEAD = "lead", "Lead"
        ACTIVE = "active", "Active"
        CHURNED = "churned", "Churned"

    name = models.CharField(max_length=255)
    company = models.CharField(max_length=255, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.LEAD)
    industry = models.CharField(max_length=128, blank=True)
    lifetime_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    logo = models.ImageField(upload_to="customer_logos/", null=True, blank=True)
    owner = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="owned_customers",
    )

    class Meta(OrganizationScopedModel.Meta):
        constraints = [
            models.UniqueConstraint(fields=["organization", "email"], name="unique_customer_email_per_org")
        ]
        indexes = [models.Index(fields=["organization", "status"])]

    def __str__(self):
        return self.name
