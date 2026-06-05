# 🧭 VinhKhanh Explorer — Smart Walking Tour PWA

[![.NET Version](https://img.shields.io/badge/.NET-9.0-blueviolet.svg?style=flat-square)](https://dotnet.microsoft.com/download/dotnet/9.0)
[![React Version](https://img.shields.io/badge/React-19-blue.svg?style=flat-square)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-8.x-yellow.svg?style=flat-square)](https://vite.dev/)
[![Tailwind Version](https://img.shields.io/badge/Tailwind-v4.0-38bdf8.svg?style=flat-square)](https://tailwindcss.com/)
[![TypeScript Version](https://img.shields.io/badge/TypeScript-6.x-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**VinhKhanh Explorer** là một **Progressive Web App (PWA)** thông minh hỗ trợ khách du lịch nước ngoài tự mình khám phá khu phố ẩm thực nổi tiếng **Vĩnh Khánh (Quận 4, TP.HCM)**. Ứng dụng cung cấp trải nghiệm **Smart Walking Tour** tương tác cao với các tính năng tự động phát âm thanh thuyết minh theo định vị địa lý (Geofencing), dịch thực đơn món ăn, bản đồ chỉ đường thời gian thực và tích hợp các trò chơi đố vui (quizzes) nhận điểm thưởng (XP) để tăng tính gắn kết.

---

## 👥 Thành Viên Nhóm Thực Hiện (Development Team)

Đồ án được nghiên cứu và phát triển bởi các thành viên:

| Hình đại diện | Thành viên | Vai trò | Nhiệm vụ chính |
| :---: | :--- | :--- | :--- |
| **NN** | **Nguyễn Trọng Nguyễn** | **Lead Architect / Backend** | Thiết kế kiến trúc API, tổ chức Database (EF Core), xây dựng các Service xử lý nghiệp vụ, quản lý di trú cơ sở dữ liệu (Migrations) và thiết lập kiểm thử tự động (xUnit). |
| **NH** | **Nguyễn Ngọc Hải** | **Full-stack / UI Designer** | Thiết kế giao diện PWA (Mobile-first, Glassmorphism), tích hợp Bản đồ tương tác, lập trình Geofence Engine & Narration Engine phía client. |

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. Bản Đồ Tương Tác Thông Minh (Interactive Map)
- Tích hợp **Google Maps API** (thông qua `@vis.gl/react-google-maps`) hỗ trợ chế độ tối/sáng tùy chỉnh (Dark/Light mode).
- Hiển thị danh sách 15+ Điểm quan tâm (POI - Points of Interest) dọc theo tuyến đường Vĩnh Khánh với marker được phân loại theo màu sắc nghiệp vụ (Nhà hàng, Quán cafe, Chùa chiền, Chợ, Tranh tường, v.v.).
- Chế độ giả lập vị trí GPS tích hợp (GPS Simulator) giúp kiểm thử di chuyển thực tế ngay trên trình duyệt mà không cần ra hiện trường.

### 2. Trình Thuyết Minh Tự Động (Auto-Narration Engine)
- **Geofence Engine**: Định vị thông minh dựa trên công thức Haversine để tính khoảng cách chính xác từ người dùng đến POI. Tự động kích hoạt khi người dùng đi vào bán kính kích hoạt (Radius) của POI đó.
- Thuật toán giảm nhiễu (Debounce) và kiểm soát giãn cách (Cooldown 30 phút) giúp ngăn ngừa việc phát trùng lặp âm thanh khi tín hiệu GPS không ổn định.
- Phát nhạc/giọng đọc thuyết minh tự động. Ưu tiên tệp âm thanh thu âm chất lượng cao sẵn có (`.mp3` trong `wwwroot`), hoặc tự động chuyển sang công nghệ chuyển văn bản thành giọng nói **Web Speech API (Browser-native TTS)** đa ngôn ngữ (Tiếng Anh, Nhật, Hàn, Trung) hoàn toàn miễn phí và chạy offline.

### 3. Khám Phá Qua Mã QR (QR Code Quick Trigger)
- Cho phép khách du lịch quét mã QR dán trực tiếp tại các điểm du lịch để kích hoạt ngay bài thuyết minh và xem thực đơn dịch thuật mà không cần cấp quyền định vị GPS hoặc khi GPS bị suy giảm tín hiệu.
- API tự động phát sinh mã QR chuẩn hóa định dạng mã hóa cao.

### 4. Dịch Thuật Thực Đơn & Biển Hiệu (Menu Translation)
- Phân hệ hỗ trợ dịch thuật thông minh giúp dịch toàn bộ danh mục thực đơn của các quán ăn ẩm thực đường phố sang ngôn ngữ của du khách.
- Cấu trúc dữ liệu dịch đa ngôn ngữ tách biệt giúp hệ thống dễ dàng mở rộng thêm các ngôn ngữ mới mà không ảnh hưởng đến logic nghiệp vụ cốt lõi.

### 5. Hành Trình Định Sẵn & Trò Chơi Hóa (Tours & Gamification)
- **Curated Walking Tours**: Tuyến hành trình khám phá được thiết kế sẵn (ví dụ: *"Food Tour Vĩnh Khánh đêm"*, *"Hành trình văn hóa tâm linh Quận 4"*).
- Bảng tiến trình du lịch trực quan (Progress Tracker) hiển thị các chặng đã qua, chỉ dẫn hướng đi và các gợi ý (transition notes) cho chặng kế tiếp.
- Cơ chế kiểm tra (Check-in), mở khóa Huy hiệu (Badges), làm đố vui ngắn (Quizzes) liên quan đến địa điểm để tích lũy điểm kinh nghiệm (XP) nhằm tăng tính tương tác và giải trí cho du khách.

### 6. Trang Quản Trị Hệ Thống (CMS / Admin Dashboard)
- Giao diện Admin quản trị nội dung trực quan hỗ trợ thêm, xóa, sửa các POI, cập nhật nội dung dịch thuật, upload tệp tin âm thanh, cấu hình hành trình Tour.
- Bảng phân tích số liệu thống kê lượt truy cập (Analytics Dashboard) dạng biểu đồ trực quan (Recharts) giúp theo dõi lượng khách tham quan, các POI được yêu thích nhất và tỷ lệ sử dụng ngôn ngữ.

---

## 🏗️ Kiến Trúc Hệ Thống (System Architecture)

Dự án áp dụng kiến trúc tách biệt hoàn toàn giữa Client (Frontend) và Server (Backend API):

```text
               ┌────────────────────────┐
               │    React PWA Client    │
               │ (Vite + Tailwind v4)   │
               └───────────┬────────────┘
                           │ (HTTPS REST API Requests + JWT Auth)
                           ▼
               ┌────────────────────────┐
               │  ASP.NET Core Web API  │
               │      (.NET 9.0)        │
               └───────────┬────────────┘
                           │ (Entity Framework Core)
                           ▼
               ┌────────────────────────┐
               │  MS SQL Server LocalDB │
               │   (Database Storage)   │
               └────────────────────────┘
```

- **Backend**: Xây dựng theo mô hình **RESTful Web API** trên **ASP.NET Core 9.0**, tuân thủ nguyên tắc Clean Architecture và mẫu thiết kế **Service-Repository**. Hỗ trợ xác thực bảo mật thông qua **JWT Bearer Authentication**.
- **Frontend**: Ứng dụng đơn trang (SPA) tối ưu hóa thành **Progressive Web App (PWA)** có thể cài đặt trực tiếp lên điện thoại, quản lý trạng thái bằng **Zustand**, truy xuất và lưu đệm dữ liệu thông qua **TanStack Query (React Query)**.

---

## 📁 Cấu Trúc Mã Nguồn (Folder Structure)

Dự án được tổ chức gọn gàng thành hai phân hệ độc lập: `backend` và `frontend`.

### 1. Backend Web API (`backend/`)
```text
backend/
├── DoAn-CSharp.sln         # Giải pháp (.sln) quản lý các dự án .NET
├── DoAn-CSharp/            # Thư mục dự án Web API chính
│   ├── Controllers/        # API Controllers tiếp nhận và phản hồi HTTP requests
│   │   ├── POIController.cs    # Điểm quan tâm, truy vấn tọa độ và khoảng cách Proximity
│   │   ├── TourController.cs   # Quản lý Tour du lịch định sẵn và chặng dừng
│   │   ├── QRController.cs     # Quản lý và sinh mã QR tự động
│   │   ├── AnalyticsController.cs # Tiếp nhận log check-in và trả dữ liệu thống kê
│   │   └── AuthController.cs   # Xác thực tài khoản quản trị viên cấp phát JWT
│   ├── Services/           # Lớp xử lý Logic nghiệp vụ cốt lõi (Business Services)
│   │   ├── POIService.cs       # Tính toán Haversine bằng LINQ dịch trực tiếp sang SQL
│   │   ├── TourService.cs      # Xử lý logic hoàn thành chặng và phân chia XP
│   │   └── ...                 
│   ├── Data/               # Kết nối Cơ sở dữ liệu và Dữ liệu mẫu (EF Core)
│   │   ├── AppDbContext.cs # Cấu hình Fluent API, chỉ mục Spatial, quan hệ Cascade
│   │   └── SeedData.cs     # Khởi tạo 15 POIs Vĩnh Khánh thực tế, dịch song ngữ, Tours mẫu
│   ├── Models/             # Định nghĩa các thực thể dữ liệu & DTOs
│   │   ├── Entities/       # POI, POITranslation, Tour, TourStop, VisitLog, AdminUser
│   │   └── DTOs/           # Data Transfer Objects chuẩn hóa đầu ra/đầu vào API
│   ├── Middleware/         # Bộ lọc Custom Middleware (Exception handling toàn cục)
│   ├── Extensions/         # Đăng ký Dependencies Injection gọn gàng trong Program.cs
│   ├── Program.cs          # Điểm khởi đầu ứng dụng, cấu hình CORS, JWT, Routing Pipeline
│   └── appsettings.json    # Chứa Connection String LocalDB và Khóa bí mật JWT
└── DoAn-CSharp.Tests/      # Thư mục chứa 44+ kịch bản kiểm thử tự động xUnit
```

### 2. Frontend React PWA (`frontend/`)
```text
frontend/
├── src/
│   ├── components/         # Các thành phần giao diện dùng chung
│   │   ├── map/            # Bản đồ tương tác (MapView, POIMarker, UserLocation)
│   │   ├── narration/      # Bảng điều khiển thuyết minh âm thanh (NarrationPlayer)
│   │   ├── poi/            # Bảng chi tiết địa điểm, Thực đơn và chặng (POISheet, MenuViewer)
│   │   ├── qr/             # Trình quét mã QR camera thời gian thực (QRScanner)
│   │   ├── admin/          # Giao diện quản trị, biểu đồ thống kê Analytics
│   │   └── layout/         # Shell ứng dụng Mobile (BottomNav) và Sidebar Admin
│   ├── pages/              # Các trang định tuyến (ExplorePage, DiscoverPage, ScanPage...)
│   ├── stores/             # Quản lý trạng thái Client (Zustand: settings, location, narration, auth)
│   ├── hooks/              # Custom React Hooks (useGeofence, useNarration, useGeolocation...)
│   ├── services/           # Trình khách gọi API (api.ts đóng gói fetch client kèm tự động đính kèm JWT)
│   ├── lib/                # Logic thuần túy (geofence.ts tính Haversine, audioQueue.ts quản lý hàng đợi)
│   ├── types/              # Định nghĩa kiểu dữ liệu TypeScript (poi.ts, audio.ts...)
│   ├── index.css           # Cấu hình Theme Glassmorphic và biến Token Tailwind CSS v4
│   ├── App.tsx             # Định tuyến Client-side Router
│   └── main.tsx            # Khởi tạo React App & QueryClientProvider
├── public/                 # Chứa tài nguyên tĩnh (Audio mẫu, Icons PWA)
├── package.json            # Khai báo thư viện (React 19, Zustand, Lucide...)
└── vite.config.ts          # Cấu hình đóng gói Vite & Vite-plugin-pwa sinh Service Worker
```

---

## 🚀 Hướng Dẫn Cài Đặt và Khởi Chạy (Quick Start)

### 1. Cài đặt Phía Backend (Web API)

> [!NOTE]
> Đảm bảo máy tính của bạn đã cài đặt **.NET 9.0 SDK** và **SQL Server LocalDB** (thường đi kèm khi cài Visual Studio).

1. Di chuyển vào thư mục backend của dự án:
   ```bash
   cd backend/DoAn-CSharp
   ```
2. Tạo cơ sở dữ liệu và thực thi Migrations để tự động nạp 15 địa điểm Vĩnh Khánh cùng dữ liệu mẫu:
   ```bash
   dotnet ef database update
   ```
3. Biên dịch dự án:
   ```bash
   dotnet build
   ```
4. Khởi chạy máy chủ API:
   ```bash
   dotnet run
   ```
   API sẽ khởi chạy tại địa chỉ: `https://localhost:5001` hoặc `http://localhost:5000`. Bạn có thể truy cập `https://localhost:5001/swagger` để xem tài liệu Swagger trực quan.
5. Để chạy bộ kiểm thử tự động xUnit (44 tests pass) từ thư mục backend:
   ```bash
   dotnet test
   ```

### 2. Cài đặt Phía Frontend (React PWA)

> [!NOTE]
> Đảm bảo máy tính của bạn đã cài đặt **Node.js** (Khuyến nghị phiên bản LTS v20+).

1. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo tệp `.env` tại thư mục `frontend/` và cấu hình địa chỉ API cùng khóa Google Maps:
   ```env
   VITE_API_BASE_URL=https://localhost:5001/api
   VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
   ```
4. Khởi chạy ứng dụng ở chế độ phát triển (Development):
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`. Mở bằng thiết bị di động hoặc bật F12 trên Chrome chọn chế độ giả lập Mobile để có trải nghiệm tốt nhất.

---

## 📈 Tiến Độ Dự Án (Project Roadmap & Status)

Hệ thống hiện đã hoàn thành các giai đoạn nền tảng và các tính năng cốt lõi:

- [x] **Phase 1: Foundation**
  - Chuyển đổi thành công kiến trúc ASP.NET Core sang Web API thuần.
  - Cấu hình Entity Framework Core và liên kết 9 bảng dữ liệu.
  - Tạo dữ liệu mẫu hạt giống (Seed Data) chuẩn hóa định vị Vĩnh Khánh, thực đơn, chặng tour.
  - Thiết lập khung dự án React PWA, cấu hình Tailwind v4 và các Zustand Stores.
- [x] **Phase 2: Core APIs**
  - Viết xong API CRUD cho POI, hỗ trợ truy vấn khoảng cách Proximity địa lý.
  - Hoàn thành API Quét QR Code và phát sinh ảnh QR code tự động.
  - Hoàn thành API log lượt truy cập của du khách và tổng hợp dữ liệu Analytics.
- [x] **Phase 3: Core Client Logic**
  - Tích hợp thành công Geofence Engine tự động tính toán Haversine và chống nhiễu tọa độ GPS.
  - Xây dựng thành công Narration Engine tích hợp liền mạch Web Speech API hỗ trợ đa ngôn ngữ.
  - Tích hợp Bản đồ tương tác Leaflet và Google Maps hiển thị trực quan các markers.
- [x] **Phase 4 & 5: Tours & Gamification**
  - Phát triển hệ thống hành trình walking tour định sẵn, chỉ đường thông minh giữa các chặng.
  - Tích hợp gamification: Check-in tự động nhận XP, trả lời đố vui địa phương, mở khóa huy hiệu thành tựu.
  - Cập nhật giao diện Trình tiến hành Tour nổi bật (Active Tour Panel) giúp chỉ dẫn trực quan cho du khách.
- [ ] **Phase 6 & 7: Production Optimization & Deployment**
  - Tối ưu hóa Service Worker của PWA để lưu đệm offline hoàn hảo cho tài nguyên tĩnh và âm thanh thuyết minh.
  - Triển khai máy chủ lên đám mây và đưa vào thử nghiệm thực tế.
