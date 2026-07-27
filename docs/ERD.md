# SILQU — Entity Relationship Diagram

Generated from `prisma/schema.prisma` (Phase 2). Regenerate this by hand
whenever the schema changes materially — see `docs/SILQU_BUILD_PLAN_V2.md`
section 5 for the full model list and the reasoning behind each constraint.

```mermaid
erDiagram
    ORGANIZATION ||--o| SUBSCRIPTION : has
    ORGANIZATION ||--o{ USER : employs
    ORGANIZATION ||--o{ PROPERTY : owns
    ORGANIZATION ||--o{ TENANT : manages
    ORGANIZATION ||--o{ INVITATION : sends
    ORGANIZATION ||--o{ AUDIT_LOG : logs
    ORGANIZATION ||--o{ EMAIL_LOG : logs
    ORGANIZATION ||--o{ MPESA_TRANSACTION : records

    USER ||--o| EMPLOYEE_PROFILE : "sub-role"
    USER ||--o{ CARETAKER_ASSIGNMENT : "assigned to"
    USER ||--o| TENANT : "linked account"
    USER ||--o{ PAYMENT : records
    USER ||--o{ MAINTENANCE_REQUEST : "assigned"
    USER ||--o{ MAINTENANCE_COMMENT : writes
    USER ||--o{ ANNOUNCEMENT : creates
    USER ||--o{ INVITATION : creates
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ DOCUMENT : uploads
    USER ||--o{ AUDIT_LOG : acts

    PROPERTY ||--o{ UNIT : contains
    PROPERTY ||--o{ CARETAKER_ASSIGNMENT : scopes
    PROPERTY ||--o{ MAINTENANCE_REQUEST : scopes
    PROPERTY ||--o{ ANNOUNCEMENT : scopes

    UNIT ||--o{ LEASE : "let via"
    UNIT ||--o{ CARETAKER_ASSIGNMENT : scopes
    UNIT ||--o{ MAINTENANCE_REQUEST : scopes
    UNIT ||--o{ ANNOUNCEMENT : scopes

    TENANT ||--o{ LEASE : signs
    TENANT ||--o{ PAYMENT : pays
    TENANT ||--o{ MAINTENANCE_REQUEST : raises
    TENANT ||--o{ INVITATION : "invited via"

    LEASE ||--o{ INVOICE : generates
    LEASE ||--o{ PAYMENT : "settled by"

    INVOICE ||--o{ INVOICE_LINE : "made of"
    INVOICE ||--o{ PAYMENT_ALLOCATION : "settled by"

    PAYMENT ||--o{ PAYMENT_ALLOCATION : allocates

    MAINTENANCE_REQUEST ||--o{ MAINTENANCE_COMMENT : "discussed in"

    ORGANIZATION {
        string id PK
        string name
        string county
        OrganizationStatus status
    }
    SUBSCRIPTION {
        string id PK
        string orgId FK
        SubscriptionPlan plan
        SubscriptionStatus status
        int unitLimit
    }
    USER {
        string id PK
        string orgId FK "nullable — null for platform roles"
        string email UK
        string fullName
        Role role
        UserStatus status
    }
    EMPLOYEE_PROFILE {
        string userId PK_FK
        EmployeeSubRole subRole
    }
    CARETAKER_ASSIGNMENT {
        string id PK
        string userId FK
        string propertyId FK
        string unitId FK "nullable — property-wide if null"
    }
    PROPERTY {
        string id PK
        string orgId FK
        string name
        PropertyType type
        PropertyStatus status
    }
    UNIT {
        string id PK
        string orgId FK
        string propertyId FK
        string label
        int rentCents "int cents, capped at KES 21,474,836"
        int depositCents
        UnitStatus status
    }
    TENANT {
        string id PK
        string orgId FK
        string userId FK "nullable until invite accepted"
        string fullName
        string nationalId
        TenantStatus status
    }
    LEASE {
        string id PK
        string orgId FK
        string unitId FK
        string tenantId FK
        int rentCents
        int depositCents
        int billingDay
        LeaseStatus status "one ACTIVE per unit — partial unique index"
    }
    INVOICE {
        string id PK
        string orgId FK
        string leaseId FK
        string invoiceNo UK
        int periodYear
        int periodMonth
        int totalCents
        int paidCents
        int balanceCents
        InvoiceStatus status
    }
    INVOICE_LINE {
        string id PK
        string invoiceId FK
        InvoiceLineCategory category
        int amountCents
    }
    PAYMENT {
        string id PK
        string orgId FK
        string tenantId FK
        string leaseId FK
        int amountCents
        PaymentMethod method
        string mpesaReceipt "nullable"
        PaymentStatus status
    }
    PAYMENT_ALLOCATION {
        string id PK
        string paymentId FK
        string invoiceId FK
        int amountCents
    }
    MPESA_TRANSACTION {
        string id PK
        string orgId FK "nullable — subscription txns may predate an org"
        MpesaPurpose purpose
        string checkoutRequestId UK
        MpesaStatus status
        json rawCallback
    }
    MAINTENANCE_REQUEST {
        string id PK
        string orgId FK
        string unitId FK
        string tenantId FK "nullable"
        MaintenanceCategory category
        MaintenancePriority priority
        MaintenanceStatus status
    }
    MAINTENANCE_COMMENT {
        string id PK
        string requestId FK
        string userId FK
        string body
    }
    ANNOUNCEMENT {
        string id PK
        string orgId FK
        AnnouncementAudience audience
        string propertyId FK "nullable"
        string unitId FK "nullable"
    }
    INVITATION {
        string id PK
        string orgId FK
        string tokenHash UK
        Role role
        string tenantId FK "nullable"
    }
    NOTIFICATION {
        string id PK
        string userId FK
        string type
        datetime readAt "nullable"
    }
    DOCUMENT {
        string id PK
        string orgId FK
        DocumentEntityType entityType
        string fileKey
        bool isPrivate
    }
    AUDIT_LOG {
        string id PK
        string orgId FK "nullable"
        string actorUserId FK "nullable"
        string action
        json before
        json after
    }
    EMAIL_LOG {
        string id PK
        string orgId FK "nullable"
        string to
        EmailStatus status
    }
```

## Notes that don't fit in the diagram

- **Money** is `Int` cents everywhere (`*Cents` columns), never `Float`/`Decimal`/`BigInt` on a row — see build plan section 5.3.
- **One ACTIVE lease per unit** is enforced by a partial unique index (`one_active_lease_per_unit`), not visible in Prisma's schema DSL — see migration `20260727092408_partial_indexes`.
- **Idempotency**: `Invoice` is unique on `(leaseId, periodYear, periodMonth)`; `MpesaTransaction` is unique on `checkoutRequestId`.
- **Financial relations use `onDelete: Restrict`** (Lease→Unit/Tenant, Invoice→Lease, Payment→Tenant/Lease, PaymentAllocation→Payment/Invoice, InvoiceLine→Invoice) — archive via `status`, never delete.
