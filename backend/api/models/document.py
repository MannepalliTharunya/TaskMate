from django.db import models
from django.conf import settings


class Document(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    file_path = models.CharField(max_length=500)
    content = models.TextField(blank=True)  # extracted text content
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    faiss_indexed = models.BooleanField(default=False)
    faiss_doc_id = models.IntegerField(null=True, blank=True)  # index in FAISS
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'documents'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
