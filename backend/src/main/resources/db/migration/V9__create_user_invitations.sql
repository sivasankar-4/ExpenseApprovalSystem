CREATE TABLE user_invitations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used_at DATETIME(6) DEFAULT NULL,
    revoked BIT(1) NOT NULL DEFAULT b'0',
    created_at DATETIME(6) NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_user_invitations_token_hash (token_hash),
    KEY idx_user_invitations_tenant_email (tenant_id, email),

    CONSTRAINT fk_user_invitations_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
