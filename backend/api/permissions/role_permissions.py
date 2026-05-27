from rest_framework.permissions import BasePermission
from api.models import Role


class IsAdmin(BasePermission):
    """Allow access only to admin users."""

    message = 'Admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            and request.user.role.name == Role.ADMIN
        )


class IsAdminOrReadOwn(BasePermission):
    """
    Admins have full access.
    Regular users can only read/update their own assigned tasks.
    """

    message = 'You do not have permission to perform this action.'

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role and request.user.role.name == Role.ADMIN:
            return True
        # Users can only access tasks assigned to them
        if hasattr(obj, 'assigned_to'):
            return obj.assigned_to == request.user
        return False
