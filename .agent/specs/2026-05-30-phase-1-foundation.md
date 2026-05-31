# Specification — Phase 1: Foundation

This specification outlines the technical design, structures, and verification criteria for Phase 1 of the **VinhKhanh Explorer** smart walking tour PWA.

---

## 1. Backend Scaffold & Web API Refactoring (P1.T1)

### 1.1 NuGet Package References
Add these exact packages to `DoAn-CSharp.csproj`:
*   `Microsoft.EntityFrameworkCore` (Version 9.0.0)
*   `Microsoft.EntityFrameworkCore.SqlServer` (Version 9.0.0)
*   `Microsoft.EntityFrameworkCore.Tools` (Version 9.0.0)
*   `Microsoft.AspNetCore.Authentication.JwtBearer` (Version 9.0.0)
*   `Swashbuckle.AspNetCore` (Version 6.6.2 or compatible)
*   `QRCoder` (Version 1.6.0)
*   `BCrypt.Net-Next` (Version 4.0.3)
*   `FluentValidation.AspNetCore` (Version 11.3.0)

### 1.2 Program.cs Web API Refactoring
Refactor the startup pipeline to support a headless REST API instead of MVC views:
*   **Controller Services**: `builder.Services.AddControllers();` (replaces `AddControllersWithViews()`).
*   **Swagger/OpenAPI**:
    ```csharp
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    ```
*   **CORS Configuration**: Enable CORS to allow local React development server:
    ```csharp
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
    });
    ```
*   **Asset Hosting**: Ensure `app.UseStaticFiles();` is enabled to serve static assets (such as audio files in `wwwroot/audio/` and QR images in `wwwroot/qrcodes/`).
*   **Routing**: Remove MVC home page routing. Use `app.MapControllers();`.

### 1.3 Global Exception Middleware
*   **File Path**: `Middleware/ExceptionMiddleware.cs`
*   **Behavior**: A custom middleware that catches all unhandled exceptions, logs the error using `ILogger<ExceptionMiddleware>`, and returns a standard JSON error response:
    *   `ContentType`: `application/json`
    *   `StatusCode`: `500 Internal Server Error`
    *   `JSON Payload`:
        ```json
        {
          "error": "InternalServerError",
          "message": "Detailed error message here",
          "statusCode": 500
        }
        ```

### 1.4 Health Check Endpoint
*   **File Path**: `Controllers/HealthController.cs`
*   **Route**: `GET /api/health`
*   **JSON Response**:
    ```json
    {
      "status": "Healthy",
      "timestamp": "2026-05-30T12:00:00Z"
    }
    ```

---

## 2. Database Schema & EF Core Setup (P1.T2)

### 2.1 Entity Structures (Models/Entities/)

#### POI.cs
```csharp
namespace DoAn_CSharp.Models.Entities
{
    public class POI
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TriggerRadiusMeters { get; set; } = 30;
        public string Category { get; set; } = string.Empty;
        public int Priority { get; set; } = 5;
        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<POITranslation> Translations { get; set; } = new List<POITranslation>();
        public ICollection<AudioFile> AudioFiles { get; set; } = new List<AudioFile>();
        public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
        public ICollection<QRCode> QRCodes { get; set; } = new List<QRCode>();
        public ICollection<VisitLog> VisitLogs { get; set; } = new List<VisitLog>();
    }
}
```

#### POITranslation.cs
```csharp
namespace DoAn_CSharp.Models.Entities
{
    public class POITranslation
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public string LanguageCode { get; set; } = string.Empty; // en, ja, ko, zh
        public string Name { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;
        public string AudioText { get; set; } = string.Empty;
    }
}
```

#### AudioFile.cs
```csharp
namespace DoAn_CSharp.Models.Entities
{
    public class AudioFile
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public string AudioType { get; set; } = "pre-recorded";
        public bool IsDefault { get; set; } = false;
    }
}
```

#### MenuItem.cs
```csharp
namespace DoAn_CSharp.Models.Entities
{
    public class MenuItem
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Currency { get; set; } = "VND";
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; } = 0;

        public ICollection<MenuItemTranslation> Translations { get; set; } = new List<MenuItemTranslation>();
    }
}
```

#### MenuItemTranslation.cs
```csharp
namespace DoAn_CSharp.Models.Entities
{
    public class MenuItemTranslation
    {
        public int Id { get; set; }
        public int MenuItemId { get; set; }
        public MenuItem? MenuItem { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
```

#### Tour.cs
```csharp
namespace DoAn_CSharp.Models.Entities
{
    public class Tour
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int EstimatedMinutes { get; set; }
        public double DistanceKm { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<TourStop> Stops { get; set; } = new List<TourStop>();
    }
}
```

#### TourStop.cs
```csharp
namespace DoAn_CSharp.Models.Entities
{
    public class TourStop
    {
        public int Id { get; set; }
        public int TourId { get; set; }
        public Tour? Tour { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public int StopOrder { get; set; }
        public string? TransitionNote { get; set; }
    }
}
```

#### QRCode.cs
```csharp
namespace DoAn_CSharp.Models.Entities
{
    public class QRCode
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public string Code { get; set; } = string.Empty; // VKE-POI-001
        public string QRImageUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
```

#### VisitLog.cs
```csharp
namespace DoAn_CSharp.Models.Entities
{
    public class VisitLog
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string TriggerType { get; set; } = string.Empty; // geofence, qr, manual
        public string LanguageCode { get; set; } = string.Empty;
        public DateTime VisitedAt { get; set; } = DateTime.UtcNow;
    }
}
```

#### AdminUser.cs
```csharp
namespace DoAn_CSharp.Models.Entities
{
    public class AdminUser
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "admin";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
```

### 2.2 AppDbContext.cs Mappings & Constraints
*   **Database connection string** points to: `Server=NGUYEN-IDEAPAD3;Database=VinhKhanhExplorer;Trusted_Connection=True;TrustServerCertificate=True;`
*   **Fluet API Configurations**:
    *   `POI.Slug` -> Unique Index.
    *   `QRCode.Code` -> Unique Index.
    *   `AdminUser.Username` -> Unique Index.
    *   `POITranslation` -> Composite Unique Constraint on `(POIId, LanguageCode)`.
    *   `MenuItemTranslation` -> Composite Unique Constraint on `(MenuItemId, LanguageCode)`.
    *   Configure Cascade Delete on the following relations:
        *   `POI` -> `Translations`, `AudioFiles`, `MenuItems`, `QRCodes`, `VisitLogs` (Cascade).
        *   `MenuItem` -> `Translations` (Cascade).
    *   Indexes on `POI.Category` and `POI.IsActive`.

### 2.3 SeedData.cs Design
We will populate the database with:
1.  **15 Real Vĩnh Khánh POIs** with precise geographic coordinates (approximate coordinates in District 4, HCMC).
2.  **English Translations** for all 15 POIs (covering Name, ShortDescription, FullDescription, and AudioText suitable for TTS playback).
3.  **Sample Menu Items** for the food-focused POIs (e.g. Cơm Tấm Bà Lan, Ốc Đào, Hủ Tiếu Sa Đéc) with Vietnamese and English translations.
4.  **QR Codes** pre-populated for each of the 15 POIs following the format `VKE-POI-{001 to 015}`.
5.  **1 Admin User** with credentials:
    *   `Username`: `admin`
    *   `PasswordHash`: BCrypt hash of `Admin@123` (generated during migration/seeding).

---

## 3. Frontend Foundation (P1.T3)

### 3.1 Dependencies
*   Required packages installed via npm inside `VinhKhanh-Explorer/`:
    *   `react-router-dom`
    *   `@tanstack/react-query`
    *   `@vis.gl/react-google-maps`
    *   `zustand`
    *   `qr-scanner`
    *   `framer-motion`
    *   `recharts`
    *   `vite-plugin-pwa` (as devDependency)

### 3.2 Routing & Layout Architecture
*   **MobileLayout** (for Tourists):
    *   Bilingual Header (App Title + Language Dropdown).
    *   Navigation main frame (`<Outlet />`).
    *   `BottomNav` featuring 4 tabs: Explore (`/`), Discover (`/discover`), Scan (`/scan`), Settings (`/settings`).
*   **AdminLayout** (for Content Management):
    *   Sidebar containing links to Dashboard, POIs Editor, Tours Builder, and Analytics.
    *   Header displaying profile name and Logout button.
*   **Zustand Stores**:
    *   `settingsStore`: Stores language (`en` default), audioEnabled (`true` default), and darkMode state.
    *   `locationStore`: Stores current coordinate `position` (lat, lng, accuracy), and tracking boolean state.
    *   `narrationStore`: Stores currently playing POI details, audio queue list, and cooldown history.
    *   `authStore`: Stores JWT token and admin auth status.

### 3.3 Configuration Files
Create the `.env` file under `VinhKhanh-Explorer/`:
```env
VITE_API_BASE_URL=https://localhost:5001/api
VITE_GOOGLE_MAPS_API_KEY=AIzaSyA-eYPXTwnCcuIm7Rrg7fo3QIYJGHdm2eU
```

---

## 4. Verification and Testing Cases

### 4.1 Success Path Verification
*   **Build Verification**:
    ```bash
    dotnet build
    ```
    Should complete with 0 compile errors.
*   **Seeding Verification**:
    Log in using SQL commands (SSMS or dotnet query) to verify tables contain:
    *   `POIs`: Exactly 15 rows.
    *   `POITranslations`: Populated with `en` configurations.
    *   `AdminUsers`: 1 row with `admin`.
*   **API Health & Routing**:
    *   `GET /api/health` returns status `Healthy` with code `200`.
*   **Frontend Check**:
    *   `npm run dev` launches the Vite dev server.
    *   `npm run typecheck` and `npm run lint` compile cleanly without failures.

### 4.2 Edge Cases & Error Checks
*   **Exception Middleware Triggering**:
    *   Navigate to a mock route designed to throw an exception. The response must be a standard JSON error containing `InternalServerError` with status code `500` instead of a standard ASP.NET Developer HTML exception page.
