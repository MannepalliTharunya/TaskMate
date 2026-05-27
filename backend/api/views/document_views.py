"""Document upload, listing, and deletion views."""

import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from api.models import Document, ActivityLog
from api.serializers import DocumentSerializer, DocumentUploadSerializer
from api.permissions import IsAdmin
from api.services import log_activity, get_faiss_service
from api.utils.pagination import StandardPagination

logger = logging.getLogger(__name__)


class DocumentListCreateView(APIView):
    """
    GET  /api/documents/   List all documents (any authenticated user).
    POST /api/documents/   Upload a .txt document and index it (admin only).
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        documents = Document.objects.select_related('uploaded_by').all()
        paginator = StandardPagination()
        page = paginator.paginate_queryset(documents, request)
        return paginator.get_paginated_response(DocumentSerializer(page, many=True).data)

    def post(self, request):
        if not (request.user.role and request.user.role.name == 'admin'):
            return Response({'detail': 'Admin access required.'},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        doc = serializer.save(
            uploaded_by=request.user,
            file_path=serializer.validated_data['file'].name,
        )

        # Read content and index in FAISS
        try:
            content = doc.file.read().decode('utf-8')
            doc.content = content
            faiss_svc = get_faiss_service()
            start_id = faiss_svc.add_document(doc.id, content)
            doc.faiss_indexed = True
            doc.faiss_doc_id  = start_id
            doc.file_path     = doc.file.name
            doc.save()
            logger.info("Document indexed: id=%d, title='%s', chunks start at %d",
                        doc.id, doc.title, start_id)
        except Exception:
            # Indexing failure must not block the upload — log and continue
            logger.exception("FAISS indexing failed for document id=%d title='%s'",
                             doc.id, doc.title)
            doc.file_path = doc.file.name
            doc.save()

        log_activity(request.user, ActivityLog.ACTION_DOCUMENT_UPLOAD,
                     f'Uploaded document: {doc.title}', request)
        return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    """
    GET    /api/documents/<id>/   Retrieve document metadata.
    DELETE /api/documents/<id>/   Delete document and remove from FAISS (admin only).
    """
    permission_classes = [IsAuthenticated]

    def _get_doc(self, pk):
        try:
            return Document.objects.get(pk=pk), None
        except Document.DoesNotExist:
            return None, Response({'detail': 'Document not found.'},
                                  status=status.HTTP_404_NOT_FOUND)

    def get(self, request, pk):
        doc, err = self._get_doc(pk)
        if err:
            return err
        return Response(DocumentSerializer(doc).data)

    def delete(self, request, pk):
        if not (request.user.role and request.user.role.name == 'admin'):
            return Response({'detail': 'Admin access required.'},
                            status=status.HTTP_403_FORBIDDEN)

        doc, err = self._get_doc(pk)
        if err:
            return err

        # Remove from FAISS index
        try:
            get_faiss_service().remove_document(doc.id)
        except Exception:
            logger.exception("Failed to remove doc id=%d from FAISS index.", doc.id)

        doc.file.delete(save=False)
        doc.delete()
        logger.info("Document deleted: id=%d by user=%s", pk, request.user.email)
        return Response(status=status.HTTP_204_NO_CONTENT)
