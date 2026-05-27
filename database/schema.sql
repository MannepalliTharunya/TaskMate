-- =============================================================
-- AI-Powered Task & Knowledge Management System
-- MySQL Relational Database Schema
-- =============================================================

CREATE DATABASE IF NOT EXISTS task_knowledge_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE task_knowledge_db;

-- =============================================================
-- 1. ROLES
-- =============================================================
CREATE TABLE roles (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)     NOT NULL,
    description VARCHAR(255)    NOT NULL DEFAULT '',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_roles         PRIMARY KEY (id),
    CONSTRAINT uq_roles_name    UNIQUE (name),
    CONSTRAINT chk_roles_name   CHECK (name IN ('admin', 'user'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 2. USERS
-- =============================================================
CREATE TABLE users (
    id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    role_id       INT UNSIGNED     NOT NULL,
    email         VARCHAR(254)     NOT NULL,
    username      VARCHAR(150)     NOT NULL,
    first_name    VARCHAR(100)     NOT NULL DEFAULT '',
    last_name     VARCHAR(100)     NOT NULL DEFAULT '',
    password_hash VARCHAR(255)     NOT NULL,
    is_active     TINYINT(1)       NOT NULL DEFAULT 1,
    is_staff      TINYINT(1)       NOT NULL DEFAULT 0,
    last_login    DATETIME             NULL,
    created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_users          PRIMARY KEY (id),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT fk_users_role     FOREIGN KEY (role_id)
        REFERENCES roles (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_role_id   ON users (role_id);
CREATE INDEX idx_users_is_active ON users (is_active);
CREATE INDEX idx_users_email     ON users (email);


-- =============================================================
-- 3. TASKS
-- =============================================================
CREATE TABLE tasks (
    id             BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    created_by_id  BIGINT UNSIGNED  NOT NULL,
    assigned_to_id BIGINT UNSIGNED      NULL,
    title          VARCHAR(255)     NOT NULL,
    description    TEXT             NOT NULL DEFAULT '',
    status         VARCHAR(20)      NOT NULL DEFAULT 'pending',
    due_date       DATE                 NULL,
    created_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_tasks              PRIMARY KEY (id),
    CONSTRAINT chk_tasks_status      CHECK (status IN ('pending', 'completed')),
    CONSTRAINT fk_tasks_created_by   FOREIGN KEY (created_by_id)
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_tasks_assigned_to  FOREIGN KEY (assigned_to_id)
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tasks_status        ON tasks (status);
CREATE INDEX idx_tasks_assigned_to   ON tasks (assigned_to_id);
CREATE INDEX idx_tasks_created_by    ON tasks (created_by_id);
CREATE INDEX idx_tasks_due_date      ON tasks (due_date);
-- Composite: common filter pattern — assigned user + status
CREATE INDEX idx_tasks_assigned_status ON tasks (assigned_to_id, status);


-- =============================================================
-- 4. DOCUMENTS
-- =============================================================
CREATE TABLE documents (
    id             BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    uploaded_by_id BIGINT UNSIGNED  NOT NULL,
    title          VARCHAR(255)     NOT NULL,
    file_path      VARCHAR(500)     NOT NULL,
    content        LONGTEXT         NOT NULL DEFAULT '',
    faiss_indexed  TINYINT(1)       NOT NULL DEFAULT 0,
    faiss_doc_id   INT                  NULL COMMENT 'Starting vector index in FAISS flat index',
    created_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_documents              PRIMARY KEY (id),
    CONSTRAINT uq_documents_file_path    UNIQUE (file_path),
    CONSTRAINT fk_documents_uploaded_by  FOREIGN KEY (uploaded_by_id)
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_documents_uploaded_by  ON documents (uploaded_by_id);
CREATE INDEX idx_documents_faiss_indexed ON documents (faiss_indexed);
-- Full-text index for optional keyword fallback search
CREATE FULLTEXT INDEX ft_documents_content ON documents (title, content);


-- =============================================================
-- 5. ACTIVITY LOGS
-- =============================================================
CREATE TABLE activity_logs (
    id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED  NOT NULL,
    action     VARCHAR(50)      NOT NULL,
    detail     TEXT             NOT NULL DEFAULT '',
    ip_address VARCHAR(45)          NULL COMMENT 'Supports IPv4 and IPv6',
    created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_activity_logs        PRIMARY KEY (id),
    CONSTRAINT chk_activity_logs_action CHECK (
        action IN ('login', 'task_create', 'task_update', 'document_upload', 'search')
    ),
    CONSTRAINT fk_activity_logs_user   FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_activity_logs_user_id   ON activity_logs (user_id);
CREATE INDEX idx_activity_logs_action    ON activity_logs (action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at);
-- Composite: user timeline queries
CREATE INDEX idx_activity_logs_user_created ON activity_logs (user_id, created_at DESC);
