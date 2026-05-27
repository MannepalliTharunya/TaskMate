"""Analytics view — admin-only system-wide statistics."""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Count

from api.models import Task, Document, ActivityLog
from api.permissions import IsAdmin

logger = logging.getLogger(__name__)

TOP_QUERIES_LIMIT = 10  # number of most-searched queries to return


class AnalyticsView(APIView):
    """
    GET /api/analytics/

    Returns system-wide statistics. Admin access only.

    Response includes:
        tasks            — total, pending, completed, completion_rate
        documents        — total, indexed
        searches         — total, top_queries (ranked by frequency)
        users            — total active
        activity_breakdown — count per action type
        recent_activity  — last 10 log entries
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # ── Task stats ────────────────────────────────────────────────
        total_tasks     = Task.objects.count()
        pending_count   = Task.objects.filter(status=Task.STATUS_PENDING).count()
        completed_count = Task.objects.filter(status=Task.STATUS_COMPLETED).count()
        completion_rate = (
            round(completed_count / total_tasks * 100, 1) if total_tasks else 0
        )

        # ── Document stats ────────────────────────────────────────────
        document_count = Document.objects.count()
        indexed_count  = Document.objects.filter(faiss_indexed=True).count()

        # ── Search stats ──────────────────────────────────────────────
        search_logs   = ActivityLog.objects.filter(action=ActivityLog.ACTION_SEARCH)
        search_count  = search_logs.count()

        # Group by detail field to find most-searched queries.
        # Detail format: "Search query: <text>"
        top_queries_qs = (
            search_logs
            .values('detail')
            .annotate(count=Count('id'))
            .order_by('-count')[:TOP_QUERIES_LIMIT]
        )
        top_queries = [
            {
                'query': entry['detail'].replace('Search query: ', '').strip(),
                'count': entry['count'],
            }
            for entry in top_queries_qs
            if entry['detail']
        ]

        # ── User stats ────────────────────────────────────────────────
        user_count = request.user.__class__.objects.filter(is_active=True).count()

        # ── Activity breakdown ────────────────────────────────────────
        activity_breakdown = {
            entry['action']: entry['count']
            for entry in (
                ActivityLog.objects
                .values('action')
                .annotate(count=Count('id'))
                .order_by('-count')
            )
        }

        # ── Recent activity ───────────────────────────────────────────
        recent_activity = [
            {
                'user':       log.user.email,
                'action':     log.action,
                'detail':     log.detail,
                'created_at': log.created_at.isoformat(),
            }
            for log in ActivityLog.objects.select_related('user').order_by('-created_at')[:10]
        ]

        return Response({
            'tasks': {
                'total':           total_tasks,
                'pending':         pending_count,
                'completed':       completed_count,
                'completion_rate': completion_rate,
            },
            'documents': {
                'total':   document_count,
                'indexed': indexed_count,
            },
            'searches': {
                'total':       search_count,
                'top_queries': top_queries,
            },
            'users': {
                'total': user_count,
            },
            'activity_breakdown': activity_breakdown,
            'recent_activity':    recent_activity,
        }, status=status.HTTP_200_OK)
