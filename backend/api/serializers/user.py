from rest_framework import serializers
from django.contrib.auth import authenticate
from api.models import User, Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=[Role.ADMIN, Role.USER], default=Role.USER)

    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'role']

    def create(self, validated_data):
        role_name = validated_data.pop('role', Role.USER)
        role, _ = Role.objects.get_or_create(name=role_name)
        user = User.objects.create_user(**validated_data, role=role)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        data['user'] = user
        return data
