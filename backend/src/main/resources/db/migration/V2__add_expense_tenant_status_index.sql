CREATE INDEX idx_expenses_tenant_status
ON expenses (tenant_id, status);