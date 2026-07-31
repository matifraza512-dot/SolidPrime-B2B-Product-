from django.db.models.signals import pre_save
from django.dispatch import receiver

from notifications.utils import notify
from .models import Task


@receiver(pre_save, sender=Task)
def notify_on_assignment(sender, instance, **kwargs):
    """
    pre_save (not post_save) so we can compare against the DB's current
    value before this save overwrites it - that's what lets us detect
    "assignee changed" rather than firing on every single save.
    """
    if not instance.pk:
        if instance.assignee_id:
            notify(instance.assignee, f"You were assigned to '{instance.title}'", "/tasks")
        return

    try:
        old = Task.objects.get(pk=instance.pk)
    except Task.DoesNotExist:
        return

    if instance.assignee_id and instance.assignee_id != old.assignee_id:
        notify(instance.assignee, f"You were assigned to '{instance.title}'", "/tasks")
