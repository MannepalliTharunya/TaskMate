-- =============================================================
-- Sample Data
-- Passwords are bcrypt hashes of "Password123!"
-- =============================================================

USE task_knowledge_db;

-- -------------------------
-- Roles
-- -------------------------
INSERT INTO roles (id, name, description) VALUES
(1, 'admin', 'Full system access: upload documents, create and assign tasks, view analytics'),
(2, 'user',  'Standard access: view assigned tasks, update task status, search documents');


-- -------------------------
-- Users  (password_hash = bcrypt of "Password123!")
-- -------------------------
INSERT INTO users (id, role_id, email, username, first_name, last_name, password_hash, is_active, is_staff) VALUES
(1, 1, 'admin@taskai.com',   'admin',    'Alice',  'Admin',   '$2b$12$KIXtTqDummyHashForAlice000000000000000000000', 1, 1),
(2, 1, 'manager@taskai.com', 'manager',  'Bob',    'Manager', '$2b$12$KIXtTqDummyHashForBob00000000000000000000000', 1, 1),
(3, 2, 'john@taskai.com',    'john_doe', 'John',   'Doe',     '$2b$12$KIXtTqDummyHashForJohn0000000000000000000000', 1, 0),
(4, 2, 'jane@taskai.com',    'jane_doe', 'Jane',   'Doe',     '$2b$12$KIXtTqDummyHashForJane0000000000000000000000', 1, 0),
(5, 2, 'carlos@taskai.com',  'carlos_r', 'Carlos', 'Rivera',  '$2b$12$KIXtTqDummyHashForCarlos000000000000000000000', 1, 0);


-- -------------------------
-- Tasks
-- -------------------------
INSERT INTO tasks (id, created_by_id, assigned_to_id, title, description, status, due_date) VALUES
(1,  1, 3, 'Set up CI/CD pipeline',
    'Configure GitHub Actions for automated testing and deployment.',
    'completed', '2025-05-01'),

(2,  1, 4, 'Write API documentation',
    'Document all REST endpoints using OpenAPI 3.0 spec.',
    'pending', '2025-06-15'),

(3,  2, 3, 'Implement FAISS search optimisation',
    'Profile and improve vector search latency for large document sets.',
    'pending', '2025-06-30'),

(4,  2, 5, 'Design onboarding flow',
    'Create wireframes and user journey for new user onboarding.',
    'pending', '2025-07-10'),

(5,  1, 4, 'Security audit',
    'Review authentication, authorisation, and input validation across all endpoints.',
    'completed', '2025-05-20'),

(6,  1, 5, 'Database performance review',
    'Analyse slow query log and add missing indexes.',
    'pending', '2025-07-01'),

(7,  2, 3, 'Write unit tests for task service',
    'Achieve 80% coverage on the task management service layer.',
    'pending', '2025-06-20'),

(8,  1, NULL, 'Unassigned backlog item',
    'Evaluate third-party integrations for calendar sync.',
    'pending', NULL);


-- -------------------------
-- Documents
-- -------------------------
INSERT INTO documents (id, uploaded_by_id, title, file_path, content, faiss_indexed, faiss_doc_id) VALUES
(1, 1, 'Machine Learning Fundamentals',
    'documents/ml_fundamentals.txt',
    'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing computer programs that can access data and use it to learn for themselves. The process begins with observations or data, such as examples, direct experience, or instruction, to look for patterns in data and make better decisions in the future.',
    1, 0),

(2, 1, 'Django REST Framework Guide',
    'documents/drf_guide.txt',
    'Django REST Framework is a powerful and flexible toolkit for building Web APIs. It provides a serialization layer that supports both ORM and non-ORM data sources, authentication policies including OAuth1a and OAuth2, and serialization that supports both ORM and non-ORM data sources. Browsable API is a huge usability win for your developers.',
    1, 3),

(3, 2, 'FAISS Vector Search Overview',
    'documents/faiss_overview.txt',
    'FAISS (Facebook AI Similarity Search) is a library for efficient similarity search and clustering of dense vectors. It contains algorithms that search in sets of vectors of any size, up to ones that possibly do not fit in RAM. It also contains supporting code for evaluation and parameter tuning. FAISS is written in C++ with complete wrappers for Python.',
    1, 6),

(4, 2, 'Project Architecture Notes',
    'documents/architecture_notes.txt',
    'The system follows a clean layered architecture: presentation layer handles HTTP via Django REST Framework views, the service layer contains business logic including FAISS indexing, and the data layer uses MySQL with Django ORM models. Sentence Transformers generate 384-dimensional embeddings using the all-MiniLM-L6-v2 model.',
    0, NULL);


-- -------------------------
-- Activity Logs
-- -------------------------
INSERT INTO activity_logs (user_id, action, detail, ip_address, created_at) VALUES
(1, 'login',           'User logged in',                                    '192.168.1.10', '2025-05-26 08:00:00'),
(2, 'login',           'User logged in',                                    '192.168.1.11', '2025-05-26 08:05:00'),
(3, 'login',           'User logged in',                                    '10.0.0.5',     '2025-05-26 08:10:00'),
(1, 'document_upload', 'Uploaded document: Machine Learning Fundamentals',  '192.168.1.10', '2025-05-26 08:15:00'),
(1, 'document_upload', 'Uploaded document: Django REST Framework Guide',    '192.168.1.10', '2025-05-26 08:20:00'),
(2, 'document_upload', 'Uploaded document: FAISS Vector Search Overview',   '192.168.1.11', '2025-05-26 08:25:00'),
(1, 'task_create',     'Created task: Set up CI/CD pipeline',               '192.168.1.10', '2025-05-26 09:00:00'),
(1, 'task_create',     'Created task: Write API documentation',             '192.168.1.10', '2025-05-26 09:05:00'),
(2, 'task_create',     'Created task: Implement FAISS search optimisation', '192.168.1.11', '2025-05-26 09:10:00'),
(3, 'task_update',     'Updated task 1 status to completed',                '10.0.0.5',     '2025-05-26 10:00:00'),
(4, 'task_update',     'Updated task 5 status to completed',                '10.0.0.8',     '2025-05-26 10:30:00'),
(3, 'search',          'Search query: machine learning basics',             '10.0.0.5',     '2025-05-26 11:00:00'),
(4, 'search',          'Search query: REST API authentication',             '10.0.0.8',     '2025-05-26 11:15:00'),
(5, 'search',          'Search query: vector similarity search',            '10.0.0.9',     '2025-05-26 11:30:00'),
(3, 'search',          'Search query: django serializers',                  '10.0.0.5',     '2025-05-26 12:00:00'),
(4, 'login',           'User logged in',                                    '10.0.0.8',     '2025-05-26 13:00:00'),
(5, 'login',           'User logged in',                                    '10.0.0.9',     '2025-05-26 13:05:00'),
(2, 'task_create',     'Created task: Design onboarding flow',              '192.168.1.11', '2025-05-26 14:00:00'),
(1, 'task_create',     'Created task: Security audit',                      '192.168.1.10', '2025-05-26 14:10:00'),
(5, 'search',          'Search query: project architecture patterns',       '10.0.0.9',     '2025-05-26 15:00:00');
