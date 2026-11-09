# DA05 — Quản lý phòng trọ

## 1. Tên đề tài và thành viên

**Đề tài:** DA05 — Xây dựng hệ thống quản lý phòng trọ.

| STT | Họ tên | MSSV | Vai trò |
|---:|---|---|---|
| 1 | Ngô Chí Quyển | 24210501034 | Trưởng nhóm |
| 2 | Trịnh Lâm Huy | 24210501016 | Thành viên |
| 3 | Mã Khánh Tường | 24210501041 | Thành viên |
| 4 | Lê Nhựt Duy | 24210501006 | Thành viên |
| 5 | Nguyễn Ca Gu | 24210501053 | Thành viên |

## 2. Công nghệ sử dụng

Vue 3, HTML, CSS, Tailwind Play CDN (được lưu cục bộ trong `vendor/`), Font Awesome, canvas-confetti, Node.js 22, Express REST API, JWT, bcrypt, PostgreSQL 16, MinIO S3 API, Docker và Docker Compose. Nội dung ảnh/PDF được lưu trong MinIO; PostgreSQL chỉ lưu metadata và object key.

## 3. Yêu cầu môi trường

- Docker Desktop hoặc Docker Engine có Docker Compose v2.
- Cổng 8080, 9000 và 9001 khả dụng.
- Node.js 22 chỉ cần khi chạy kiểm thử hoặc chạy API ngoài Docker.
- Không cần Internet để tải Vue, Tailwind, Font Awesome, canvas-confetti, phông chữ và ảnh minh họa: các tài nguyên giao diện nằm trong `vendor/`. VietQR vẫn gọi dịch vụ bên thứ ba khi người dùng mở mã QR.

## 4. Tạo tệp môi trường

Trong PowerShell tại thư mục dự án:

```powershell
Copy-Item .env.example .env
```

Thay toàn bộ giá trị mẫu trong `.env` bằng giá trị riêng, đặc biệt là `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD` và `STAFF_PASSWORD`. Không commit hoặc chia sẻ `.env`. Mật khẩu tài khoản phải dài ít nhất 10 ký tự; `JWT_SECRET` phải dài ít nhất 32 ký tự.

Các biến trong `.env.example`: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STAFF_NAME`, `STAFF_EMAIL`, `STAFF_PASSWORD`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET`, `MAX_UPLOAD_MB`, `APP_PORT`.

## 5. Khởi chạy

```powershell
docker compose up -d --build
docker compose ps
```

Compose khởi chạy `app`, `db`, `minio` và tác vụ `minio-init` để tạo bucket riêng tư. Kiểm tra API health trước khi demo. Dữ liệu mẫu nghiệp vụ không tự động được thêm vào cơ sở dữ liệu.

## 6. URL giao diện web

- Giao diện: http://localhost:8080/
- API health: http://localhost:8080/api/health

## 7. URL Swagger

- Swagger UI: http://localhost:8080/api/docs/
- OpenAPI JSON: http://localhost:8080/api/openapi.json
- Postman collection: `postman/collection.json`

## 8. URL MinIO Console

- MinIO Console: http://localhost:9001/
- MinIO S3 API: http://localhost:9000/

Thông tin đăng nhập Console lấy từ `MINIO_ROOT_USER` và `MINIO_ROOT_PASSWORD` trong `.env`. PostgreSQL không publish cổng ra host. Bucket MinIO được đặt private.

## 9. Tài khoản demo

Tài khoản khởi tạo khi bảng `users` còn trống, lấy từ `ADMIN_EMAIL`/`ADMIN_PASSWORD` (vai trò `administrator`) và `STAFF_EMAIL`/`STAFF_PASSWORD` (vai trò `staff`) trong `.env`. Giá trị trong `.env.example` chỉ là placeholder; hãy đặt mật khẩu demo riêng trước khi trình diễn. Mật khẩu được lưu dưới dạng BCrypt hash.

## 10. Dừng ứng dụng, giữ dữ liệu

```powershell
docker compose down
```

Lệnh này giữ nguyên named volumes `postgres-data` và `minio-data`. Khởi động lại bằng `docker compose up -d`.

## 11. Xóa dữ liệu demo (chỉ ghi chú)

```powershell
docker compose down -v
```

Lệnh trên xóa named volumes và dữ liệu PostgreSQL/MinIO. **Không chạy lệnh này nếu cần giữ dữ liệu.**

## Chức năng và API

- CRUD phòng, khách thuê, hợp đồng, hóa đơn; tìm kiếm/lọc, xem chi tiết và xác nhận xóa trên giao diện.
- Dashboard, lập hóa đơn điện/nước, lịch sử thanh toán, VietQR, trả phòng và quyết toán tiền cọc.
- Upload ảnh/PDF lên MinIO; metadata gồm tên gốc, object key, MIME, dung lượng, thời điểm upload và loại/mã thực thể được lưu trong PostgreSQL. Hỗ trợ xem và tải tệp.
- Tệp trả về giao diện bằng URL nội bộ có JWT riêng, chỉ dùng cho nội dung một tệp và hết hạn sau 10 phút. Không đưa credential MinIO vào trình duyệt.
- REST API dùng JWT bearer; `administrator` và `staff` có quyền khác nhau. POST trả 201, PUT/DELETE trả 204; lỗi dùng mã 400/401/403/404/500 theo ngữ nghĩa.
- API nghiệp vụ chính: `/api/auth/login`, `/api/rooms`, `/api/tenants`, `/api/contracts`, `/api/invoices`, `/api/payments`, `/api/files` và `/api/backup`.

## Tài liệu thiết kế và kiểm thử

- Use case: `docs/USE_CASE.md`
- ERD dựa trên migration: `docs/ERD.md`
- Deployment: `docs/DEPLOYMENT.md`
- Ca kiểm thử và cột kết quả: `docs/KiemThu.md`
- Dàn ý báo cáo: `docs/DanYBaoCao.md`

Các sơ đồ là nguồn Mermaid Markdown để xuất hình. Dàn ý báo cáo là khung điền nội dung, không phải báo cáo hoàn chỉnh.

## Kiểm thử tự động

```powershell
node --test api/test/domain.test.js
```

Kiểm thử tích hợp Docker và kiểm chứng persistence phải được thực hiện trên Docker Engine hoạt động. Không xem các ca chưa chạy là PASS.
