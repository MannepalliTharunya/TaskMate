from rest_framework import serializers
from api.models import Document


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'file_path', 'uploaded_by_email',
            'faiss_indexed', 'created_at'
        ]
        read_only_fields = ['id', 'file_path', 'faiss_indexed', 'created_at']


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['title', 'file']

    def validate_file(self, value):
        if not value.name.endswith('.txt'):
            raise serializers.ValidationError('Only .txt files are allowed.')
        if value.size > 10 * 1024 * 1024:  # 10MB limit
            raise serializers.ValidationError('File size must not exceed 10MB.')
        return value
