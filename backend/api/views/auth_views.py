"""Authentication views: register, login, token refresh, current user."""

import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from api.serializers import RegisterSerializer, LoginSerializer, UserSerializer
from api.services import log_activity
from api.models import ActivityLog

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Create a new user account and return JWT tokens.
    Accessible without authentication.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        logger.info("New user registered: %s (role=%s)", user.email, user.role)
        return Response({
            'user':    UserSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticate with email + password and return JWT tokens.
    Logs both successful and failed attempts.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            # Log failed attempt (no PII in log — just the email)
            email = request.data.get('email', 'unknown')
            logger.warning("Failed login attempt for email: %s", email)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        log_activity(user, ActivityLog.ACTION_LOGIN, 'User logged in', request)
        logger.info("User logged in: %s", user.email)
        return Response({
            'user':    UserSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    GET /api/auth/me/
    Return the authenticated user's profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)
