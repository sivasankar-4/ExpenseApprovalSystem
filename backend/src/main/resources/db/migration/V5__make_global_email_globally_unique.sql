ALTER TABLE users
    DROP INDEX uk_users_tenant_email,
    ADD CONSTRAINT uk_users_email UNIQUE (email);