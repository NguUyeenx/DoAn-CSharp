# Đặc tả Kỹ thuật — Phase 4: Tours & Gamification

Tài liệu này đặc tả chi tiết thiết kế hệ thống và kế hoạch triển khai cho **Phase 4: Tours & Gamification** của dự án **VinhKhanh Explorer**. Chúng ta sẽ xây dựng hệ thống Hành trình đi bộ (Tours) hoàn chỉnh, tích hợp tính năng trò chơi hóa (Gamification) gồm Đố vui văn hóa (Quizzes) và Hệ thống thành tựu tích điểm (Achievements/Rewards) để gia tăng tối đa trải nghiệm tương tác của du khách.

---

## 1. Mục tiêu & Các tính năng Cốt lõi

### 1.1 Hệ thống Hành trình du ngoạn (Walking Tours)
*   **Curated Tours**: Các tour đi bộ được thiết kế sẵn bởi Admin (VD: "Thiên đường Ốc Vĩnh Khánh", "Khám phá Văn hóa & Nghệ thuật đường phố", "Càn quét ẩm thực đêm Quận 4").
*   **Ordered Stops**: Mỗi tour gồm danh sách các điểm POI được sắp xếp theo thứ tự tối ưu (`StopOrder`), kèm theo chỉ dẫn di chuyển ngắn (`TransitionNote`).
*   **Quản lý phía Admin (Tour CMS)**: Giao diện `admin/ToursPage.tsx` cho phép Admin tạo mới tour, thay đổi thứ tự các điểm dừng POI, viết chỉ dẫn di chuyển và lưu trữ vào cơ sở dữ liệu.

### 1.2 Trò chơi hóa & Thử thách Đố vui (Tours Gamification & Quizzes)
*   **Vĩnh Khánh Quizzes**: Mỗi điểm POI sẽ có một câu hỏi đố vui trắc nghiệm đa lựa chọn (A, B, C, D) song ngữ về lịch sử, nguồn gốc món ăn hoặc nét độc đáo của điểm đến đó.
*   **Check-in & Điểm thưởng (Exploration Points)**:
    *   Du khách ghé thăm một POI (qua Geofence hoặc quét QR) được tính là Check-in thành công và nhận ngay **100 điểm tích lũy**.
    *   Du khách trả lời đúng câu đố tại POI nhận thêm **50 điểm thưởng**.
    *   Hoàn thành toàn bộ các điểm dừng của một Walking Tour nhận ngay **500 điểm thưởng**.
*   **Bảng Huy chương & Thành tựu (Achievements & Badges)**:
    *   *Rookie Explorer*: Check-in điểm đầu tiên.
    *   *Street Food Critic*: Check-in 3 quán ăn khác nhau.
    *   *Vinh Khanh Legend*: Ghé thăm toàn bộ 15 điểm POI trên tuyến phố.
    *   *Quiz Master*: Trả lời đúng 5 câu đố liên tiếp.
*   **Lưu trữ Client-Side Không cần Đăng nhập**: Toàn bộ điểm tích lũy, danh sách POI đã check-in, câu hỏi đã trả lời và huy chương đã đạt sẽ được lưu trữ an toàn trong LocalStorage thông qua Zustand store (`gamificationStore.ts`) của du khách.

---

## 2. Thiết kế Cơ sở dữ liệu & API Endpoints

### 2.1 Mở rộng Thực thể C# (C# Entities)

Chúng ta sẽ tận dụng thực thể `Tour` và `TourStop` có sẵn, đồng thời tạo mới thực thể câu hỏi đố vui `QuizQuestion` và thực thể dịch thuật câu hỏi `QuizQuestionTranslation`:

```csharp
// Models/Entities/QuizQuestion.cs
public class QuizQuestion
{
    public int Id { get; set; }
    public int POIId { get; set; }
    public POI? POI { get; set; }
    
    public string QuestionText { get; set; } = string.Empty; // Nội dung gốc (tiếng Việt)
    public string AnswerA { get; set; } = string.Empty;
    public string AnswerB { get; set; } = string.Empty;
    public string AnswerC { get; set; } = string.Empty;
    public string AnswerD { get; set; } = string.Empty;
    public char CorrectOption { get; set; } // 'A' | 'B' | 'C' | 'D'
    public string ExplanationText { get; set; } = string.Empty;
    
    public ICollection<QuizQuestionTranslation> Translations { get; set; } = new List<QuizQuestionTranslation>();
}

// Models/Entities/QuizQuestionTranslation.cs
public class QuizQuestionTranslation
{
    public int Id { get; set; }
    public int QuizQuestionId { get; set; }
    public QuizQuestion? QuizQuestion { get; set; }
    public string LanguageCode { get; set; } = "en";
    
    public string QuestionText { get; set; } = string.Empty;
    public string AnswerA { get; set; } = string.Empty;
    public string AnswerB { get; set; } = string.Empty;
    public string AnswerC { get; set; } = string.Empty;
    public string AnswerD { get; set; } = string.Empty;
    public string ExplanationText { get; set; } = string.Empty;
}
```

### 2.2 Các Endpoint API Mới

#### 1. Hệ thống Tour (Tour Endpoints)
*   `GET /api/tours?lang={lang}`: Lấy danh sách các Tour đang hoạt động (kèm số lượng điểm dừng POI và thông tin cơ bản).
*   `GET /api/tours/{id}?lang={lang}`: Lấy chi tiết một Tour, bao gồm danh sách các điểm dừng POI được sắp xếp theo `StopOrder`, ảnh đại diện của từng điểm dừng, tọa độ và hướng dẫn di chuyển giữa các điểm dừng.
*   `POST /api/admin/tours`: Tạo mới một Tour (Admin).
*   `PUT /api/admin/tours/{id}`: Cập nhật thông tin Tour và danh sách các điểm dừng (Admin).
*   `DELETE /api/admin/tours/{id}`: Xóa mềm một Tour (Admin).

#### 2. Thử thách Đố vui (Quiz Endpoints)
*   `GET /api/quizzes/{poiId}?lang={lang}`: Lấy câu hỏi đố vui liên kết với POI chỉ định (hỗ trợ dịch thuật song ngữ và tự động fallback sang tiếng Anh hoặc bản gốc).
*   `POST /api/quizzes/submit`: Gửi câu trả lời của du khách để chấm điểm.
    *   *Payload*: `{ "quizQuestionId": 1, "selectedOption": "B" }`
    *   *Response*: `{ "isCorrect": true, "correctOption": "B", "explanationText": "..." }`

---

## 3. Thiết kế Giao diện người dùng & Trải nghiệm Gamification

### 3.1 Explore Page & POI Bottom Sheet
*   **Trạng thái Check-in**: Khi du khách kích hoạt POI (qua GPS hoặc QR Code), giao diện POI Bottom Sheet sẽ hiển thị thẻ trạng thái "Visited ✅ (+100 pts)".
*   **Interactive Quiz Card**: 
    *   Ngay dưới thông tin mô tả điểm đến, hiển thị một thẻ "Đố vui văn hóa" lấp lánh (micro-animations).
    *   Thẻ hiển thị câu hỏi trắc nghiệm kèm 4 phương án dạng nút chọn lớn.
    *   Khi bấm chọn, thẻ lập tức đổi trạng thái: hiển thị màu Xanh lục (Đúng) hoặc Đỏ (Sai), phát âm thanh nhẹ (nếu trình duyệt hỗ trợ) và hiển thị phần Thuyết minh giải thích ý nghĩa đáp án (`ExplanationText`) cực kỳ lôi cuốn.

### 3.2 Public Tours & Profile Page
*   **Trang Danh sách Tour**:
    *   Tích hợp trực tiếp một tab "Curated Tours" trên giao diện du khách.
    *   Mỗi thẻ Tour hiển thị tiêu đề, mô tả ngắn, ước lượng thời gian đi bộ, khoảng cách km, số điểm dừng, và nút "Bắt đầu Tour này".
    *   Khi bắt đầu, bản đồ Leaflet sẽ vẽ một đường nối liền (Leaflet Polyline) đi qua các điểm dừng để chỉ đường du khách đi bộ tuần tự!
*   **Profile & Achievements Widget**:
    *   Hiển thị điểm số hiện tại của du khách kèm vòng tròn tiến trình (circular progress bar) rực rỡ.
    *   Gồm danh sách các huy chương thành tích (badges) dạng biểu tượng màu tối, tự động sáng bừng lên bằng màu sắc tươi tắn khi đạt điều kiện mở khóa.

---

## 4. Kế hoạch Xác minh & Các ca kiểm thử (TDD Cases)

Để tuân thủ tuyệt đối quy trình phát triển hướng kiểm thử (TDD), chúng ta sẽ lập trình các ca kiểm thử sau trong dự án xUnit `DoAn-CSharp.Tests`:

### 4.1 Automated Tests (xUnit)
1.  **Tour Creation & Stops Order Validation**:
    *   Kiểm tra việc lưu Tour và sắp xếp thứ tự `TourStops` đúng đắn.
    *   Xác minh khi cập nhật thứ tự `StopOrder`, các điểm dừng cập nhật chính xác và không bị trùng lặp.
2.  **Bilingual Translation Fallback for Quizzes**:
    *   Xác minh khi gọi API lấy câu hỏi đố vui bằng tiếng Anh (`lang=en`), hệ thống trả về bản dịch tiếng Anh.
    *   Xác minh khi gọi câu hỏi tại POI không có bản dịch tiếng Anh, hệ thống tự động fallback về tiếng Việt gốc một cách an toàn.
3.  **Quiz Submission & Scoring**:
    *   Gửi câu trả lời đúng (VD: 'A' khi đáp án đúng là 'A') -> trả về kết quả `isCorrect = true`.
    *   Gửi câu trả lời sai (VD: 'B' khi đáp án đúng là 'A') -> trả về kết quả `isCorrect = false`.

### 4.2 Manual UI/UX Verification
1.  **Leaflet Polyline Guide**: Bấm "Bắt đầu Tour Thiên đường Ốc", đảm bảo bản đồ vẽ đường nét đứt màu xanh nối liền các quán ốc và di chuyển bản đồ tập trung vào điểm dừng đầu tiên.
2.  **Zustand Gamification Persistence**: F5 lại trình duyệt sau khi trả lời đúng 2 câu đố và mở khóa huy chương "Street Food Critic". Đảm bảo điểm số và huy chương vẫn hiển thị chính xác từ LocalStorage.
