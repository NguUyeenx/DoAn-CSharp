# 💻 DoAn-CSharp - Project Hub (ASP.NET Core 9.0 MVC)

[![.NET Version](https://img.shields.io/badge/.NET-9.0-blueviolet.svg?style=flat-square)](https://dotnet.microsoft.com/download/dotnet/9.0)
[![C# Version](https://img.shields.io/badge/C%23-13.0-blue.svg?style=flat-square)](https://learn.microsoft.com/dotnet/csharp/)
[![Framework](https://img.shields.io/badge/ASP.NET-Core%20MVC-brightgreen.svg?style=flat-square)](https://learn.microsoft.com/aspnet/core/mvc/overview)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

Chào mừng bạn đến với **Project Hub** - Cấu trúc đồ án môn học Ngôn ngữ lập trình C# được xây dựng trên nền tảng **ASP.NET Core 9.0 MVC**. Project này đóng vai trò là một **Cổng thông tin & Khung dự án mẫu (Starter Template)** chuyên nghiệp, sẵn sàng để tích hợp bất kỳ đề tài nghiệp vụ quản lý thực tế nào.

---

## 👥 Thành Viên Nhóm Thực Hiện (Development Team)

Đồ án được nghiên cứu và phát triển bởi các thành viên:

| Hình đại diện | Thành viên | Vai trò | Nhiệm vụ chính |
| :---: | :--- | :--- | :--- |
| **NN** | **Nguyễn Trọng Nguyễn** | **Lead Architect / Backend** | Thiết kế kiến trúc tổng thể, tổ chức Database, viết các API/Service nghiệp vụ cốt lõi, quản trị luồng Git. |
| **NH** | **Nguyễn Ngọc Hải** | **Full-stack / UI Designer** | Thiết kế giao diện (UI/UX) Glassmorphism, viết CSS tùy chỉnh, xây dựng Controllers/Views, kiểm thử trải nghiệm. |

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

Hệ thống được phát triển tích hợp đầy đủ công nghệ hiện đại:

- **Ngôn ngữ**: C# 13 (với Nullable Types & Implicit Usings kích hoạt).
- **Khung ứng dụng**: ASP.NET Core 9.0 MVC (Model-View-Controller).
- **Giao diện (UI)**:
  - **Bootstrap 5** & **Bootstrap Icons** phục vụ thiết kế Responsive.
  - **Google Fonts (Outfit)** cho kiểu chữ công nghệ, hiện đại.
  - **Glassmorphism Overlay CSS** tùy biến cao cấp cho giao diện Dark Mode.
- **Thư viện đi kèm**: jQuery, ASP.NET Static Assets mapping.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Folder Structure)

Mã nguồn được tổ chức chặt chẽ theo chuẩn cấu trúc của Microsoft:

```text
DoAn-CSharp/
├── Controllers/            # Chứa các Controller xử lý luồng nghiệp vụ chính
│   └── HomeController.cs   # Điều hướng trang chủ (Index), điều khoản (Privacy) và trang lỗi
├── Models/                 # Định nghĩa thực thể dữ liệu (Data Entity) & ViewModel
│   └── ErrorViewModel.cs   # Mô hình xử lý dữ liệu lỗi
├── Views/                  # Giao diện hiển thị Razor Pages (.cshtml)
│   ├── Home/               # View tương ứng với HomeController
│   │   ├── Index.cshtml    # Giao diện Project Hub giới thiệu đồ án (đã thiết kế lại)
│   │   └── Privacy.cshtml  # Trang chính sách & điều khoản mẫu
│   ├── Shared/             # Layout dùng chung và các phần tử tái sử dụng
│   │   ├── _Layout.cshtml  # Khung trang chính (đã tích hợp Theme Dark Glassmorphic)
│   │   └── Error.cshtml    # Trang thông báo lỗi hệ thống
│   ├── _ViewImports.cshtml # Khai báo các thư viện thẻ Tag Helper và Namespace dùng chung
│   └── _ViewStart.cshtml   # Cấu hình Layout mặc định cho toàn bộ View
├── wwwroot/                # Tài nguyên tĩnh của trang web (Client-side assets)
│   ├── css/
│   │   ├── site.css        # CSS định hình bố cục chung
│   │   └── landing.css     # CSS thiết kế Theme Glassmorphism đặc thù [NEW]
│   ├── js/
│   │   └── site.js         # JavaScript tùy biến của client
│   ├── lib/                # Thư viện ngoài (Bootstrap, jQuery tải cục bộ)
│   └── favicon.ico         # Icon hiển thị trên Tab trình duyệt
├── appsettings.json        # Cấu hình môi trường (Connection Strings, Logging)
├── DoAn-CSharp.csproj      # File cấu hình biên dịch dự án .NET
└── Program.cs              # Tệp khởi tạo ứng dụng, đăng ký Service và định tuyến Routing
```

---

## 🚀 Hướng Dẫn Cài Đặt và Khởi Chạy (Installation & Run)

Để tải dự án về máy và chạy thử nghiệm cục bộ, hãy làm theo các bước dưới đây:

### 1. Yêu Cầu Hệ Thống (Prerequisites)
Đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
- **.NET 9.0 SDK** ([Tải về tại đây](https://dotnet.microsoft.com/download/dotnet/9.0))
- Trình biên dịch: **Visual Studio 2022 (v17.12+)** hoặc **Visual Studio Code** (đã cài extension C# Dev Kit).

### 2. Khởi Chạy Qua Command Line (Terminal / PowerShell)

1. Mở Terminal tại thư mục gốc dự án `DoAn-CSharp`.
2. Khôi phục các thư viện NuGet cần thiết:
   ```bash
   dotnet restore
   ```
3. Biên dịch dự án để đảm bảo không phát sinh lỗi:
   ```bash
   dotnet build
   ```
4. Khởi chạy máy chủ phát triển (Development Server):
   ```bash
   dotnet run
   ```
5. Mở trình duyệt web và truy cập địa chỉ được hiển thị trên màn hình Terminal (thông thường là `http://localhost:5000` hoặc cổng HTTPS ngẫu nhiên do Kestrel cấp phát).

---

## 💡 Hướng Dẫn Mở Rộng Cho Đồ Án Môn Học

Khi nhóm đã xác định được đề tài cụ thể, các bạn có thể dễ dàng mở rộng cấu trúc dự án mẫu này theo các bước:

1. **Khởi tạo dữ liệu trong `Models/`**:
   - Thêm các Class C# đại diện cho thực thể (ví dụ: `class SinhVien`, `class SanPham`).
2. **Thiết lập Database Connection**:
   - Khai báo Connection String kết nối SQL Server vào `appsettings.json`.
   - Cài đặt NuGet Packages: `Microsoft.EntityFrameworkCore.SqlServer` và `Microsoft.EntityFrameworkCore.Tools`.
   - Tạo class kế thừa `DbContext` để quản lý truy vấn EF Core.
3. **Phát triển Controller nghiệp vụ**:
   - Click chuột phải vào thư mục `Controllers` -> Add Controller -> Viết các Action Method (`Index`, `Create`, `Edit`, `Delete`) xử lý logic.
4. **Tạo giao diện hiển thị trong `Views/`**:
   - Thêm thư mục tương ứng với tên Controller mới tạo.
   - Viết các trang Razor `.cshtml` sử dụng cú pháp HTML5, Bootstrap 5 và nhúng Layout chung bằng cách dùng `@Layout = "_Layout";`.
5. **Liên kết với Project Hub**:
   - Mở file `Views/Home/Index.cshtml`.
   - Cập nhật liên kết của các nút trong phần **Bảng Điều Hướng Phân Hệ** dẫn trực tiếp đến Controller mới tạo (dùng thẻ `asp-controller` và `asp-action`).

---

Chúc nhóm các bạn hoàn thành xuất sắc đồ án môn học Ngôn ngữ lập trình C#!
