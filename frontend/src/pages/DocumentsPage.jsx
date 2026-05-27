import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDocuments, uploadDocument, deleteDocument } from '../services/documentService';
import Pagination from '../components/Pagination';

export default function DocumentsPage() {
  const { isAdmin } = useAuth();
  const [docs, setDocs] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', file: null });
  const fileRef = useRef();

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getDocuments({ page });
      setDocs(data.results || []);
      setCount(data.count || 0);
    } catch {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) { setError('Please select a .txt file.'); return; }
    if (!uploadForm.title.trim()) { setError('Please enter a title.'); return; }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', uploadForm.title);
      fd.append('file', uploadForm.file);
      await uploadDocument(fd);
      setSuccess('Document uploaded and indexed successfully!');
      setUploadForm({ title: '', file: null });
      if (fileRef.current) fileRef.current.value = '';
      fetchDocs();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.file?.[0] || err.response?.data?.detail || 'Upload failed.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.txt')) {
      setUploadForm((f) => ({ ...f, file, title: f.title || file.name.replace('.txt', '') }));
    } else {
      setError('Only .txt files are supported.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document? It will also be removed from the search index.')) return;
    try {
      await deleteDocument(id);
      fetchDocs();
    } catch {
      setError('Failed to delete document.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Documents</h2>
          <p className="page-subtitle">{count} document{count !== 1 ? 's' : ''} indexed</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isAdmin && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">Upload Document</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input
                  className="form-control"
                  placeholder="Enter document title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                />
              </div>

              <div
                className={`upload-zone${dragOver ? ' drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12" />
                </svg>
                {uploadForm.file ? (
                  <p><span>{uploadForm.file.name}</span> selected</p>
                ) : (
                  <p>Drag & drop a <span>.txt file</span> here, or click to browse</p>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setUploadForm((f) => ({
                      ...f, file,
                      title: f.title || file.name.replace('.txt', ''),
                    }));
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                disabled={uploading || !uploadForm.file}
              >
                {uploading ? <><span className="spinner" /> Uploading & indexing...</> : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Documents</span>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner spinner-lg" /></div>
        ) : docs.length === 0 ? (
          <div className="empty-state"><p>No documents uploaded yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Uploaded By</th>
                  <th>Indexed</th>
                  <th>Date</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 500 }}>{doc.title}</td>
                    <td>{doc.uploaded_by_email}</td>
                    <td>
                      <span className={`badge ${doc.faiss_indexed ? 'badge-completed' : 'badge-pending'}`}>
                        {doc.faiss_indexed ? '✓ Indexed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc.id)}>
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination count={count} current={page} onChange={setPage} />
      </div>
    </div>
  );
}
