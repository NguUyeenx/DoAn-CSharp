# Frontend Implementation - VinhKhanh Explorer (PWA & CMS)

Dự án Frontend đã được cấu hình với kiến trúc **Feature-Sliced Design (FSD)** và React 19, Vite, Tailwind CSS v4, Shadcn UI.

## Các cột mốc đã hoàn thành

### 1. Kiến trúc & Cấu hình nền tảng
- Cấu hình biến môi trường (`.env` với `VITE_API_URL`).
- Thiết lập `axios` interceptor tự động đính kèm Token.
- Tích hợp **React Query** (`useQuery`, `QueryClient`) vào `main.tsx`.
- Thiết lập bảng màu, typography (Font Be Vietnam Pro) trong `index.css`.

### 2. Giai đoạn 1: Public PWA (Hoàn tất API)
- **Home**: Banner hero, Category, Danh sách POI nổi bật (Gọi từ `usePois`).
- **Map**: Tích hợp `react-leaflet`, tự động lấy vị trí GPS (Geolocation API), hiển thị các Custom Marker cho địa điểm xung quanh.
- **Search**: Tìm kiếm địa điểm, lọc theo category thông qua `useSearchPOIs`.
- **POI Detail**: Giao diện chi tiết quán với hệ thống Tabs (Giới thiệu chung, Menu, Audio Guide).
- **Tours**: Hiển thị danh sách các Tour trải nghiệm qua `useTours`.
- **Hệ thống QR**: Trang Landing `QRLanding` quét mã QR -> gọi API `useQRScan` -> tự động Redirect vào trang chi tiết tương ứng.

### 3. Giai đoạn 2: Owner Portal (Hoàn tất API)
- `OwnerLayout` (Responsive).
- Trang `Login` (Kèm trạng thái Auth lưu vào Zustand `useAuthStore`).
- **Dashboard**: Tích hợp `useOwnerDashboard` call API `/api/owner/dashboard` hiển thị số liệu thống kê.
- **Quản lý POI**: Tích hợp `useMyPois` fetch `/api/owner/pois` hiển thị danh sách các quán thuộc quyền sở hữu của Owner kèm trạng thái duyệt.
- **Quản lý Menu**: Tích hợp Selector chọn quán + `usePoiMenu` fetch `/api/owner/pois/{id}/menu` hiển thị thực đơn theo từng quán chuyên biệt.
- Notifications (Giao diện UI tĩnh).

### 4. Giai đoạn 3 & 4: Admin CMS (Bộ khung tĩnh)
- `AdminLayout` (Có sidebar hệ thống quản trị đầy đủ).
- Bảng Dashboard hệ thống.
- Các phân hệ: Duyệt Owner, Duyệt POI, Quản lý QR, Ngân hàng Quiz.
- Quản lý Audit Logs (dùng `date-fns`), Ngôn ngữ, và Âm thanh TTS.

---

> [!TIP]
> **Hướng dẫn khởi chạy**
> 1. Đảm bảo Backend API C# đang chạy tại cổng `5242`.
> 2. Đổi tên folder từ `prj_C#` thành `prj_CSharp` để tránh lỗi Vite.
> 3. Mở Terminal tại folder `frontend` chạy lệnh: `npm run dev`.
