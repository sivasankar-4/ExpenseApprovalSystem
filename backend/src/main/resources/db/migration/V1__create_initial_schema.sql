CREATE TABLE tenants (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,

    PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    tenant_id BIGINT NOT NULL,

    PRIMARY KEY (id),

    KEY idx_users_tenant_id (tenant_id),

    CONSTRAINT fk_users_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants (id),

    CONSTRAINT uk_users_tenant_email
        UNIQUE (tenant_id, email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE approval_chains (
    id BIGINT NOT NULL AUTO_INCREMENT,
    approver_role ENUM('EMPLOYEE','FINANCE_ADMIN','MANAGER') NOT NULL,
    max_amount DECIMAL(38,2) NOT NULL,
    min_amount DECIMAL(38,2) NOT NULL,
    step_order INT NOT NULL,
    tenant_id BIGINT NOT NULL,

    PRIMARY KEY (id),

    KEY idx_approval_chains_tenant_id (tenant_id),

    CONSTRAINT fk_approval_chains_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE expenses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    amount DECIMAL(38,2) NOT NULL,
    category VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    currency VARCHAR(255) NOT NULL,
    current_approval_step INT NOT NULL,
    description VARCHAR(1000) DEFAULT NULL,
    status ENUM('PENDING','IN_REVIEW','APPROVED','REJECTED') NOT NULL,
    submitted_by BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    version BIGINT NOT NULL,

    PRIMARY KEY (id),

    KEY idx_expenses_submitted_by (submitted_by),
    KEY idx_expenses_tenant_id (tenant_id),

    CONSTRAINT fk_expenses_submitted_by
        FOREIGN KEY (submitted_by)
        REFERENCES users (id),

    CONSTRAINT fk_expenses_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE approval_action (
    id BIGINT NOT NULL AUTO_INCREMENT,
    acted_at DATETIME(6) NOT NULL,
    action ENUM('APPROVED','REJECTED') NOT NULL,
    comment VARCHAR(500) DEFAULT NULL,
    approver_id BIGINT NOT NULL,
    expense_id BIGINT NOT NULL,
    workflow_step INT NOT NULL,

    PRIMARY KEY (id),

    UNIQUE KEY uk_approval_action_expense_step
        (expense_id, workflow_step),

    KEY idx_approval_action_approver_id (approver_id),

    CONSTRAINT fk_approval_action_expense
        FOREIGN KEY (expense_id)
        REFERENCES expenses (id),

    CONSTRAINT fk_approval_action_approver
        FOREIGN KEY (approver_id)
        REFERENCES users (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE audit_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    action_type VARCHAR(255) NOT NULL,
    entity_id BIGINT NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    actor_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    metadata TEXT,
    tenant_id BIGINT NOT NULL,

    PRIMARY KEY (id),

    KEY idx_audit_log_tenant_id (tenant_id),
    KEY idx_audit_log_actor_id (actor_id),

    CONSTRAINT fk_audit_log_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants (id),

    CONSTRAINT fk_audit_log_actor
        FOREIGN KEY (actor_id)
        REFERENCES users (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE refresh_token (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked BIT(1) NOT NULL,
    token_hash VARCHAR(500) NOT NULL,
    user_id BIGINT NOT NULL,

    PRIMARY KEY (id),

    KEY idx_refresh_token_user_id (user_id),

    CONSTRAINT fk_refresh_token_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

--whenever this application connects to a new database ,create a the database structure 
--when we deploy in railway it connects to a new database
