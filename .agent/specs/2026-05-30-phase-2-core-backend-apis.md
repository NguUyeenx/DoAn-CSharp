# Đặc tả Kỹ thuật — Phase 2: Core Backend APIs

Tài liệu đặc tả này mô tả chi tiết thiết kế lớp DTO, phương thức nghiệp vụ trong Service, cấu hình API Controller, tích hợp thư viện tạo mã QR, và các ca kiểm thử tích hợp tự động cho **Phase 2: Core Backend APIs**.

---

## 1. POI CRUD & Proximity API (P2.T1)

### 1.1 Cấu trúc Lớp DTO (`Models/DTOs/`)

#### POIListDto.cs (Danh sách rút gọn)
```csharp
namespace DoAn_CSharp.Models.DTOs
{
    public class POIListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Category { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public double? Distance { get; set; } // Tính bằng mét so với tọa độ khách gửi lên
    }
}
```

#### POIDto.cs (Chi tiết POI đa ngôn ngữ)
```csharp
namespace DoAn_CSharp.Models.DTOs
{
    public class POIDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // Tên gốc Việt
        public string Slug { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TriggerRadiusMeters { get; set; }
        public string Category { get; set; } = string.Empty;
        public int Priority { get; set; }
        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
        
        // Bản dịch tương ứng ngôn ngữ yêu cầu (fallbacks to 'en' or original if none found)
        public string LocalizedName { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;
        public string AudioText { get; set; } = string.Empty;
        
        public string? QRCode { get; set; } // Mã QR tương ứng (VD: VKE-POI-001)
        public int MenuItemCount { get; set; }
    }
}
```

#### POICreateDto.cs (Dữ liệu tạo mới)
```csharp
namespace DoAn_CSharp.Models.DTOs
{
    public class POICreateDto
    {
        public string Name { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TriggerRadiusMeters { get; set; } = 30;
        public string Category { get; set; } = string.Empty;
        public int Priority { get; set; } = 5;
        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
    }
}
```

#### POIUpdateDto.cs (Dữ liệu cập nhật)
```csharp
namespace DoAn_CSharp.Models.DTOs
{
    public class POIUpdateDto
    {
        public string? Name { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public int? TriggerRadiusMeters { get; set; }
        public string? Category { get; set; }
        public int? Priority { get; set; }
        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public bool? IsActive { get; set; }
    }
}
```

### 1.2 FluentValidation Quy tắc Xác thực (`Validators/`)
Tạo `POICreateValidator` và `POIUpdateValidator`:
*   `Latitude`: Từ `-90.0` đến `90.0`.
*   `Longitude`: Từ `-180.0` đến `180.0`.
*   `TriggerRadiusMeters`: Từ `5` đến `500` mét.
*   `Priority`: Từ `1` đến `10`.
*   `Category`: Phải thuộc danh sách: `restaurant`, `cafe`, `temple`, `market`, `park`, `landmark`, `street_art`, `street_food`.
*   `Name`: Không được trống, tối đa `100` ký tự.

### 1.3 Thiết kế Thuật toán Haversine C#
Tính toán khoảng cách địa lý giữa 2 tọa độ (mét) trong bộ nhớ C#:
```csharp
public static double ComputeHaversine(double lat1, double lon1, double lat2, double lon2)
{
    const double R = 6371000.0; // Bán kính Trái Đất (mét)
    var dLat = (lat2 - lat1) * Math.PI / 180.0;
    var dLon = (lon2 - lon1) * Math.PI / 180.0;
    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
    var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    return R * c;
}
```

### 1.4 Giao diện & Lớp Nghiệp vụ `POIService`
*   `GetAllAsync(string? category, string lang)`:
    *   Lấy toàn bộ POI đang hoạt động (`IsActive == true`).
    *   Lọc theo `category` nếu có.
    *   Dịch tên hiển thị và mô tả theo `lang`.
*   `GetByIdAsync(int id, string lang)`:
    *   Lấy chi tiết POI cùng các bản dịch liên quan.
    *   Nếu không tìm thấy bản dịch theo `lang`, tự động fallback sang `en`. Nếu không có `en`, dùng Name gốc.
*   `GetNearbyAsync(double lat, double lng, int radiusMeters, string lang)`:
    *   Lấy toàn bộ POI hoạt động.
    *   Tính khoảng cách Haversine từ `(lat, lng)` du khách đến từng POI.
    *   Lọc các POI có khoảng cách `<= radiusMeters`.
    *   Sắp xếp tăng dần theo khoảng cách và trả về DTO danh sách rút gọn.
*   `CreateAsync(POICreateDto dto)`:
    *   Tạo mới thực thể POI.
    *   Tự động tạo `Slug` duy nhất dạng URL-friendly từ trường `Name` (sử dụng regex loại bỏ dấu và ký tự đặc biệt).
*   `UpdateAsync(int id, POIUpdateDto dto)`:
    *   Cập nhật các thuộc tính được gửi lên của POI.
*   `DeleteAsync(int id)`:
    *   Thực hiện xóa mềm (`IsActive = false`) để bảo toàn dữ liệu lịch sử thống kê.

---

## 2. Dịch thuật, Thực đơn & Mã QR API (P2.T2)

### 2.1 QR Code Generation sử dụng `QRCoder`
*   Sử dụng lớp `PngByteQRCode` để tạo file ảnh PNG động từ chuỗi text QR.
*   Nội dung mã QR: Định dạng liên kết `https://vkexplorer.com/qr/{code}` (Trong đó `{code}` là `VKE-POI-{id:D3}`).
*   Logic nghiệp vụ:
    ```csharp
    using QRCoder;
    
    var qrGenerator = new QRCodeGenerator();
    var qrCodeData = qrGenerator.CreateQrCode($"https://vkexplorer.com/qr/{code}", QRCodeGenerator.ECCLevel.Q);
    var qrCode = new PngByteQRCode(qrCodeData);
    byte[] qrCodeBytes = qrCode.GetGraphic(20);
    
    // Lưu byte[] thành file ảnh .png tĩnh tại wwwroot/qrcodes/VKE-POI-{id}.png
    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "qrcodes", $"{code}.png");
    await File.WriteAllBytesAsync(filePath, qrCodeBytes);
    ```

### 2.2 API Dịch thuật & Thực đơn (Menu)
*   **Translation endpoints**:
    *   `GET /api/translations/{poiId}/{lang}`: Lấy bản dịch tiếng `lang` cụ thể cho POI.
    *   `POST /api/admin/translations`: Thêm hoặc cập nhật bản dịch.
*   **Menu Item DTOs**:
    *   `MenuItemDto.cs` chứa: ID, Tên gốc, Giá, Tiền tệ, Ảnh, Thứ tự sắp xếp, Tên dịch theo ngôn ngữ.
*   **Menu Item Endpoints**:
    *   `GET /api/pois/{poiId}/menu?lang={lang}`: Lấy thực đơn của quán đã được địa phương hóa.
    *   Các cổng admin CRUD: `POST /api/admin/pois/{poiId}/menu`, `PUT /api/admin/menu/{id}`, `DELETE /api/admin/menu/{id}`.

---

## 3. Analytics API (P2.T3)

### 3.1 Thống kê Lượt ghé thăm (Visit Logging)
*   Endpoint: `POST /api/analytics/visit`
*   JSON Dữ liệu gửi lên:
    ```json
    {
      "poiId": 1,
      "sessionId": "uuid-v4-client-string-anonymous",
      "triggerType": "geofence", // geofence, qr, manual
      "languageCode": "en"
    }
    ```
*   Hệ thống lưu trực tiếp vào bảng `VisitLogs` mà không yêu cầu đăng nhập.

### 3.2 Bảng Thống kê Tổng quan (Dashboard Summary)
*   Endpoint: `GET /api/admin/analytics/summary`
*   JSON Dữ liệu trả về:
    ```json
    {
      "totalVisits": 1502,
      "visitsOverTime": [
        { "date": "2026-05-20", "count": 45 },
        { "date": "2026-05-21", "count": 62 }
      ],
      "popularPOIs": [
        { "poiId": 1, "poiName": "Cơm Tấm Bà Lan", "count": 340 },
        { "poiId": 3, "poiName": "Ốc Đào Vĩnh Khánh", "count": 280 }
      ]
    }
    ```

---

## 4. Kế hoạch Kiểm thử & Thiết lập TDD (xUnit)

Tôi sẽ tạo các lớp kiểm thử tích hợp sau trong `DoAn-CSharp.Tests`:

### 4.1 POIControllerTests.cs
*   `GetAll_ReturnsSeededPOIs`: Xác minh API `GET /api/pois?lang=en` trả về đủ 15 POIs đã seed kèm theo thuộc tính tên được dịch sang tiếng Anh.
*   `GetNearby_ReturnsSortedPOIs`: Thiết lập tọa độ du khách tại `(10.7575, 106.7020)` (Cơm Tấm Bà Lan). Xác minh API `GET /api/pois/nearby?lat=10.7575&lng=106.7020&r=100` trả về Cơm Tấm Bà Lan đầu tiên với khoảng cách xấp xỉ `0` mét.
*   `Delete_SoftDeletesPOI`: Gọi API `DELETE /api/admin/pois/1`. Xác minh POI có `IsActive` chuyển thành `false` và không xuất hiện trong các truy vấn public thông thường.

### 4.2 QRControllerTests.cs
*   `LookupQR_ReturnsCorrectPOI`: Gọi API `GET /api/qr/VKE-POI-001`. Xác minh API trả về thông tin chi tiết của Cơm Tấm Bà Lan.
*   `GenerateQR_CreatesPhysicalPNG`: Gọi API `POST /api/admin/qr/generate/1`. Xác minh hệ thống tạo file `wwwroot/qrcodes/VKE-POI-001.png` chứa dữ liệu hợp lệ trên ổ đĩa.

### 4.3 AnalyticsControllerTests.cs
*   `LogVisit_IncrementsVisitsCount`: Gửi yêu cầu `POST /api/analytics/visit` và xác minh bản ghi ghi nhận thành công trong cơ sở dữ liệu.
