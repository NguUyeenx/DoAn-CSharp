# Hướng Dẫn Test API Backend (Postman)

Bộ hướng dẫn này tập trung vào 10 tính năng mới được triển khai trong Phase 1-4.
> Chú ý: Cần gắn `Authorization: Bearer <Token>` vào phần Header hoặc thẻ Authorization trong Postman đối với các API dành cho Owner và Admin.

---

## Môi Trường (Variables)
- `baseUrl`: `http://localhost:5242` (hoặc cổng tương ứng của bạn)
- `adminToken`: Token lấy được từ `POST /api/auth/admin/login`
- `ownerToken`: Token lấy được từ `POST /api/auth/login`

---

## 1. Owner Core APIs

### Thêm Món Ăn (Menu)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/owner/menu-items`
- **Headers**: Authorization -> Bearer `{{ownerToken}}`
- **Body** (JSON):
```json
{
  "poiId": 1,
  "name": "Bún Bò Huế",
  "price": 45000,
  "currency": "VND",
  "imageUrl": "https://example.com/bun-bo.jpg",
  "displayOrder": 1,
  "isAvailable": true
}
```

### Xoá 1 Ảnh Khỏi POI
- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/api/owner/pois/1/images/2`
- **Headers**: Authorization -> Bearer `{{ownerToken}}`

### Bật/Tắt Hiển Thị Món Ăn
- **Method**: `PUT`
- **URL**: `{{baseUrl}}/api/owner/menu-items/1/availability`
- **Headers**: Authorization -> Bearer `{{ownerToken}}`, Content-Type -> application/json
- **Body** (JSON):
```json
true
```

### Upload Image cho POI
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/owner/pois/1/images`
- **Headers**: Authorization -> Bearer `{{ownerToken}}`
- **Body** (JSON): Array of Strings
```json
[
  "https://example.com/image1.jpg",
  "https://example.com/image2.jpg"
]
```

### Xem Biểu Đồ Analytics (Dashboard)
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/owner/dashboard/charts`
- **Headers**: Authorization -> Bearer `{{ownerToken}}`

---

## 2. Notification API

### Đọc Thông Báo
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/notifications`
- **Headers**: Authorization -> Bearer `{{ownerToken}}`

### Đánh Dấu Đã Đọc
- **Method**: `PUT`
- **URL**: `{{baseUrl}}/api/notifications/1/read`
- **Headers**: Authorization -> Bearer `{{ownerToken}}`

---

## 3. Public Features (Không Cần Token)

### Xem Menu Của Quán
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/pois/1/menu?lang=vi`

### Xem Câu Hỏi Quiz Của Quán
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/pois/1/quiz?lang=vi`

### Nộp Đáp Án Quiz
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/quiz/submit`
- **Body** (JSON):
```json
{
  "quizQuestionId": 1,
  "selectedOption": "A"
}
```

### Quét QR Code
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/qr/MACodeTest`
*(Hệ thống sẽ cộng thêm lượt quét và ghi log Visit)*

---

## 4. Admin Operations

### Lấy Danh Sách Ngôn Ngữ
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/admin/languages`
- **Headers**: Authorization -> Bearer `{{adminToken}}`

### Bật/Tắt Ngôn Ngữ
- **Method**: `PUT`
- **URL**: `{{baseUrl}}/api/admin/languages/en/status`
- **Headers**: Authorization -> Bearer `{{adminToken}}`, Content-Type -> application/json
- **Body** (JSON):
```json
true
```

### Thêm Điểm Dừng Vào Tour (TourStops)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/admin/tours/1/stops`
- **Headers**: Authorization -> Bearer `{{adminToken}}`, Content-Type -> application/json
- **Body** (JSON):
```json
{
  "poiId": 2,
  "stopOrder": 2,
  "transitionNote": "Đi bộ 5 phút"
}
```

### Tạo Quiz Câu Hỏi Mới
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/admin/quiz`
- **Headers**: Authorization -> Bearer `{{adminToken}}`
- **Body** (JSON):
```json
{
  "poiId": 1,
  "questionText": "Món ăn nào nổi tiếng nhất ở Vĩnh Khánh?",
  "answerA": "Ốc",
  "answerB": "Phở",
  "answerC": "Cơm Tấm",
  "answerD": "Bún Chả",
  "correctOption": "A",
  "explanationText": "Ốc là đặc sản nổi tiếng khu vực quận 4."
}
```

### Sinh QR Code Tự Động Cho Quán
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/admin/pois/1/generate-qr`
- **Headers**: Authorization -> Bearer `{{adminToken}}`

### Xem Lịch Sử Sửa Đổi (Audit Logs)
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/admin/audit-logs`
- **Headers**: Authorization -> Bearer `{{adminToken}}`

### Quản Lý File Audio (TTS)
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/admin/audio`
- **Headers**: Authorization -> Bearer `{{adminToken}}`
