# Đặc tả Kỹ thuật — Phase 3: Core Frontend Features

Tài liệu này đặc tả chi tiết thiết kế và kế hoạch triển khai cho **Phase 3: Core Frontend Features** của ứng dụng **VinhKhanh Explorer** smart walking tour PWA.

---

## 1. Mục tiêu & Các tính năng Cốt lõi

### 1.1 Bản đồ tương tác & Vòng tròn Geofencing (ExplorePage.tsx)
*   **Tích hợp Google Maps**: Sử dụng thư viện `@vis.gl/react-google-maps` (đã cài đặt).
*   **Vòng tròn Khoảng cách**: Vẽ các vòng tròn bán kính kích hoạt (`triggerRadiusMeters`) dạng bán trong suốt (semi-transparent) màu xanh lục/ngọc bích xung quanh mỗi POI hoạt động.
*   **Vị trí Du khách**: Marker màu xanh lam có hiệu ứng vòng tròn xung quanh nhấp nháy đại diện cho vị trí GPS thời gian thực của du khách.
*   **Trình Mô phỏng Geofence (Walk Simulator)**: Widget điều khiển giả lập GPS tích hợp trực tiếp trên giao diện để nhà phát triển/người dùng có thể "đi bộ" ảo qua 15 điểm seed sẵn mà không cần di chuyển thực tế.

### 1.2 Dịch thuật & Thuyết minh Âm thanh Tự động (Web Speech API)
*   **Chuyển đổi Ngôn ngữ**: Nút chuyển đổi nhanh song ngữ Anh-Việt lưu trong `settingsStore.ts` thay đổi tức thời toàn bộ nội dung text và gọi API tương ứng.
*   **Bản dịch tự động và Fallback**: Áp dụng cơ chế fallback đã lập trình phía backend.
*   **Thuyết minh giọng nói tự động**: Khi du khách đi vào vòng tròn kích hoạt của POI, ứng dụng sẽ tự động phát âm thanh thuyết minh (sử dụng `window.speechSynthesis` của trình duyệt) với ngôn ngữ thích hợp (`vi-VN` hoặc `en-US`).
*   **Bảng Điều khiển Narration (Bottom Sheet)**: Slide-up sheet hiện lên ở góc dưới màn hình khi có POI được kích hoạt, cho phép dừng/phát âm thanh thuyết minh, xem thực đơn món ăn, hoặc mở Google Maps điều hướng.

### 1.3 Quét mã QR di động (ScanPage.tsx)
*   **Quét qua Camera**: Sử dụng thư viện `qr-scanner` tích hợp để mở camera quét mã trên thiết bị di động.
*   **Ánh xạ & Ghi nhận**: Khi phát hiện mã QR hợp lệ (dạng `https://vkexplorer.com/qr/{code}` hoặc chuỗi code `VKE-POI-{001}`), ứng dụng gọi API `/api/qr/{code}` để lấy thông tin chi tiết của POI, đồng thời gọi `POST /api/analytics/visit` với `triggerType = "qr"`.
*   **Điều hướng**: Tự động mở Bottom Sheet thông tin chi tiết của POI tương ứng.

### 1.4 Dashboard Thống kê & Biểu đồ Recharts (admin/AnalyticsPage.tsx)
*   **Kết nối Backend**: Lấy dữ liệu thống kê từ endpoint `/api/admin/analytics/summary`.
*   **Biểu đồ Recharts**:
    *   *Area Chart*: Biểu thị xu hướng lượt truy cập theo thời gian (Visits over Time).
    *   *Bar Chart*: Biểu thị các địa điểm ẩm thực/tham quan được ghé thăm nhiều nhất (Popular POIs).
    *   *Stat Cards*: Thẻ tóm tắt tổng số lượt, phân chia tỷ lệ lượt quét QR vs Geofence.

### 1.5 CMS Quản trị POI & Dịch thuật (admin/POIEditorPage.tsx)
*   **Quản lý danh sách**: Bảng danh sách POIs kèm bộ lọc danh mục và chức năng Xóa mềm.
*   **Form Thêm mới / Cập nhật**: Trường nhập tọa độ địa lý, danh mục, mức độ ưu tiên, URL Google Maps, ảnh đại diện.
*   **Quản lý Dịch thuật**: Form con cho phép soạn thảo bản dịch đa ngôn ngữ cho từng POI.
*   **Tạo Mã QR vật lý**: Nút "Tạo QR" kích hoạt API `/api/admin/qr/generate/{id}`, lập tức hiển thị ảnh QR PNG được sinh ra từ backend.

---

## 2. Luồng Trạng thái & Tích hợp API (Zustand & React Query)

### 2.1 Zustand Stores mở rộng
Chúng ta sẽ thiết lập logic theo dõi vị trí và kích hoạt geofence trực tiếp trong `locationStore.ts` hoặc một service helper:

```typescript
// locationStore.ts cập nhật:
interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationState {
  position: GPSPosition | null;
  isTracking: boolean;
  isSimulatorActive: boolean;
  setPosition: (pos: GPSPosition) => void;
  setTracking: (isTracking: boolean) => void;
  setSimulatorActive: (active: boolean) => void;
}
```

### 2.2 Thuật toán Haversine Client-Side (Tính khoảng cách trong React)
Để tính toán khoảng cách thực tế giữa vị trí hiện tại của du khách và POI để vẽ thanh tiến độ và kích hoạt âm thanh:

```typescript
export function computeHaversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Bán kính trái đất (mét)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
  const c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
  return R * c;
}
```

---

## 3. Các ca Kiểm thử & Xác minh (Verification Plan)

Vì dự án React sử dụng TypeScript và Vite, quy trình xác minh sẽ tập trung vào sự hoàn thiện của giao diện người dùng, khả năng tương thích kiểu dữ liệu tĩnh, hiệu năng dựng biểu đồ và tính đúng đắn của logic kích hoạt.

### 3.1 Kiểm thử tự động (Static Analysis)
1.  **TypeScript Compilation**: Chạy `npm run typecheck` trong thư mục `VinhKhanh-Explorer` để đảm bảo 100% tệp tin TSX biên dịch sạch sẽ không có lỗi kiểu dữ liệu.
2.  **Lint Check**: Chạy `npm run lint` để kiểm tra chất lượng mã nguồn và đảm bảo không vi phạm các quy tắc ESLint.
3.  **Vite Build Sanity**: Chạy `npm run build` để xác minh dự án React đóng gói thành công thành các bundle tĩnh tối ưu.

### 3.2 Kế hoạch Kiểm thử Thủ công (Manual UI/UX Walkthrough)
1.  **Chạy Simulator**: Mở Explore Page, bật "Simulator Mode", bấm đi qua các điểm. Kiểm tra xem:
    *   Bottom Sheet chi tiết POI có tự động hiện lên khi du khách đi vào vòng tròn xanh lục hay không.
    *   Trình duyệt có phát giọng nói thuyết minh (Text-to-Speech) chính xác bằng ngôn ngữ đã chọn không.
    *   Một bản ghi `POST /api/analytics/visit` có được gửi ẩn danh lên server thành công không.
2.  **Chuyển đổi Ngôn ngữ**: Chuyển đổi giữa `EN` và `VI` ở Settings. Đảm bảo toàn bộ tiêu đề, thực đơn món ăn, mô tả POI và giọng nói tự động thay đổi ngôn ngữ ngay lập tức.
3.  **Quét mã QR**: Sử dụng camera giả lập hoặc tải lên file ảnh QR để quét `VKE-POI-001`. Đảm bảo trang tự động chuyển hướng, kích hoạt Bottom Sheet và ghi nhận lượt ghé thăm với `triggerType = "qr"`.
4.  **Admin Analytics**: Mở trang thống kê admin, đảm bảo Recharts Area Chart và Bar Chart vẽ mượt mà, đầy đủ các điểm dữ liệu lấy từ backend API.
5.  **CMS Editor**: Tạo một POI mới, nhập tọa độ và danh mục, sau đó bấm "Tạo QR Code". Đảm bảo ảnh mã QR PNG hiển thị lên tức thì ngay trên trang CMS.
