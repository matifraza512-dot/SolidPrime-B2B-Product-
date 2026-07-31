from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSameOrganization(BasePermission):
    """Row-level tenancy guard: object must belong to the requesting user's org."""

    def has_object_permission(self, request, view, obj):
        return getattr(obj, "organization_id", None) == request.user.organization_id


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "manager")
        )


class ReadOnlyOrManagerAndAbove(BasePermission):
    """Employees can read; only managers/admins can write. Common pattern for
    resources employees consume but shouldn't mutate (e.g. invoices)."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ("admin", "manager")
        )
