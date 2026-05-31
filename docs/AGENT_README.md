# VinhKhanh Explorer — Agent Instructions

> **Đọc file này trước khi bắt đầu bất kỳ task nào.**

## Tổng quan dự án

VinhKhanh Explorer là một PWA (Progressive Web App) hỗ trợ khách du lịch nước ngoài khám phá khu vực Vĩnh Khánh (Quận 4, TP.HCM) thông qua smart walking tour: tự động thuyết minh theo vị trí, dịch menu quán ăn, bản đồ tương tác, và QR code trigger.

## Tài liệu quan trọng

| File | Mục đích |
|---|---|
| [docs/implementation-plan.md](docs/implementation-plan.md) | Thiết kế hệ thống chi tiết (kiến trúc, DB schema, API design, geofence engine, narration engine, UI/UX, v.v.) |
| [docs/task-breakdown.md](docs/task-breakdown.md) | Chia task cho agent thực hiện — mỗi task có requirements, files, acceptance criteria |
| [AGENTS.md](AGENTS.md) | Quy tắc coding cho AI agents |
| [CLAUDE.md](CLAUDE.md) | Behavioral guidelines bổ sung |

## Tech Stack (đã xác nhận)

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4 + shadcn/ui + Framer Motion |
| **Backend** | ASP.NET Core 9.0 Web API |
| **Database** | SQL Server (LocalDB cho dev) |
| **Map** | Google Maps API (`@vis.gl/react-google-maps`) |
| **TTS** | Web Speech API (browser-native) |
| **State** | Zustand + TanStack Query |

## Cấu trúc project

```
DoAn-CSharp/                    ← Backend (ASP.NET Core Web API)
├── Controllers/                ← API controllers
├── Models/Entities/            ← EF Core entities
├── Models/DTOs/                ← Data Transfer Objects
├── Services/                   ← Business logic services
├── Data/                       ← DbContext + migrations
├── Middleware/                 ← Custom middleware
├── Extensions/                 ← DI extension methods
├── wwwroot/                    ← Static files (audio, QR images)
└── Program.cs                  ← Entry point

VinhKhanh-Explorer/             ← Frontend (React PWA)
├── src/
│   ├── components/             ← UI components
│   │   ├── ui/                 ← shadcn/ui components
│   │   ├── map/                ← Google Maps components
│   │   ├── narration/          ← TTS/audio player
│   │   ├── poi/                ← POI detail/list/menu
│   │   ├── qr/                 ← QR scanner
│   │   ├── admin/              ← Admin CMS components
│   │   └── layout/             ← Layout shells
│   ├── pages/                  ← Route pages
│   ├── hooks/                  ← Custom React hooks
│   ├── services/               ← API client services
│   ├── stores/                 ← Zustand stores
│   ├── lib/                    ← Pure logic (geofence, TTS, queue)
│   └── types/                  ← TypeScript type definitions
└── package.json
```

## Quy trình thực hiện task

1. **Đọc task** từ `docs/task-breakdown.md` — tìm task theo ID (ví dụ: `P1.T1`)
2. **Kiểm tra dependencies** — đảm bảo task phụ thuộc đã hoàn thành
3. **Đọc implementation plan** — tham khảo section liên quan trong `docs/implementation-plan.md`
4. **Viết spec** (nếu cần) — theo quy trình `.agent/rules/spec-and-eval-loop.md`
5. **Implement** — tạo/sửa files theo danh sách trong task
6. **Verify** — chạy acceptance criteria checks
7. **Đánh dấu hoàn thành** — update status trong `docs/task-breakdown.md`

## Commands

```bash
# Backend
dotnet build                    # Build backend
dotnet run                      # Run backend API
dotnet test                     # Run xUnit tests
dotnet ef migrations add X      # Create migration
dotnet ef database update       # Apply migrations

# Frontend
cd VinhKhanh-Explorer
npm install                     # Install dependencies
npm run dev                     # Start dev server
npm run typecheck               # TypeScript check
npm run lint                    # ESLint check
npm run build                   # Production build
```

## Parallel execution guide

Agents có thể chạy song song khi task không có dependency lẫn nhau:

- **P1.T1** (Backend scaffold) + **P1.T3** (Frontend foundation) → chạy đồng thời
- **P2.T1** (POI API) + **P2.T2** (Translation + QR API) → chạy đồng thời
- **P3.T1** (Maps) + **P3.T2** (Geofence) + **P3.T3** (Narration) → chạy đồng thời
- **P7.T1** (Backend tests) + **P7.T2** (Frontend tests) → chạy đồng thời
