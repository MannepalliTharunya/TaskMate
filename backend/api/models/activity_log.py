from django.db import models
from django.conf import settings


class ActivityLog(models.Model):
    ACTION_LOGIN = 'login'
    ACTION_TASK_UPDATE = 'task_update'
    ACTION_TASK_CREATE = 'task_create'
    ACTION_DOCUMENT_UPLOAD = 'document_upload'
    ACTION_SEARCH = 'search'

    ACTION_CHOICES = [
        (ACTION_LOGIN, 'Login'),
        (ACTION_TASK_UPDATE, 'Task Update'),
        (ACTION_TASK_CREATE, 'Task Create'),
        (ACTION_DOCUMENT_UPLOAD, 'Document Upload'),
        (ACTION_SEARCH, 'Search'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activity_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    detail = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.action} at {self.created_at}'
