from django.db import models
from common.models import TimeStampedModel


class AuditLog(TimeStampedModel):
    """
    Append-only trail of who-did-what. Deliberately NOT organization-scoped via
    OrganizationScopedModel's cascade delete — audit records must survive even
    if the acting user is later deleted, so we use SET_NULL and store a denormalized
    email snapshot for permanence.
    """

    class Action(models.TextChoices):
        CREATE = "create", "Create"
        UPDATE = "update", "Update"
        DELETE = "delete", "Delete"
        LOGIN = "login", "Login"

    organization = models.ForeignKey(
        "accounts.Organization", on_delete=models.CASCADE, related_name="audit_logs"
    )
    actor = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="audit_logs"
    )
    actor_email_snapshot = models.EmailField()
    action = models.CharField(max_length=20, choices=Action.choices)
    resource_type = models.CharField(max_length=64)
    resource_id = models.CharField(max_length=64, blank=True)
    description = models.CharField(max_length=500)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta(TimeStampedModel.Meta):
        indexes = [models.Index(fields=["organization", "-created_at"])]
