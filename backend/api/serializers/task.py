from rest_framework import serializers
from api.models import Task, User
from .user import UserSerializer


class TaskSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status',
            'created_by', 'assigned_to', 'due_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Task
        fields = ['title', 'description', 'assigned_to', 'due_date']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['status']

    def validate_status(self, value):
        allowed = [Task.STATUS_PENDING, Task.STATUS_COMPLETED]
        if value not in allowed:
            raise serializers.ValidationError(f'Status must be one of: {allowed}')
        return value
