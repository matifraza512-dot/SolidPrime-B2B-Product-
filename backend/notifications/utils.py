from .models import Notification


def notify(recipient, verb, link=""):
    """Single entrypoint every signal handler calls - keeps notification
    creation in one place instead of scattered .objects.create() calls."""
    if recipient is None:
        return
    Notification.objects.create(recipient=recipient, verb=verb, link=link)
