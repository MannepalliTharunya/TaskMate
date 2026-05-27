"""FAISS semantic search service."""
import os, json, logging, threading
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from django.conf import settings

logger = logging.getLogger(__name__)
_model = None
_model_lock = threading.Lock()
_faiss_service = None
_service_lock = threading.Lock()
DIMENSION = 384
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K_MAX = 20

def get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

class FAISSService:
    INDEX_FILE = 'index.faiss'
    META_FILE = 'index_meta.json'

    def __init__(self):
        self.index_dir = str(settings.FAISS_INDEX_PATH)
        os.makedirs(self.index_dir, exist_ok=True)
        self.index_path = os.path.join(self.index_dir, self.INDEX_FILE)
        self.meta_path = os.path.join(self.index_dir, self.META_FILE)
        self._lock = threading.Lock()
        self.index = self._load_or_create_index()
        self.meta = self._load_meta()

    def _load_or_create_index(self):
        if os.path.exists(self.index_path):
            return faiss.read_index(self.index_path)
        return faiss.IndexFlatL2(DIMENSION)

    def _load_meta(self):
        if os.path.exists(self.meta_path):
            with open(self.meta_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []

    def _save(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, 'w', encoding='utf-8') as f:
            json.dump(self.meta, f, ensure_ascii=False)

    @staticmethod
    def _chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
        words = text.split()
        if not words:
            return []
        chunks, start = [], 0
        while start < len(words):
            chunks.append(' '.join(words[start:start + chunk_size]))
            start += chunk_size - overlap
        return chunks

    def _embed(self, texts):
        if not texts:
            raise ValueError("Cannot embed empty list.")
        try:
            return get_model().encode(texts, convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False).astype('float32')
        except Exception as exc:
            logger.exception("Embedding failed: %s", exc)
            raise RuntimeError(f"Embedding failed: {exc}") from exc

    def add_document(self, doc_id, text):
        if not text or not text.strip():
            raise ValueError(f"Document {doc_id} has empty text.")
        chunks = self._chunk_text(text)
        if not chunks:
            raise ValueError(f"Document {doc_id} produced no chunks.")
        embeddings = self._embed(chunks)
        with self._lock:
            start_id = self.index.ntotal
            self.index.add(embeddings)
            for i, chunk in enumerate(chunks):
                self.meta.append({'faiss_id': start_id + i, 'doc_id': doc_id, 'chunk_index': i, 'text': chunk})
            self._save()
        logger.info("Indexed doc_id=%d: %d chunks.", doc_id, len(chunks))
        return start_id

    def search(self, query, top_k=5):
        if not query or not query.strip():
            return []
        top_k = min(max(int(top_k), 1), TOP_K_MAX)
        if self.index.ntotal == 0:
            return []
        query_emb = self._embed([query.strip()])
        distances, indices = self.index.search(query_emb, min(top_k, self.index.ntotal))
        meta_by_id = {m['faiss_id']: m for m in self.meta}
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            entry = meta_by_id.get(int(idx))
            if entry:
                results.append({'doc_id': entry['doc_id'], 'chunk_index': entry['chunk_index'], 'text': entry['text'], 'score': round(float(1 / (1 + dist)), 4)})
        return results

    def remove_document(self, doc_id):
        with self._lock:
            remaining = [m for m in self.meta if m['doc_id'] != doc_id]
            if len(remaining) == len(self.meta):
                return
            new_index = faiss.IndexFlatL2(DIMENSION)
            if remaining:
                embeddings = self._embed([m['text'] for m in remaining])
                new_index.add(embeddings)
                for i, entry in enumerate(remaining):
                    entry['faiss_id'] = i
            self.index = new_index
            self.meta = remaining
            self._save()

def get_faiss_service():
    global _faiss_service
    if _faiss_service is None:
        with _service_lock:
            if _faiss_service is None:
                _faiss_service = FAISSService()
    return _faiss_service
