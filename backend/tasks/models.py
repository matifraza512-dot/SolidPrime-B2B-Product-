from django.db import models
from common.models import OrganizationScopedModel


class Task(OrganizationScopedModel):
    """
    Mirrors the Deal/Pipeline pattern: org-scoped, Kanban-driven via
    `status`, optional Project link, optional assignee. perform_update
    on the viewset detects status changes the same way DealViewSet does,
    so the audit log reads "Moved task X to Done" rather than a generic
    "Updated task X".
    """

    class Status(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        BLOCKED = "blocked", "Blocked"
        DONE = "done", "Done"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project = models.ForeignKey(
        "projects.Project", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="tasks",
    )
    assignee = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_tasks",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    due_date = models.DateField(null=True, blank=True)

    class Meta(OrganizationScopedModel.Meta):
        indexes = [models.Index(fields=["organization", "status"])]

    def __str__(self):
        return self.title
