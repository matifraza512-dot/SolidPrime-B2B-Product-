from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "audit"

    def ready(self):
        from django.contrib.auth.signals import user_logged_in
        from django.dispatch import receiver
        from .utils import log_action

        @receiver(user_logged_in)
        def log_login(sender, request, user, **kwargs):
            log_action("login", "session", description=f"{user.email} logged in", organization=user.organization)
