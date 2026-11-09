# ERD — đọc từ `api/migrations/001_initial.sql`

```mermaid
erDiagram
  USERS ||--o{ PAYMENTS : records
  USERS ||--o{ FILE_METADATA : uploads
  USERS ||--o{ CHECKOUT_HISTORY : records
  USERS ||--o{ HANDOVER_RECORDS : records
  ROOMS ||--o{ TENANTS : accommodates
  ROOMS ||--o{ CONTRACTS : leases
  TENANTS ||--o{ CONTRACTS : signs
  ROOMS ||--o{ INVOICES : billed
  INVOICES ||--o{ PAYMENTS : paid_by
  FILE_METADATA o|--o{ CONTRACTS : contract_pdf
  ROOMS ||--o{ CHECKOUT_HISTORY : checkout
  ROOMS ||--o{ HANDOVER_RECORDS : handover
  CONTRACTS o|--o{ HANDOVER_RECORDS : event

  USERS {
    uuid id PK
    text email UK
    text password_hash
    text role
  }
  ROOMS {
    text id PK
    text name
    integer floor
    bigint price
    text status
  }
  TENANTS {
    text id PK
    text full_name
    text phone
    text room_id FK
    text status
  }
  CONTRACTS {
    text id PK
    text room_id FK
    text tenant_id FK
    uuid contract_file_id FK
    date start_date
    date end_date
  }
  INVOICES {
    text id PK
    text room_id FK
    text month
    bigint total_amount
    text status
  }
  PAYMENTS {
    uuid id PK
    text invoice_id FK
    uuid recorded_by FK
    bigint amount
    timestamptz paid_at
  }
  FILE_METADATA {
    uuid id PK
    text object_key UK
    text original_name
    text mime_type
    bigint size_bytes
    text entity_type
    text entity_id
    timestamptz uploaded_at
    uuid uploaded_by FK
  }
  CHECKOUT_HISTORY {
    uuid id PK
    text room_id FK
    uuid recorded_by FK
    bigint deposit_total
    bigint refund_amount
  }
  HANDOVER_RECORDS {
    uuid id PK
    text room_id FK
    text contract_id FK
    uuid recorded_by FK
    text event_type
  }
  APP_SETTINGS {
    integer id PK
    jsonb data
  }
```

`file_metadata.entity_id` là khóa ngoại đa hình: loại thực thể nằm ở `entity_type`; migration không đặt một FK đơn tới nhiều bảng. `contracts.contract_file_id` tham chiếu `file_metadata.id`. Nội dung tệp nằm trong MinIO; PostgreSQL lưu metadata và object key.
