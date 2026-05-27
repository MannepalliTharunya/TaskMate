import React from 'react';

export default function Pagination({ count, pageSize = 20, current, onChange }) {
  const total = Math.ceil(count / pageSize);
  if (total <= 1) return null;

  const pages = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button onClick={() => onChange(current - 1)} disabled={current === 1}>‹</button>
      {pages.map((p) => (
        <button
          key={p}
          className={p === current ? 'active' : ''}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button onClick={() => onChange(current + 1)} disabled={current === total}>›</button>
    </div>
  );
}
