-- =============================================================
-- Useful Reference Queries
-- =============================================================

USE task_knowledge_db;

-- -------------------------
-- Tasks filtered by status
-- -------------------------
SELECT
    t.id,
    t.title,
    t.status,
    t.due_date,
    CONCAT(cb.first_name, ' ', cb.last_name) AS created_by,
    CONCAT(at.first_name, ' ', at.last_name) AS assigned_to
FROM tasks t
JOIN  users cb ON cb.id = t.created_by_id
LEFT JOIN users at ON at.id = t.assigned_to_id
WHERE t.status = 'pending'
ORDER BY t.due_date ASC;


-- -------------------------
-- Tasks assigned to a specific user
-- -------------------------
SELECT t.id, t.title, t.status, t.due_date
FROM   tasks t
WHERE  t.assigned_to_id = 3
ORDER  BY t.created_at DESC;


-- -------------------------
-- Analytics: task counts
-- -------------------------
SELECT
    COUNT(*)                                          AS total_tasks,
    SUM(status = 'pending')                           AS pending_tasks,
    SUM(status = 'completed')                         AS completed_tasks,
    ROUND(SUM(status = 'completed') / COUNT(*) * 100, 1) AS completion_rate_pct
FROM tasks;


-- -------------------------
-- Analytics: search count
-- -------------------------
SELECT COUNT(*) AS total_searches
FROM   activity_logs
WHERE  action = 'search';


-- -------------------------
-- Analytics: full dashboard summary
-- -------------------------
SELECT
    (SELECT COUNT(*) FROM tasks)                          AS total_tasks,
    (SELECT COUNT(*) FROM tasks WHERE status = 'pending') AS pending_tasks,
    (SELECT COUNT(*) FROM tasks WHERE status = 'completed') AS completed_tasks,
    (SELECT COUNT(*) FROM documents)                      AS total_documents,
    (SELECT COUNT(*) FROM documents WHERE faiss_indexed = 1) AS indexed_documents,
    (SELECT COUNT(*) FROM activity_logs WHERE action = 'search') AS total_searches,
    (SELECT COUNT(*) FROM users WHERE is_active = 1)      AS active_users;


-- -------------------------
-- User activity timeline
-- -------------------------
SELECT
    al.created_at,
    al.action,
    al.detail,
    al.ip_address
FROM   activity_logs al
WHERE  al.user_id = 3
ORDER  BY al.created_at DESC
LIMIT  50;


-- -------------------------
-- Documents with uploader info
-- -------------------------
SELECT
    d.id,
    d.title,
    d.file_path,
    d.faiss_indexed,
    d.faiss_doc_id,
    u.email AS uploaded_by,
    d.created_at
FROM  documents d
JOIN  users u ON u.id = d.uploaded_by_id
ORDER BY d.created_at DESC;


-- -------------------------
-- All users with their roles
-- -------------------------
SELECT
    u.id,
    u.email,
    u.username,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    r.name  AS role,
    u.is_active,
    u.created_at
FROM  users u
JOIN  roles r ON r.id = u.role_id
ORDER BY r.name, u.created_at;
