# Kiểm thử tích hợp và persistence

Điền cột **Kết quả** sau khi chạy ca trên môi trường Docker demo. Không đánh dấu đạt khi chưa có bằng chứng chạy thật.

| ID | Ca kiểm thử | Bước/đầu vào | Kết quả mong đợi | Kết quả |
|---|---|---|---|---|
| AUTH-01 | Đăng nhập administrator | `POST /api/auth/login` với `ADMIN_EMAIL`/`ADMIN_PASSWORD` | 200, nhận JWT; không trả password hash | |
| AUTH-02 | Đăng nhập sai | Mật khẩu sai | 401 | |
| AUTH-03 | Không có JWT | Gọi `GET /api/rooms` | 401 | |
| AUTH-04 | Staff thiếu quyền quản trị | Staff gọi `GET /api/backup` hoặc `DELETE /api/rooms/:id` | 403 | |
| ROOM-01 | Tạo phòng | `POST /api/rooms` dữ liệu hợp lệ | 201 và GET thấy phòng | |
| ROOM-02 | Đọc và tìm phòng | Tìm kiếm theo tên/mã tại giao diện, mở chi tiết | Đúng kết quả và trang chi tiết | |
| ROOM-03 | Sửa phòng | `PUT /api/rooms/:id` | 204, GET phản ánh nội dung mới | |
| ROOM-04 | Xóa phòng | Xác nhận xóa phòng không liên kết | 204; giao diện báo thành công | |
| TENANT-01 | CRUD khách thuê | Tạo, đọc, sửa và xóa hồ sơ đủ điều kiện | POST 201; GET 200; PUT/DELETE 204 | |
| CONTRACT-01 | Tạo hợp đồng | Gắn phòng/khách hợp lệ | 201, trạng thái liên quan được đồng bộ | |
| CONTRACT-02 | Trang chi tiết hợp đồng | Mở hợp đồng và xem tệp liên quan | Đúng thông tin/tệp | |
| INVOICE-01 | Lập hóa đơn | Chỉ số điện/nước hợp lệ | 201, tiền được backend tính đúng | |
| PAYMENT-01 | Thanh toán | Ghi số tiền không vượt dư nợ | 201, lịch sử thanh toán được lưu | |
| FILE-01 | Upload ảnh | JPEG/PNG hợp lệ dưới giới hạn | 201; metadata trong DB, object trong MinIO | |
| FILE-02 | Upload PDF | PDF hợp lệ dưới giới hạn | 201; tên, key, MIME, size, entity ID, thời gian được lưu | |
| FILE-03 | Kiểm tra upload | MIME giả hoặc tệp vượt giới hạn | 400; không lưu object/metadata | |
| FILE-04 | Xem/tải tệp | Mở URL nội bộ có token, thử token hết hạn | Nội dung chỉ cho đúng tệp trong 10 phút; hết hạn 401 | |
| FILE-05 | Bảo vệ credential | Kiểm tra JSON trả về cho file URL | Chỉ URL `/api/files/:id/content?token=...`; không có host/credential MinIO | |
| PERSIST-01 | Bền vững sau restart | Tạo phòng/khách/hợp đồng, upload ảnh và PDF; `docker compose down`; `docker compose up -d` | Bản ghi và hai tệp còn sau đăng nhập | |
| STATIC-01 | Chặn file nội bộ | curl `/api/server.js`, `/compose.yaml`, `/Dockerfile`, `/package.json`, `/.env` | Mỗi URL trả 404 | |
| UI-01 | Chạy offline | Ngắt Internet rồi mở giao diện | Vue, Tailwind, Font Awesome, confetti và ảnh minh họa tải từ local | |
