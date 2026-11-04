# Multi-Tenant Expense Approval System

A multi-tenant SaaS backend where companies can manage expenses through
configurable, role-based approval workflows.

Built with Java, Spring Boot, Spring Security, MySQL, Flyway and JWT.

### Highlights

- 🔐 JWT authentication + RBAC
- 🏢 Tenant-isolated data access
- 🔄 Multi-step, amount-based approval workflows
- 📝 Approval and audit history
- 🗄️ Versioned database migrations with Flyway
- ☁️ Deployed on Railway

---
### Demo Link

https://expense-approval-system-frontend-roan.vercel.app/

---

**Live API:** 
https://multi-tenant-expense-approval-system-production.up.railway.app/

> The deployed backend is secured with Spring Security. Opening the base URL
> without authentication may return `401 Unauthorized`. Use the documented
> authentication endpoint to obtain a JWT before accessing protected APIs.

---
## Problem

In many organizations, expense approvals are handled through email,
spreadsheets or informal processes. This makes approval routing,
accountability and auditability difficult.

This project models a SaaS-style expense approval system where each
company operates as an isolated tenant with configurable approval rules.

Each company can have:

- Its own users
- Its own expenses
- Its own approval chains
- Its own approval history
- Its own audit records

---


# ✨ Key Features

## 🔐 Authentication & Authorization

- JWT-based authentication
- Access token + refresh token flow
- BCrypt password hashing
- Role-based access control
- Method-level authorization with Spring Security
- Role-aware approval actions
- `401 Unauthorized` for unauthenticated access
- `403 Forbidden` for authenticated users without sufficient permissions

Supported roles:

EMPLOYEE
MANAGER
FINANCE_ADMIN

---

## 🏢 Multi-Tenancy

The application uses a shared-database multi-tenant model.

Each user belongs to exactly one tenant, and tenant context is derived from the authenticated user rather than being blindly trusted from the request payload.

Conceptually:

                         Application
                              │
              ┌───────────────┴───────────────┐
              │                               │
           Tenant A                        Tenant B
              │                               │
       ┌──────┼──────┐                 ┌──────┼──────┐
       │      │      │                 │      │      │
      Users Expenses Approvals        Users Expenses Approvals

Tenant isolation is enforced through application-level checks and database-level integrity constraints.

## Invitation and lifecycle email notifications

Invitation and account lifecycle email delivery uses Spring Mail. Configure
`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, and
optionally `INVITATION_ACCEPT_URL` through environment variables. Invitation
delivery runs after the database transaction commits; a provider failure is
logged and the invitation remains available for the Finance Admin to resend
through `POST /api/users/invitations/{id}/resend`.

For local development without a mail server, leave mail configuration unset
and use the invitation response token directly, or provide a local SMTP
capture service such as MailHog. The application reports missing mail
configuration clearly when delivery is attempted.

Production tenant-isolation verification

A user belonging to one tenant was deliberately used to access an expense belonging to another tenant.

Result:

Tenant B user
     ->
Tenant A expense
     ->
403 Forbidden

This verifies that cross-tenant access is rejected in the deployed application.

---
## 💰 Expense Management

Employees can submit expenses containing information such as:

Amount
Currency
Category
Description

The expense belongs to:

Tenant
   ->
Submitting User
   ->
Expense

Expense lifecycle:

PENDING
   ->
IN_REVIEW
   ->
APPROVED

or:

PENDING / IN_REVIEW
   ->
REJECTED

---

## 🔄 Configurable Approval Workflows

Approval rules are stored in the database instead of being hard-coded into the service layer.

An approval chain is defined using:

minAmount
maxAmount
stepOrder
approverRole

Example production configuration:

```
₹0 – ₹10,000
    ↓
MANAGER

₹10,000.01 – ₹50,000
    ↓
MANAGER

₹50,000.01 – ₹90,000
    ↓
MANAGER
    ↓
FINANCE_ADMIN
```
This allows the approval process to change according to the expense amount.

---
## 🧾 Example End-to-End Workflow

A ₹60,000 expense follows a two-step approval process.

EMPLOYEE
   │
   │ Submit ₹60,000 expense
   ▼
PENDING
   │
   ▼
MANAGER
   │
   │ APPROVE
   ▼
IN_REVIEW
   │
   ▼
FINANCE_ADMIN
   │
   │ APPROVE
   ▼
APPROVED

The system also prevents approvers from skipping workflow stages.

For example, when the current required role is FINANCE_ADMIN:

MANAGER
   ↓
403 Forbidden

while the appropriate FINANCE_ADMIN can perform the approval.

## 📝 Approval & Audit History

Approval actions are persisted so the system can retain an approval history.

For an approved expense, the workflow can be represented as:

Expense #2


Step 1
MANAGER
APPROVED


Step 2
FINANCE_ADMIN
APPROVED


Final Status
APPROVED

Audit records preserve information about actions such as:

Actor
Tenant
Entity
Action type
Timestamp
Metadata

This provides a persistent history of important business operations.
---
## 🏗️ Architecture

The project is organized into separate layers for API handling, business logic, domain models, persistence, and infrastructure concerns.

                         Client
                    Postman / Frontend
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Spring Security   │
                 │  JWT + RBAC + CORS  │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │    API / Controllers│
                 │  DTOs + Validation  │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Application Layer   │
                 │ Business Services   │
                 └──────────┬──────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌───────────────┐      ┌────────────────┐
        │ Domain Models │      │ Repositories   │
        │ Business Data │      │ Spring Data JPA│
        └───────────────┘      └───────┬────────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │    MySQL    │
                               └─────────────┘
---
## 🔒 Request Security Flow

A protected request follows this general flow:

                         HTTP Request
                              ↓
                     JWT Authentication Filter
                              ↓
                         Validate JWT
                              ↓
                           Load User
                               ↓
                      Create Authentication
                               ↓
                          SecurityContext
                               ↓
                     Role / Method Authorization
                               ↓
                      Tenant-aware Business Logic
                                ↓
                             Repository
                                ↓
                              MySQL

---

### Simplified relationships:
```
 Tenant
 ├── User
 │    ├── Expense
 │    ├── ApprovalAction
 │    └── RefreshToken
 │
 ├── Expense
 │    └── ApprovalAction
 │
 ├── ApprovalChain
 │
 └── AuditLog

```

📡 API Overview

Keep this table synchronized with the actual controller mappings in the repository.

```
Area	             Example
Authentication	POST /api/auth/login
Authentication	POST /api/auth/refresh
Tenants	        POST /tenants
Users	          POST /users
Expenses        POST /expenses
Approval Chains	POST /approvalChains
```

## 🛠️ Tech Stack

| Technology      | Purpose                        |
| --------------- | ------------------------------ |
| Java            | Backend                        |
| Spring Boot     | Application framework          |
| Spring Security | Authentication & authorization |
| JWT             | API authentication             |
| Spring Data JPA | Data access                    |
| Hibernate       | ORM                            |
| MySQL           | Database                       |
| Flyway          | Database migrations            |
| Maven           | Build                          |
| Postman         | API testing                    |
| Railway         | Deployment                     |

---
### 🧪 Production Validation

The deployed application was manually verified through real API flows:
```
✅ Login
✅ JWT-protected API requests
✅ Refresh-token flow
✅ Employee expense creation
✅ Manager approval
✅ Finance Admin approval
✅ Multi-step approval workflow
✅ Wrong approval role → 403
✅ Cross-tenant access → 403
✅ Audit records created
✅ Flyway migration applied successfully
✅ Existing production data preserved
```
---
### 🧠 Key Design Decisions
Shared database multi-tenancy

Chosen for simpler deployment and schema management at the current scale.

Trade-off: tenant isolation must be consistently enforced by the application and database.

Flyway + ddl-auto=validate

Flyway owns schema changes through versioned migrations.

Hibernate validates the schema instead of modifying production tables automatically.

Tenant context from authentication

The tenant is derived from the authenticated user's context instead of trusting arbitrary tenant IDs from the client.

Approval history

Approval actions are persisted so workflow execution remains auditable rather than relying only on a mutable approval-state field.

---

## Run Locally

### Prerequisites

- Java 21+
- MySQL
- Maven

### Setup

1. Clone the repository:

```bash
git clone https://github.com/sivasankar-4/multi-tenant-expense-approval-system.git
cd multi-tenant-expense-approval-system
```
### Create a MySQL database:
CREATE DATABASE expense_approval_test;
Configure your local database credentials and JWT secret using environment variables or a local Spring profile.
### Run the application:
.\mvnw.cmd spring-boot:run

Flyway automatically applies the database migrations on startup.

---

👨‍💻 Author

Siva Sankar
