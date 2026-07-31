import uuid
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base: every domain model gets created_at/updated_at for free
    and a UUID public id so we never leak sequential integer IDs (customer counts,
    invoice counts, etc.) through the API - a small but real security/product decision."""
    id = models.BigAutoField(primary_key=True)
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class OrganizationScopedModel(TimeStampedModel):
    """Abstract base for every tenant-owned resource (Customer, Project, Invoice...).
    Centralizing the `organization` FK here means adding a new domain model
    automatically gets correct tenancy scoping - you can't forget it."""
    organization = models.ForeignKey(
        "accounts.Organization", on_delete=models.CASCADE, related_name="%(class)ss"
    )

    class Meta(TimeStampedModel.Meta):
        abstract = True
