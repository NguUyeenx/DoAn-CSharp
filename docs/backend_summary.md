# Tài Liệu Backend — VinhKhanh Explorer API

> **Framework:** ASP.NET Core 10.0 Web API | **Database:** SQL Server (EF Core 9) | **Auth:** JWT Bearer

---

## 1. Kiến Trúc Hệ Thống

```
Client (React PWA)
      │  HTTPS REST API + JWT
      ▼
ASP.NET Core Web API (.NET 10)
      │  Entity Framework Core
      ▼
SQL Server (LocalDB / Full)
```

**Các lớp chính:**
- `Controllers/` — Tiếp nhận HTTP Request, trả JSON
- `Services/` — Xử lý Logic nghiệp vụ
- `Models/Entities/` — Định nghĩa các bảng dữ liệu
- `Models/DTOs/` — Data Transfer Objects (Input/Output API)
- `Data/` — DbContext, SeedData
- `Middleware/` — Global Exception Handler
- `Extensions/` — ServiceExtensions (DI Registration)
- `Validators/` — FluentValidation

---

## 2. Database Schema (20 Bảng)

| Bảng | Mô tả |
|------|-------|
| `Users` | Tài khoản người dùng đăng ký |
| `AdminUsers` | Tài khoản quản trị viên CMS |
| `Languages` | Danh sách ngôn ngữ hỗ trợ (vi, en, ja, ko, zh) |
| `POICategories` | Danh mục địa điểm (restaurant, cafe, temple...) |
| `POIs` | Điểm quan tâm (địa điểm ẩm thực, văn hóa) |
| `POITranslations` | Nội dung đa ngôn ngữ của từng POI |
| `AudioFiles` | Tệp âm thanh thuyết minh theo ngôn ngữ |
| `MenuItems` | Món ăn trong thực đơn của từng POI |
| `MenuItemTranslations` | Tên/mô tả món ăn đa ngôn ngữ |
| `Tours` | Hành trình tham quan định sẵn |
| `TourStops` | Các điểm dừng trong từng Tour |
| `QRCodes` | Mã QR của từng địa điểm |
| `QuizQuestions` | Câu hỏi đố vui theo địa điểm |
| `QuizQuestionTranslations` | Câu hỏi đa ngôn ngữ |
| `Favorites` | Địa điểm yêu thích của User |
| `AudioProgress` | Tiến độ nghe audio của User |
| `VisitLogs` | Lịch sử lượt truy cập địa điểm |

---

## 3. Entities (Models)

### 3.1 POI (Điểm Quan Tâm)
```
Id, Name, Slug, Latitude, Longitude, TriggerRadiusMeters,
Category, CategoryId (FK), Priority,
Address, Ward, District, City,
Phone, Website, FacebookUrl,
ImageUrl, GoogleMapsUrl,
IsActive, DeletedAt (Soft Delete),
CreatedAt, UpdatedAt
```

### 3.2 User
```
Id, Username, Email, PasswordHash, DisplayName,
AvatarUrl, DefaultLanguage,
RefreshToken, RefreshTokenExpiry,
CreatedAt, UpdatedAt
```

### 3.3 AdminUser
```
Id, Username, PasswordHash, Role, CreatedAt
```

### 3.4 Language
```
Code (PK), Name, NativeName, IsActive, SortOrder
```

### 3.5 POICategory
```
Id, Slug, Name, IconUrl, Color, SortOrder, IsActive
```

### 3.6 AudioFile
```
Id, POIId, LanguageCode, FilePath, DurationSeconds,
AudioType (pre-recorded|tts),
TTSProvider (azure|google), VoiceName, GeneratedAt,
IsDefault
```

### 3.7 QRCode
```
Id, POIId, Code, QRImageUrl,
ScanCount, IsActive, CreatedAt
```

### 3.8 VisitLog
```
Id, POIId, UserId (nullable), SessionId (nullable),
TriggerType (geofence|qr|manual|search),
LanguageCode, VisitedAt
```

### 3.9 Favorite
```
Id, UserId, POIId, CreatedAt
```

### 3.10 AudioProgress
```
Id, UserId, AudioFileId, CurrentSecond, UpdatedAt
```

---

## 4. API Endpoints

> 🔓 = Public (không cần JWT)  
> 🔑 = User JWT  
> 🛡️ = Admin JWT

---

### 4.1 Authentication (`/api/auth`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| POST | `/api/auth/register` | 🔓 | Đăng ký tài khoản User |
| POST | `/api/auth/login` | 🔓 | Đăng nhập User (username/email) |
| POST | `/api/auth/refresh` | 🔓 | Làm mới Access Token |
| PUT | `/api/auth/change-password` | 🔑 | Đổi mật khẩu |
| PUT | `/api/auth/profile` | 🔑 | Cập nhật hồ sơ cá nhân |
| POST | `/api/auth/admin/login` | 🔓 | Đăng nhập Admin CMS |

---

### 4.2 POI — Địa Điểm (`/api/pois`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/api/pois` | 🔓 | Danh sách POI (lọc `?category=&q=`) |
| GET | `/api/pois/search?q=` | 🔓 | Tìm kiếm POI theo tên |
| GET | `/api/pois/nearby?lat=&lng=&r=` | 🔓 | POI gần vị trí (Haversine, mặc định 500m) |
| GET | `/api/pois/{id}?lang=` | 🔓 | Chi tiết POI theo ID |
| GET | `/api/pois/slug/{slug}?lang=` | 🔓 | Chi tiết POI theo Slug |
| POST | `/api/pois` | 🛡️ | Tạo POI mới |
| PUT | `/api/pois/{id}` | 🛡️ | Cập nhật POI |
| DELETE | `/api/pois/{id}` | 🛡️ | Xóa mềm POI (Soft Delete) |
| POST | `/api/pois/{id}/restore` | 🛡️ | Khôi phục POI đã xóa mềm |

**Query params:** `lang` hỗ trợ `vi`, `en`, `ja`, `ko`, `zh` — fallback về `en` nếu không tìm thấy bản dịch.

---

### 4.3 POI Translations (`/api/translations`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/api/translations/{poiId}` | 🔓 | Tất cả bản dịch của POI |
| GET | `/api/translations/{poiId}/{lang}` | 🔓 | Bản dịch theo ngôn ngữ |
| POST | `/api/translations` | 🛡️ | Thêm bản dịch mới |
| PUT | `/api/translations/{id}` | 🛡️ | Cập nhật bản dịch |
| DELETE | `/api/translations/{id}` | 🛡️ | Xóa bản dịch |

---

### 4.4 Menu Món Ăn (`/api/menu`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/api/menu/poi/{poiId}?lang=` | 🔓 | Thực đơn của POI |
| POST | `/api/menu` | 🛡️ | Thêm món ăn |
| PUT | `/api/menu/{id}` | 🛡️ | Cập nhật món ăn |
| DELETE | `/api/menu/{id}` | 🛡️ | Xóa món ăn |

---

### 4.5 QR Code (`/api/qr`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| POST | `/api/qr/scan/{code}` | 🔓 | Quét QR → POI info + tăng ScanCount + log visit |
| GET | `/api/qr/{code}` | 🔓 | Tra cứu QR code |
| POST | `/api/qr/generate/{poiId}` | 🛡️ | Tạo mã QR tự động cho POI |
| GET | `/api/qr/poi/{poiId}` | 🛡️ | Danh sách QR codes của POI |

---

### 4.6 Tour Tham Quan (`/api/tours`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/api/tours` | 🔓 | Danh sách tất cả Tour |
| GET | `/api/tours/{id}` | 🔓 | Chi tiết Tour và các chặng dừng |
| POST | `/api/tours` | 🛡️ | Tạo Tour mới |
| PUT | `/api/tours/{id}` | 🛡️ | Cập nhật Tour |
| DELETE | `/api/tours/{id}` | 🛡️ | Xóa Tour |
| POST | `/api/tours/{id}/stops` | 🛡️ | Thêm điểm dừng vào Tour |

---

### 4.7 Quiz Đố Vui (`/api/quiz`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/api/quiz/poi/{poiId}?lang=` | 🔓 | Câu hỏi đố vui của POI |
| POST | `/api/quiz/submit` | 🔓 | Nộp câu trả lời + nhận kết quả |
| POST | `/api/quiz` | 🛡️ | Tạo câu hỏi mới |
| PUT | `/api/quiz/{id}` | 🛡️ | Cập nhật câu hỏi |
| DELETE | `/api/quiz/{id}` | 🛡️ | Xóa câu hỏi |

---

### 4.8 Favorites — Yêu Thích (`/api/favorites`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/api/favorites` | 🔑 | Danh sách POI yêu thích của User |
| POST | `/api/favorites/{poiId}` | 🔑 | Thêm POI vào yêu thích |
| DELETE | `/api/favorites/{poiId}` | 🔑 | Xóa POI khỏi yêu thích |

---

### 4.9 Audio Progress — Tiếp Tục Nghe (`/api/audio-progress`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/api/audio-progress/{audioFileId}` | 🔑 | Lấy tiến độ nghe |
| PUT | `/api/audio-progress` | 🔑 | Lưu tiến độ nghe hiện tại |

---

### 4.10 Upload File (`/api/upload`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| POST | `/api/upload/image/poi` | 🛡️ | Upload ảnh địa điểm (max 5MB) |
| POST | `/api/upload/image/menu` | 🛡️ | Upload ảnh món ăn (max 5MB) |
| POST | `/api/upload/audio` | 🛡️ | Upload audio thuyết minh (max 50MB) |
| DELETE | `/api/upload?filePath=` | 🛡️ | Xóa file đã upload |

**Định dạng ảnh:** jpeg, png, webp, gif  
**Định dạng audio:** mp3, wav, ogg, aac  
**Lưu trữ:** `wwwroot/images/`, `wwwroot/audio/`

---

### 4.11 Analytics — Thống Kê (`/api/analytics`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| POST | `/api/analytics/visit` | 🔓 | Ghi nhận lượt truy cập |
| GET | `/api/analytics/dashboard` | 🛡️ | Dashboard tổng quan |
| GET | `/api/analytics/summary` | 🛡️ | Tổng hợp thống kê |

**Dashboard trả về:**
- `TotalVisits` — Tổng lượt truy cập
- `TotalQrScans` — Tổng lượt quét QR
- `TotalAudioPlays` — Tổng lượt nghe thuyết minh
- `VisitsOverTime` — Biểu đồ lượt truy cập 30 ngày gần nhất
- `PopularPOIs` — Top 10 địa điểm phổ biến nhất
- `LanguageBreakdown` — Thống kê theo ngôn ngữ sử dụng

---

### 4.12 Health Check (`/api/health`)

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/api/health` | 🔓 | Kiểm tra trạng thái máy chủ |

---

## 5. Tính Năng Kỹ Thuật Nổi Bật

### 5.1 JWT Authentication (Dual Role)
- **Role `user`**: Đăng ký/đăng nhập qua `/api/auth/register` và `/api/auth/login`
- **Role `admin`**: Đăng nhập qua `/api/auth/admin/login`
- **Refresh Token**: Tự động gia hạn session 30 ngày
- **Token hết hạn:** Access Token 60 phút

### 5.2 Soft Delete
- POI hỗ trợ xóa mềm qua trường `DeletedAt`
- Admin có thể khôi phục POI đã xóa qua `POST /api/pois/{id}/restore`
- Tất cả truy vấn tự động lọc `DeletedAt == null`

### 5.3 Geofence — Haversine Distance
- `GET /api/pois/nearby?lat=&lng=&r=` tính khoảng cách chính xác bằng công thức Haversine
- Mặc định bán kính 500m, trả về danh sách sort theo khoảng cách tăng dần
- Kết quả có field `DistanceMeters` để hiển thị trên bản đồ

### 5.4 QR Scan Tracking
- Mỗi lần quét QR: tự động tăng `ScanCount`, ghi `VisitLog` với `TriggerType = "qr"`
- Thống kê tổng lượt quét QR trong Analytics Dashboard

### 5.5 Đa Ngôn Ngữ
- 5 ngôn ngữ: 🇻🇳 vi | 🇬🇧 en | 🇯🇵 ja | 🇰🇷 ko | 🇨🇳 zh
- Fallback tự động: nếu không có bản dịch theo ngôn ngữ yêu cầu → fallback về `en`
- POI, MenuItem, QuizQuestion đều hỗ trợ translation table riêng

### 5.6 Seed Data Tự Động
Khi khởi động lần đầu, hệ thống tự động nạp:
- **5 ngôn ngữ** (vi, en, ja, ko, zh)
- **8 danh mục POI** (restaurant, cafe, street_food, temple, market, park, landmark, street_art)
- **15 địa điểm** phố Vĩnh Khánh thực tế với tọa độ GPS chính xác
- **Bản dịch** tiếng Anh cho tất cả địa điểm
- **Thực đơn** các món ăn đặc trưng
- **1 Tour** mẫu "Vĩnh Khánh Culinary Expedition"
- **2 câu hỏi Quiz** mẫu
- **Tài khoản Admin** mặc định: `admin` / `Admin@123`

### 5.7 Global Exception Middleware
- Bắt tất cả exception không xử lý
- Trả về JSON chuẩn: `{ error, message, statusCode }`
- Không lộ stack trace ra môi trường Production

### 5.8 Validation
- FluentValidation cho tất cả input DTO
- Tự động trả lỗi 400 với chi tiết field lỗi

---

## 6. Cấu Trúc Dự Án

```
backend/
├── DoAn-CSharp.sln
├── DoAn-CSharp/                    # Web API chính
│   ├── Controllers/
│   │   ├── AuthController.cs       # User + Admin auth
│   │   ├── POIController.cs        # CRUD + Search + Nearby
│   │   ├── TranslationController.cs
│   │   ├── MenuController.cs
│   │   ├── QRController.cs         # Scan + Generate
│   │   ├── TourController.cs
│   │   ├── QuizController.cs
│   │   ├── FavoritesController.cs  # User favorites
│   │   ├── AudioProgressController.cs
│   │   ├── UploadController.cs     # File upload
│   │   ├── AnalyticsController.cs  # Dashboard
│   │   └── HealthController.cs
│   ├── Services/
│   │   ├── IAuthService / AuthService
│   │   ├── IPOIService / POIService
│   │   ├── ITranslationService / TranslationService
│   │   ├── IMenuService / MenuService
│   │   ├── IQRCodeService / QRCodeService
│   │   ├── ITourService / TourService
│   │   ├── IQuizService / QuizService
│   │   ├── IFavoriteService / FavoriteService
│   │   ├── IAudioProgressService / AudioProgressService
│   │   ├── IUploadService / UploadService
│   │   └── IAnalyticsService / AnalyticsService
│   ├── Models/
│   │   ├── Entities/               # 17 entity classes
│   │   └── DTOs/                   # 23 DTO classes
│   ├── Data/
│   │   ├── AppDbContext.cs         # EF Core DbContext
│   │   └── SeedData.cs             # Auto seed khi khởi động
│   ├── Migrations/                 # EF Core migrations
│   ├── Middleware/
│   │   └── ExceptionMiddleware.cs
│   ├── Extensions/
│   │   └── ServiceExtensions.cs    # DI + JWT config
│   ├── Validators/
│   ├── wwwroot/                    # Static files (images, audio)
│   ├── Program.cs                  # App config + Swagger JWT
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   └── database.sql               # Schema SQL đầy đủ để import
└── DoAn-CSharp.Tests/              # xUnit test project (44+ tests)
```

---

## 7. Cài Đặt và Chạy

### Bước 1: Cấu hình Connection String
Mở `appsettings.Development.json`, sửa:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=TÊN_SERVER_CỦA_BẠN;Database=VinhKhanhExplorer;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

### Bước 2: Khởi động (tự động tạo DB + Seed Data)
```bash
cd backend/DoAn-CSharp
dotnet run
```

### Bước 3: Xem Swagger API
Truy cập `https://localhost:5001/swagger` để thấy toàn bộ API và test trực tiếp.

### Chạy Tests
```bash
dotnet test
```

---

## 8. Bảo Mật

| Tính năng | Chi tiết |
|-----------|----------|
| JWT Bearer | HS256, Issuer validated |
| BCrypt | Hash mật khẩu (không lưu plain text) |
| Role-based Auth | `admin` / `user` tách biệt hoàn toàn |
| Refresh Token | 64-byte random, hết hạn 30 ngày |
| File Upload | Kiểm tra MIME type + giới hạn dung lượng |
| CORS | Chỉ cho phép origin Frontend (`localhost:5173`) |
| Soft Delete | Dữ liệu không bị xóa cứng khỏi DB |

---

## 9. Nhật Ký Cập Nhật (Gần Nhất)

Trong quá trình Unit Test và E2E Test qua Postman, hệ thống Backend đã được tinh chỉnh và fix các lỗi thực tế (Business Logic & Routing):

### 9.1 Chuẩn Hóa Routing & Authentication
- Đã chuẩn hóa toàn bộ các API CMS dành cho Admin ở các Controller: `MenuController`, `TranslationController`, `TourController`.
- Xóa bỏ các tiền tố URL rườm rà như `/api/admin/translations` và thống nhất sử dụng `[Authorize(Roles = "admin")]` ngay trên phương thức, giữ nguyên RESTful URL chuẩn (VD: `POST /api/translations`).

### 9.2 Global Exception Handling
- `ExceptionMiddleware.cs` được nâng cấp để bắt chi tiết các lỗi logic:
  - `UnauthorizedAccessException` → Trả về **401 Unauthorized**.
  - `ArgumentException`, `KeyNotFoundException` → Trả về **400 Bad Request**.
  - Lỗi DbUpdateException do trùng khóa ngoại/duy nhất được bắt và xử lý gọn gàng.

### 9.3 Xử Lý Business Logic
- **Đổi mật khẩu:** Đổi tên biến `OldPassword` thành `CurrentPassword` trong `AuthDto` để logic thân thiện và hợp lý hơn, đồng thời update luồng xử lý trong `AuthService`.
- **QR Code Generator:** Fix lỗi 500 khi Admin sinh mã QR mới do trùng lặp (Duplicate Key) với dữ liệu mẫu. Hệ thống giờ đây tự động nối thêm một mã hash ngẫu nhiên (VD: `VKE-POI-001-A7B8C9`) để đảm bảo tính duy nhất tuyệt đối.
- **Audio Progress Tracker:** Fix lỗi 500 (Foreign Key Constraint) khi người dùng lưu tiến độ nghe lần đầu. Đồng bộ hóa bằng cách chèn tự động dữ liệu mẫu `AudioFile` vào trong `SeedData`.

### 9.4 Tối Ưu Hóa Trải Nghiệm Dev
- Tắt bớt log rác của `Microsoft.EntityFrameworkCore.Database.Command` trong `appsettings.Development.json` giúp Terminal sạch sẽ, dễ dàng debug.
- Export file `database.sql` hoàn chỉnh, chứa toàn bộ Table Schema + Index + Constraints dành cho các thành viên muốn setup CSDL SQL Server bằng tay thay vì dùng EF Core Migrations.
- Cập nhật chuẩn xác các file test `*.request.yaml` cho Postman (Audio Progress GET/PUT, Analytics Visit) để mapping đúng 100% với DTO của hệ thống.
