from django.db import models
from common.models import OrganizationScopedModel


class Project(OrganizationScopedModel):
    """
    Follows the exact same pattern as Customer and Deal: org-scoped,
    public_id-based lookups (see views.py), audit-logged mutations.
    Links to Customer are optional - internal projects (no external
    client) are valid, e.g. "Q3 platform migration".
    """

    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        ON_HOLD = "on_hold", "On Hold"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    customer = models.ForeignKey(
        "customers.Customer", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="projects",
    )
    owner = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="owned_projects",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNING)
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)

    class Meta(OrganizationScopedModel.Meta):
        indexes = [models.Index(fields=["organization", "status"])]

    def __str__(self):
        return self.name
