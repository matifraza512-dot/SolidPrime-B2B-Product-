from django.db.models.signals import pre_save
from django.dispatch import receiver

from notifications.utils import notify
from .models import Deal


@receiver(pre_save, sender=Deal)
def notify_on_stage_change(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old = Deal.objects.get(pk=instance.pk)
    except Deal.DoesNotExist:
        return

    if instance.stage != old.stage and instance.stage in ("won", "lost") and instance.owner_id:
        label = "Won" if instance.stage == "won" else "Lost"
        notify(instance.owner, f"Deal '{instance.title}' marked {label}", "/pipeline")
