# Tài Liệu Backend — VinhKhanh Explorer API (Updated with 10 New Features)

> **Framework:** ASP.NET Core 10.0 Web API | **Database:** SQL Server (EF Core 9) | **Auth:** JWT Bearer

---

## 1. Kiến Trúc Hệ Thống

```
Client (React PWA)
      │  HTTPS REST API + JWT
      ▼
ASP.NET Core Web API (.NET 10)
      │  Entity Framework Core + edge-tts (Text-to-Speech)
      ▼
SQL Server (LocalDB / Full)
```

**Các lớp chính:**
- `Controllers/` — Tiếp nhận HTTP Request, trả JSON
- `Services/` — Xử lý Logic nghiệp vụ (POIService, TTSService, AnalyticsService...)
- `Models/Entities/` — Định nghĩa các bảng dữ liệu
- `Models/DTOs/` — Data Transfer Objects (Input/Output API)
- `Data/` — DbContext, SeedData

---

## 2. Database Schema (Mới Cập Nhật Phase 1-4)

| Bảng | Mô tả | Mới cập nhật |
|------|-------|--------------|
| `Owners` | Tài khoản chủ quán | Thêm `LastLoginAt` |
| `AdminUsers` | Tài khoản quản trị viên CMS | Thêm `LastLoginAt` |
| `Languages` | Danh sách ngôn ngữ hỗ trợ | Thêm `IsDefault`, `IsActive` |
| `POIs` | Điểm quan tâm, liên kết với Owner | |
| `POIImages` | Chứa nhiều hình ảnh của 1 POI | **MỚI** |
| `MenuItems` | Món ăn trong thực đơn | Thêm `IsAvailable`, `DisplayOrder` |
| `Notifications` | Thông báo gửi tới Owner | **MỚI** |
| `AuditLogs` | Lưu nhật ký thay đổi hệ thống | **MỚI** |
| `Tours` & `TourStops` | Hành trình tham quan | Đã có API |
| `QRCodes` | Mã QR của từng địa điểm | Đã có API Scan |
| `QuizQuestions` | Câu hỏi đố vui theo địa điểm | Đã có API |
| `VisitLogs` | Lịch sử lượt truy cập địa điểm | Đã có API Charts |
| `AudioFiles` | Tệp âm thanh TTS | Đã có API Admin |

---

## 3. API Endpoints Mới Thêm (10 Tính Năng)

> 🔓 = Public  |  🏠 = Owner JWT  |  🛡️ = Admin JWT

### 3.1 Owner Core APIs (`/api/owner`)
- `POST /api/owner/menu-items` 🏠: Thêm món ăn mới cho quán (Cần POIId trong DTO).
- `PUT /api/owner/menu-items/{id}` 🏠: Cập nhật món ăn.
- `DELETE /api/owner/menu-items/{id}` 🏠: Xoá món ăn.
- `POST /api/owner/pois/{id}/images` 🏠: Upload danh sách URL ảnh cho quán.
- `PUT /api/owner/pois/{id}/cover-image` 🏠: Chọn ảnh làm cover (IsCover = true).
- `PUT /api/owner/pois/{id}/images/reorder` 🏠: Sắp xếp lại thứ tự ảnh.
- `DELETE /api/owner/pois/{id}/images/{imageId}` 🏠: Xoá 1 ảnh của quán.
- `PUT /api/owner/menu-items/{id}/availability` 🏠: Bật/tắt trạng thái hiển thị (Còn/Hết) của món ăn.
- `GET /api/owner/dashboard/charts` 🏠: Biểu đồ thống kê lượt Scan/Visit theo ngày của Owner.

### 3.2 Notification API (`/api/notifications`)
- `GET /api/notifications` 🏠: Xem danh sách thông báo.
- `PUT /api/notifications/{id}/read` 🏠: Đánh dấu đã đọc.

### 3.3 Public Features
- `GET /api/pois/{id}/menu` 🔓: Lấy menu món ăn của quán.
- `GET /api/pois/{id}/quiz` 🔓: Lấy danh sách câu hỏi Quiz của quán.
- `POST /api/quiz/submit` 🔓: Gửi đáp án trả lời Quiz.
- `GET /api/tours` 🔓: Lấy danh sách Tour.
- `GET /api/tours/{id}` 🔓: Lấy chi tiết Tour và điểm đến.
- `GET /api/qr/{code}` 🔓: Quét QR Code để mở POI và ghi log VisitLog.

### 3.4 Admin Operations (`/api/admin`)
- `GET /api/admin/languages` 🛡️: Lấy danh sách ngôn ngữ.
- `PUT /api/admin/languages/{code}/status` 🛡️: Bật/tắt ngôn ngữ.
- `PUT /api/admin/languages/{code}/default` 🛡️: Set ngôn ngữ mặc định.
- `POST /api/admin/tours`, `PUT`, `DELETE` 🛡️: Quản lý Tour.
- `POST /api/admin/tours/{id}/stops`, `DELETE` 🛡️: Quản lý điểm đến (TourStops) trong Tour.
- `GET /api/admin/qr` 🛡️: Lấy danh sách tất cả mã QR trên hệ thống.
- `POST /api/admin/pois/{id}/generate-qr` 🛡️: Sinh mã QR tự động.
- `GET /api/admin/pois/{id}/qr` 🛡️: Xem danh sách QR của 1 POI.
- `POST /api/admin/quiz`, `PUT`, `DELETE` 🛡️: Quản lý ngân hàng câu hỏi Quiz.
- `GET /api/admin/audit-logs` 🛡️: Lấy lịch sử chỉnh sửa hệ thống.
- `GET /api/admin/audio` 🛡️: Quản lý file âm thanh TTS.
- `POST /api/admin/audio/{id}/regenerate` 🛡️: Sinh lại file âm thanh lỗi theo ID.
- `DELETE /api/admin/audio/{id}` 🛡️: Xoá audio.
