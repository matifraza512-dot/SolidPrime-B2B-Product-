from django.db import models


class Notification(models.Model):
    """
    Recipient-scoped (not org-scoped like other models) - a notification
    belongs to exactly one user's feed. Created by signal handlers
    elsewhere (tasks.signals, pipeline.signals) rather than by any view
    directly, so the moment something notification-worthy happens
    anywhere in the app, it lands here automatically.
    """
    recipient = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications"
    )
    verb = models.CharField(max_length=255)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "is_read"])]

    def __str__(self):
        return f"{self.recipient.email}: {self.verb}"
