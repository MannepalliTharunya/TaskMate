import React, { useState, useRef } from 'react';
import { search } from '../services/searchService';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await search(query.trim(), topK);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">AI Semantic Search</h2>
          <p className="page-subtitle">Search across all indexed documents using natural language.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <label className="form-label">Search Query</label>
                <div className="search-box" style={{ maxWidth: '100%' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    ref={inputRef}
                    className="form-control"
                    placeholder="e.g. machine learning fundamentals..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ width: 120 }}>
                <label className="form-label">Results</label>
                <select
                  className="form-control"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                >
                  {[3, 5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n} results</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
                {loading ? <><span className="spinner" /> Searching...</> : 'Search'}
              </button>
              {results && (
                <button type="button" className="btn btn-secondary" onClick={handleClear}>
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div className="loading-center">
          <div className="spinner spinner-lg" />
          <p>Running semantic search...</p>
        </div>
      )}

      {results && !loading && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>
              {results.results.length} result{results.results.length !== 1 ? 's' : ''} for
            </span>
            <span style={{
              background: 'var(--primary-light)', color: 'var(--primary-dark)',
              padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 500
            }}>
              "{results.query}"
            </span>
          </div>

          {results.results.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <p>No matching documents found. Try a different query.</p>
            </div>
          ) : (
            results.results.map((r, i) => (
              <div key={i} className="search-result-card">
                <div className="search-result-header">
                  <div>
                    <div className="search-result-title">
                      📄 {r.doc_title || `Document #${r.doc_id}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                      Chunk {r.chunk_index + 1}
                    </div>
                  </div>
                  <span className="score-badge">
                    {(r.score * 100).toFixed(1)}% match
                  </span>
                </div>
                <p className="search-result-text">{r.text}</p>
              </div>
            ))
          )}
        </div>
      )}

      {!results && !loading && (
        <div className="empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <p>Enter a query above to search your knowledge base.</p>
        </div>
      )}
    </div>
  );
}
