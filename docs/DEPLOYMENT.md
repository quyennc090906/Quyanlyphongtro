# Deployment Diagram

```mermaid
flowchart LR
  Browser[Trình duyệt<br/>Vue 3 + HTML + CSS + tài nguyên vendor cục bộ]
  subgraph Compose[Docker Compose — network app-net]
    App[app / web container<br/>Node.js 22 + Express REST API<br/>8080]
    DB[(db container<br/>PostgreSQL 16<br/>postgres-data volume)]
    Minio[(minio container<br/>S3 API :9000<br/>Console :9001<br/>minio-data volume)]
    Init[minio-init<br/>Tạo bucket private]
    App -->|SQL :5432| DB
    App -->|S3 API nội bộ :9000| Minio
    Init -->|Tạo bucket| Minio
  end
  Browser -->|HTTP :8080| App
  Browser -->|Console :9001| Minio
```

Compose publish app `8080:8080`, MinIO S3 `9000:9000` và Console `9001:9001`. PostgreSQL chỉ nằm trong network riêng. Credential được nạp qua `.env`; hai named volume giữ dữ liệu khi container bị dừng/xóa mà không dùng `-v`. Bucket MinIO private; giao diện nhận URL nội bộ có JWT dùng riêng cho một tệp, hết hạn sau 10 phút.
