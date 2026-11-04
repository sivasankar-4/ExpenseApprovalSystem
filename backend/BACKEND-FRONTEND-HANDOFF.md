# Backend/frontend integration handoff

## Readiness summary

The backend is ready for frontend integration at the application-contract level. Authentication, tenant-scoped user and expense flows, invitations, lifecycle operations, Finance Admin transfer, and role-based approval operations are implemented. The backend derives the tenant and actor from the authenticated context; clients must not send tenant or submitter IDs for these flows.

The remaining release check is live MySQL validation of Flyway V1-V9 and Hibernate schema validation against a disposable database. It is not safe to start the application with the checked-in datasource settings because they reference a remote database.

## Authentication

- Login: `POST /api/auth/login`, public.
  - Request: `{ "email": "string", "password": "string" }`
  - Success `200`: `{ "accessToken": "string", "tokenType": "Bearer" }`
  - Also sets an HttpOnly `refreshToken` cookie.
- Refresh: `POST /api/auth/refresh`, public.
  - No request body. Requires the `refreshToken` HttpOnly cookie.
  - Success `200`: same login response and a rotated refresh cookie.
- Logout: `POST /api/auth/logout`, public.
  - Refresh cookie is optional. Success `204` and expired refresh cookie.
- Access-token requests use `Authorization: Bearer <accessToken>`.
- CORS credentials are enabled for the configured frontend origins.

## Invitation onboarding

All invitation-management endpoints require `FINANCE_ADMIN` and use the authenticated admin's tenant.

- Create: `POST /api/users/invitations`
  - Request: `{ "email": "string", "role": "EMPLOYEE|MANAGER|FINANCE_ADMIN" }`
  - `email` is required and valid-format; `role` is required.
  - Success `201`: `{ "id": number, "email": "string", "role": "enum", "token": "string", "expiresAt": "ISO local datetime" }`
- Resend: `POST /api/users/invitations/{id}/resend`
  - No body. Success `200` with the same invitation response shape.
  - Rotates the token and expiry; the previous token is invalid.
  - Accepted or revoked invitations cannot be resent.
- Revoke: `DELETE /api/users/invitations/{id}`
  - Success `204`.
- Accept: `POST /api/auth/invitations/accept`, public.
  - Request: `{ "token": "string", "name": "string", "password": "string" }`
  - Password must contain at least 8 characters.
  - Success `204`.
  - Invalid, expired, used, revoked, or otherwise unavailable invitations return an error.

The invitation response contains the one-time raw token for the existing onboarding flow. The database stores only its hash; clients must treat the response token as secret and never log it.

## Users and account lifecycle

All endpoints below require `FINANCE_ADMIN`; IDs are resolved within the authenticated tenant.

- List users: `GET /api/users`
  - Success `200`: array of `{ id, name, email, role, tenantid }`.
- Get user: `GET /api/users/{id}`
  - Success `200`: user response above.
- Create user: `POST /api/users`
  - Request: `{ "name": "string", "email": "string", "password": "string", "role": "enum" }`
  - Name/email/password/role are required; password minimum is 8 characters.
  - Success `201`: user response.
- Update profile/role: `PUT /api/users/{id}`
  - Request: `{ "name": "string", "email": "string", "role": "enum" }`
  - This is the role-change endpoint; there is no separate role-only endpoint.
  - Success `200`: user response.
  - Role changes invalidate the user's existing authorization credentials and notify/audit the change.
- Deactivate: `PUT /api/users/{id}/deactivate`
  - Success `200`: user response.
  - Existing credentials are invalidated. Pending approval work that would become unassignable is rejected.
- Reactivate: `PUT /api/users/{id}/reactivate`
  - Success `200`: user response.
  - A fresh login is required.
- Transfer Finance Admin: `POST /api/users/transfer-finance-admin`
  - Request: `{ "targetUserId": number }`
  - Target must be active, same-tenant, non-self, and not already Finance Admin.
  - Success `200`: incoming admin's user response.
  - Both affected users' credentials are invalidated; one audit event records outgoing and incoming IDs.
- Delete user: `DELETE /api/users/{id}`
  - Success `204`. This is a hard-delete endpoint and is not the lifecycle-safe deactivation flow.

## Expenses and approval workflow

Expense endpoints use the `/expenses` root.

- Submit: `POST /expenses`
  - Roles: `EMPLOYEE`, `MANAGER`, `FINANCE_ADMIN`.
  - Request: `{ "amount": number, "currency": "string", "category": "string", "description": "string" }`
  - Amount must be positive; all string fields are required.
  - Tenant and submitter come from authentication.
  - Success `201`: `{ id, submittedBy, amount, description, status, tenantName, createdAt }`.
- List: `GET /expenses`
  - Any authenticated role.
  - Employees see their own expenses; managers and Finance Admins see tenant expenses.
- Get: `GET /expenses/{id}`
  - Any authenticated role, subject to tenant and employee ownership checks.
- Update: `PUT /expenses/{id}`
  - Roles: all three roles.
  - Request: `{ "amount": number, "description": "string" }`.
  - Amount must be positive and description required.
- Approve: `PUT /expenses/{id}/approve`
- Reject: `PUT /expenses/{id}/reject`
  - Roles: `MANAGER` or `FINANCE_ADMIN`.
  - The service resolves the expected approval role from the tenant's configured approval chain and completed approval actions. It does not accept an approver or tenant ID from the client.
  - Pending workflow operations are tenant/expense locked.
- Delete: `DELETE /expenses/{id}`
  - Roles: all three roles; service-level ownership/tenant rules still apply.

Approval-chain administration is also available to Finance Admins under `/approvalChains` with create/list/get/update/delete operations. Requests use `minAmount`, `maxAmount`, `stepOrder`, and `approverRole`; responses additionally include `id` and `tenantId`.

## Error contract

- Unauthenticated requests: `401` with `{ "error": "Unauthorized" }`.
- Authenticated users lacking the required role: `403` with `{ "error": "Forbidden" }`.
- Domain `IllegalArgumentException`: `400` with `{ "error": "message" }`.
- Workflow safeguard failures: `409` with `{ "error": "message" }`.
- Optimistic-lock conflicts: `409` with `{ "error": "This expense was modified by another user. Please refresh and try again." }`.
- Bean validation failures: `400` with a field-to-message map, for example `{ "email": "Invalid email format" }`.
- Other service-specific not-found and authentication failures may be surfaced by the standard Spring error handling if not mapped by the global handler; frontend code should handle non-JSON/unexpected errors defensively.

## Confirmed changes in this handoff

- Fixed user updates so a profile/role update cannot overwrite the stored password with `null`.
- Removed an approval-controller `System.out` debug print.
- Added a regression test covering password preservation during user updates.

## Release blockers and next checks

1. **Disposable MySQL migration/startup check:** provide authorized local MySQL credentials, create an isolated schema/user, override datasource settings through environment variables, run Flyway V1-V9 with `spring.jpa.hibernate.ddl-auto=validate`, and start the application.
2. HTTP-level multi-tenant and role matrix testing remains a release check; service/unit coverage exists, but no live authenticated API test was run.
3. No frontend project is present in this repository, so frontend build/browser validation is outside this handoff.
