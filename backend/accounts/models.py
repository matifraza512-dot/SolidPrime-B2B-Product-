import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class Organization(models.Model):
    """
    The tenant boundary. Every user belongs to exactly one organization; every
    business object (customers, projects, invoices...) is scoped to one.
    Kept intentionally simple (no plan/billing fields yet) - this is the seam
    where Stripe subscription billing would attach later without touching
    any other app.
    """
    id = models.BigAutoField(primary_key=True)
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    """
    Custom user model (set as AUTH_USER_MODEL from day one - swapping this in
    later is a painful migration, so we start with it even though v1 only
    needs `role` and `organization`).
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        EMPLOYEE = "employee", "Employee"

    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="members", null=True
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    job_title = models.CharField(max_length=128, blank=True)
    is_active_member = models.BooleanField(default=True)

    email = models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.email} ({self.role})"


class NotificationPreference(models.Model):
    """
    One row per user, created lazily on first GET/PATCH rather than at
    registration - keeps User itself free of ever-growing settings fields.
    Flags default to what a user would reasonably expect to be opted into.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="notification_preferences")
    notify_deal_won_lost = models.BooleanField(default=True)
    notify_task_assigned = models.BooleanField(default=True)
    notify_customer_created = models.BooleanField(default=False)
    email_weekly_digest = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification prefs for {self.user.email}"
