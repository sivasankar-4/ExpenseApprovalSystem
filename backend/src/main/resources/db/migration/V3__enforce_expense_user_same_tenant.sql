-- Fix any remaining cross-tenant expense records
UPDATE expenses e
  JOIN users u ON e.submitted_by = u.id
   SET e.submitted_by = (
       SELECT u2.id FROM users u2
        WHERE u2.tenant_id = e.tenant_id
          AND u2.role = 'EMPLOYEE'
        LIMIT 1
   )
 WHERE e.tenant_id <> u.tenant_id;

-- Add a unique index on (id, tenant_id) in users so it can be referenced by a composite FK
ALTER TABLE users
  ADD UNIQUE INDEX uq_users_id_tenant (id, tenant_id);

-- Add a composite FK: expenses(submitted_by, tenant_id) → users(id, tenant_id)
-- This makes it physically impossible to have an expense whose submitted_by user
-- belongs to a different tenant than the expense itself.
ALTER TABLE expenses
  ADD CONSTRAINT fk_expense_user_same_tenant
  FOREIGN KEY (submitted_by, tenant_id)
  REFERENCES users (id, tenant_id);
