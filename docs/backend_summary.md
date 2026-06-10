# Tài Liệu Backend — VinhKhanh Explorer API (Updated)

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
- `Middleware/` — Global Exception Handler
- `Extensions/` — ServiceExtensions (DI Registration)

---

## 2. Database Schema (Mới Cập Nhật)

| Bảng | Mô tả |
|------|-------|
| `Owners` | Tài khoản chủ quán (Đã thay thế bảng Users) |
| `AdminUsers` | Tài khoản quản trị viên CMS |
| `Languages` | Danh sách ngôn ngữ hỗ trợ (vi, en, ja, ko, zh) |
| `POICategories` | Danh mục địa điểm (restaurant, cafe, temple...) |
| `POIs` | Điểm quan tâm, liên kết với Owner (`OwnerId`) |
| `POITranslations` | Nội dung đa ngôn ngữ của từng POI |
| `AudioFiles` | Tệp âm thanh thuyết minh (sinh tự động qua TTS) |
| `MenuItems` | Món ăn trong thực đơn của từng POI |
| `MenuItemTranslations` | Tên/mô tả món ăn đa ngôn ngữ |
| `Tours` | Hành trình tham quan định sẵn |
| `TourStops` | Các điểm dừng trong từng Tour |
| `QRCodes` | Mã QR của từng địa điểm |
| `QuizQuestions` | Câu hỏi đố vui theo địa điểm |
| `QuizQuestionTranslations` | Câu hỏi đa ngôn ngữ |
| `VisitLogs` | Lịch sử lượt truy cập địa điểm (ẩn danh) |
| `AnalyticsEvents` | Ghi nhận sự kiện hệ thống chung |

*(Đã gỡ bỏ: `Users`, `Favorites`, `AudioProgress` do không áp dụng mô hình tài khoản người dùng cuối).*

---

## 3. Entities (Models) Nổi Bật

### 3.1 Owner
```
Id, Username, Email, PasswordHash, DisplayName,
AvatarUrl, DefaultLanguage,
OwnerStatus (pending, approved, rejected), AdminNote,
RefreshToken, RefreshTokenExpiry,
CreatedAt, UpdatedAt
```

### 3.2 POI (Điểm Quan Tâm)
```
Id, Name, Slug, Latitude, Longitude, TriggerRadiusMeters,
Category, CategoryId (FK), Priority,
OwnerId (FK), ApprovalStatus (pending, approved, rejected),
Address, Ward, District, City, Phone, Website, FacebookUrl,
ImageUrl, GoogleMapsUrl,
IsActive, DeletedAt (Soft Delete),
CreatedAt, UpdatedAt
```

### 3.3 AudioFile & VisitLog
- **AudioFile**: `Id, POIId, LanguageCode, FilePath, AudioType (tts|pre-recorded), TTSProvider, GeneratedAt`
- **VisitLog**: `Id, POIId, SessionId, TriggerType (geofence|qr|manual), LanguageCode, VisitedAt`

---

## 4. API Endpoints Chính

> 🔓 = Public (không cần JWT)  
> 🏠 = Owner JWT  
> 🛡️ = Admin JWT

### 4.1 Authentication & Profile
- `POST /api/auth/register` 🔓: Đăng ký Owner
- `POST /api/auth/login` 🔓: Đăng nhập Owner
- `POST /api/auth/admin/login` 🔓: Đăng nhập Admin
- `PUT /api/auth/profile` 🏠: Cập nhật hồ sơ Owner

### 4.2 Owner Management (`/api/owner`)
- `GET /api/owner/pois` 🏠: Xem danh sách POI của chính mình
- `POST /api/owner/pois` 🏠: Đăng ký POI mới (Trạng thái mặc định: pending)
- `PUT /api/owner/pois/{id}` 🏠: Cập nhật thông tin POI
- `GET /api/owner/dashboard` 🏠: Xem thống kê Analytics thu gọn

### 4.3 Admin CMS (`/api/admin`)
- `GET /api/admin/owners/pending` 🛡️: Lấy danh sách Owner chờ duyệt
- `PUT /api/admin/owners/{id}/approve` 🛡️: Duyệt Owner
- `PUT /api/admin/owners/{id}/reject` 🛡️: Từ chối Owner
- `GET /api/admin/pois/pending` 🛡️: Lấy danh sách POI chờ duyệt
- `PUT /api/admin/pois/{id}/status` 🛡️: Phê duyệt / Từ chối POI

### 4.4 Public POIs (`/api/pois`)
- `GET /api/pois` 🔓: Lấy danh sách POI (Tự động lọc `ApprovalStatus == "approved"`)
- `GET /api/pois/search?q=` 🔓: Tìm kiếm POI
- `GET /api/pois/nearby?lat=&lng=&r=` 🔓: Lấy POI theo GPS (Công thức Haversine)
- `GET /api/pois/slug/{slug}` 🔓: Lấy chi tiết POI

### 4.5 Translation & TTS Auto-Gen
- `POST /api/translations` 🛡️/🏠: Thêm / Cập nhật bản dịch.
  *Đặc biệt: Nếu truyền `AudioText`, `TTSService` sẽ tự động gọi CLI `edge-tts` ngầm để sinh ra file MP3 lưu vào `wwwroot/audio/` và cập nhật Db.*

---

## 5. Tính Năng Kỹ Thuật Nổi Bật

### 5.1 Auto TTS Generation (edge-tts)
Tích hợp `ProcessStartInfo` gọi trực tiếp `edge-tts` bằng Python CLI. Hỗ trợ đa ngôn ngữ với các giọng neural của Azure:
- Tiếng Việt: `vi-VN-HoaiMyNeural`
- Tiếng Anh: `en-US-AriaNeural`
- Tiếng Nhật: `ja-JP-NanamiNeural`
- Tiếng Hàn: `ko-KR-SunHiNeural`
- Tiếng Trung: `zh-CN-XiaoxiaoNeural`

### 5.2 Approval Workflow
Luồng duyệt 2 cấp độ:
1. **Duyệt Owner**: Owner đăng ký sẽ ở trạng thái `pending`. Không có quyền đăng POI cho tới khi Admin gọi API `/approve`.
2. **Duyệt POI**: POI do Owner tạo sẽ ở trạng thái `pending`. Người dùng (App) không thể thấy POI này cho đến khi Admin duyệt. Admin tạo POI thì mặc định `approved`.

### 5.3 Anonymous Analytics Tracking
Sử dụng SessionId để ẩn danh người dùng khi tham quan thay vì UserId. Các triggers:
- Geofence Trigger (Đi ngang qua)
- QR Code Scan
- Search Manual

### 5.4 Seed Data Tự Động
- 15 địa điểm thực tế của Phố Ẩm Thực Vĩnh Khánh (Quận 4).
- Tài khoản Admin mặc định: `admin` / `Admin@123`.

---

## 6. Cấu Trúc Dự Án Hiện Tại

```
backend/
├── DoAn-CSharp/
│   ├── Controllers/
│   │   ├── AuthController.cs, AdminController.cs, OwnerController.cs
│   │   ├── POIController.cs, TranslationController.cs...
│   ├── Services/
│   │   ├── ITTSService / TTSService (MỚI)
│   │   ├── POIService (Cập nhật Approval Status filter)
│   │   └── AnalyticsService...
│   ├── Models/
│   ├── Extensions/, Middleware/
│   ├── wwwroot/
│   │   ├── audio/ (Chứa file MP3 được sinh ra)
│   │   └── images/
│   └── appsettings.json
```
