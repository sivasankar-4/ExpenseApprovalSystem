ALTER TABLE users
    ADD COLUMN account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD CONSTRAINT chk_users_account_status
        CHECK (account_status IN ('ACTIVE', 'INACTIVE'));
