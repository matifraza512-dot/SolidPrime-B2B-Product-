from .middleware import get_current_request
from .models import AuditLog


def log_action(action, resource_type, resource_id="", description="", metadata=None, organization=None):
    """Central helper for writing audit entries — call this from viewsets/signals
    rather than creating AuditLog objects directly, so the actor/IP extraction
    logic lives in exactly one place."""
    request = get_current_request()
    user = getattr(request, "user", None) if request else None
    if not user or not getattr(user, "is_authenticated", False):
        return None
    org = organization or getattr(user, "organization", None)
    if not org:
        return None
    ip = request.META.get("REMOTE_ADDR") if request else None
    return AuditLog.objects.create(
        organization=org,
        actor=user,
        actor_email_snapshot=user.email,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        description=description,
        metadata=metadata or {},
        ip_address=ip,
    )
