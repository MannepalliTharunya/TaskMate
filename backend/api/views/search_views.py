"""Semantic search view using FAISS vector index."""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from api.models import Document, ActivityLog
from api.services import log_activity, get_faiss_service

logger = logging.getLogger(__name__)

QUERY_MAX_LENGTH = 500  # characters


class SearchView(APIView):
    """
    GET /api/search/?q=<query>&top_k=<n>

    Perform semantic search over all FAISS-indexed documents.
    Returns the top-k most similar document chunks with similarity scores.

    Query params:
        q      (required) — natural-language search query (max 500 chars)
        top_k  (optional) — number of results, 1–20, default 5
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'detail': 'Query parameter "q" is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if len(query) > QUERY_MAX_LENGTH:
            return Response(
                {'detail': f'Query must not exceed {QUERY_MAX_LENGTH} characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            top_k = int(request.query_params.get('top_k', 5))
        except ValueError:
            return Response({'detail': 'top_k must be an integer.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            faiss_svc = get_faiss_service()
            raw_results = faiss_svc.search(query, top_k=top_k)
        except Exception:
            logger.exception("FAISS search failed for query='%s'", query[:60])
            return Response({'detail': 'Search service is temporarily unavailable.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Enrich results with document metadata
        doc_ids = list({r['doc_id'] for r in raw_results})
        docs = {d.id: d for d in Document.objects.filter(id__in=doc_ids)}

        results = [
            {
                'doc_id':      r['doc_id'],
                'doc_title':   docs[r['doc_id']].title if r['doc_id'] in docs else None,
                'chunk_index': r['chunk_index'],
                'text':        r['text'],
                'score':       r['score'],
            }
            for r in raw_results
        ]

        log_activity(request.user, ActivityLog.ACTION_SEARCH,
                     f'Search query: {query}', request)
        logger.debug("Search by %s: '%s' -> %d results.", request.user.email, query[:60], len(results))

        return Response({'query': query, 'results': results}, status=status.HTTP_200_OK)
