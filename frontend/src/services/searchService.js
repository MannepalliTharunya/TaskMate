import api from './api';

export const search = (query, topK = 5) =>
  api.get('/search/', { params: { q: query, top_k: topK } });
