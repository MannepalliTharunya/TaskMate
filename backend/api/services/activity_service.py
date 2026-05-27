from api.models import ActivityLog


def log_activity(user, action: str, detail: str = '', request=None):
    """Helper to create an ActivityLog entry."""
    ip = None
    if request:
        ip = _get_client_ip(request)
    ActivityLog.objects.create(
        user=user,
        action=action,
        detail=detail,
        ip_address=ip,
    )


def _get_client_ip(request) -> str | None:
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
