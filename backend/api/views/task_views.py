"""Task management views: list, create, retrieve, update, delete."""

import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from api.models import Task, ActivityLog, Role
from api.serializers import TaskSerializer, TaskCreateSerializer, TaskStatusUpdateSerializer
from api.permissions import IsAdmin
from api.services import log_activity
from api.utils.pagination import StandardPagination

logger = logging.getLogger(__name__)


def _is_admin(user):
    """Return True if the user has the admin role."""
    return bool(user.role and user.role.name == Role.ADMIN)


class TaskListCreateView(APIView):
    """
    GET  /api/tasks/          List tasks (all for admin, own for user).
    POST /api/tasks/          Create a task (admin only).

    Query params (GET):
        status      — filter by 'pending' or 'completed'
        assigned_to — filter by user id (admin only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        queryset = Task.objects.select_related('created_by', 'assigned_to')

        if not _is_admin(user):
            queryset = queryset.filter(assigned_to=user)

        status_filter = request.query_params.get('status')
        if status_filter:
            if status_filter not in (Task.STATUS_PENDING, Task.STATUS_COMPLETED):
                return Response(
                    {'detail': f'Invalid status. Use "pending" or "completed".'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(status=status_filter)

        assigned_to = request.query_params.get('assigned_to')
        if assigned_to and _is_admin(user):
            if not assigned_to.isdigit():
                return Response({'detail': 'assigned_to must be a numeric user id.'},
                                status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(assigned_to_id=int(assigned_to))

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(TaskSerializer(page, many=True).data)

    def post(self, request):
        if not _is_admin(request.user):
            return Response({'detail': 'Admin access required.'},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = TaskCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        log_activity(request.user, ActivityLog.ACTION_TASK_CREATE,
                     f'Created task: {task.title}', request)
        logger.info("Task created: id=%d by user=%s", task.id, request.user.email)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    """
    GET    /api/tasks/<id>/   Retrieve a task.
    PATCH  /api/tasks/<id>/   Update a task (admin: any field; user: status only).
    DELETE /api/tasks/<id>/   Delete a task (admin only).
    """
    permission_classes = [IsAuthenticated]

    def _get_task_or_403(self, pk, user):
        """
        Fetch a task by pk and verify the requesting user has access.

        Returns (task, None) on success or (None, Response) on failure.
        """
        try:
            task = Task.objects.select_related('created_by', 'assigned_to').get(pk=pk)
        except Task.DoesNotExist:
            return None, Response({'detail': 'Task not found.'},
                                  status=status.HTTP_404_NOT_FOUND)

        if not _is_admin(user) and task.assigned_to != user:
            return None, Response({'detail': 'You do not have access to this task.'},
                                  status=status.HTTP_403_FORBIDDEN)
        return task, None

    def get(self, request, pk):
        task, err = self._get_task_or_403(pk, request.user)
        if err:
            return err
        return Response(TaskSerializer(task).data)

    def patch(self, request, pk):
        task, err = self._get_task_or_403(pk, request.user)
        if err:
            return err

        if _is_admin(request.user):
            serializer = TaskCreateSerializer(
                task, data=request.data, partial=True, context={'request': request}
            )
        else:
            # Regular users may only update the status field
            serializer = TaskStatusUpdateSerializer(task, data=request.data, partial=True)

        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        log_activity(request.user, ActivityLog.ACTION_TASK_UPDATE,
                     f'Updated task {task.id}: {task.title}', request)
        logger.info("Task updated: id=%d by user=%s", task.id, request.user.email)
        return Response(TaskSerializer(task).data)

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return Response({'detail': 'Admin access required.'},
                            status=status.HTTP_403_FORBIDDEN)

        task, err = self._get_task_or_403(pk, request.user)
        if err:
            return err

        task_id, task_title = task.id, task.title
        task.delete()
        logger.info("Task deleted: id=%d by user=%s", task_id, request.user.email)
        return Response(status=status.HTTP_204_NO_CONTENT)
