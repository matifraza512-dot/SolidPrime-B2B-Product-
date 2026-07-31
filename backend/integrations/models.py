import hashlib
import secrets

from django.db import models
from common.models import OrganizationScopedModel


class APIKey(OrganizationScopedModel):
    """
    The raw key is generated once at creation and returned to the client
    exactly once, in the create response. Only its SHA-256 hash is ever
    persisted - this table can never leak a usable credential even if the
    database itself is compromised. `prefix` (first 12 chars of the raw
    key) is stored in plaintext purely so the UI can show "bzk_a1b2..."
    for identification without ever re-displaying the full secret.
    Revoking sets is_active=False rather than deleting the row, so the
    audit trail and "who created what, when" history survives.
    """
    name = models.CharField(max_length=100)
    prefix = models.CharField(max_length=12, db_index=True)
    hashed_key = models.CharField(max_length=64, unique=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="api_keys",
    )
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta(OrganizationScopedModel.Meta):
        indexes = [models.Index(fields=["organization", "is_active"])]

    def __str__(self):
        return f"{self.name} ({self.prefix}...)"

    @staticmethod
    def generate_key():
        raw = secrets.token_urlsafe(32)
        full_key = f"bzk_{raw}"
        prefix = full_key[:12]
        hashed = hashlib.sha256(full_key.encode()).hexdigest()
        return full_key, prefix, hashed
