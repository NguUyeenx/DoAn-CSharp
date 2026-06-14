# Frontend Implementation Plan — VinhKhanh Food Explorer

Xây dựng giao diện frontend cho ứng dụng du lịch ẩm thực Vĩnh Khánh, hỗ trợ khách du lịch nước ngoài khám phá các địa điểm ăn uống qua bản đồ tương tác.

## User Review Required

> [!IMPORTANT]
> **Mapbox Access Token**: Bạn cần có Mapbox access token. Nếu chưa có, đăng ký tại [mapbox.com](https://www.mapbox.com/) (miễn phí 50,000 map loads/tháng).

> [!IMPORTANT]
> **Backend API**: Plan này giả định backend đang chạy tại `http://localhost:5062`. Frontend sẽ proxy qua Vite dev server.

---

## Design Direction

### Aesthetic: "Street Food Festival"
Lấy cảm hứng từ không khí lễ hội ẩm thực đường phố Việt Nam — sống động, vui vẻ, đầy năng lượng.

### Color Palette

```
Primary:        oklch(0.65 0.24 30)    → #E8523A  — Đỏ cam cay nồng (ớt)
Primary Light:  oklch(0.80 0.16 30)    → #F09A88  — Highlight nhẹ
Secondary:      oklch(0.75 0.18 85)    → #C9A834  — Vàng nghệ (turmeric)
Secondary Light:oklch(0.88 0.10 85)    → #E8D78A  — Accent nhẹ
Accent:         oklch(0.60 0.20 160)   → #1AAD6E  — Xanh lá rau thơm (herbs)
Accent Light:   oklch(0.82 0.12 160)   → #8DD5A8  — Soft green

Surface:        oklch(0.97 0.005 85)   → #F7F5F0  — Kem nhẹ (nền chính light)
Surface Alt:    oklch(0.94 0.01 85)    → #EDE9E0  — Nền phụ
Card:           oklch(0.99 0.002 85)   → #FEFDFB  — Card background
Text Primary:   oklch(0.22 0.02 50)    → #2D2520  — Nâu đậm (gần đen, không thuần đen)
Text Secondary: oklch(0.45 0.03 50)    → #6B5E54  — Nâu trung
Text Muted:     oklch(0.60 0.02 50)    → #8E8078  — Nâu nhạt
Border:         oklch(0.88 0.01 50)    → #DDD5CC  — Viền nhẹ
Warning:        oklch(0.78 0.15 75)    → #D4A72C  — Vàng cam cảnh báo (warning states)

--- Dark Mode ---
Dark Surface:       oklch(0.18 0.02 50)  → #1E1A17  — Nền tối ấm
Dark Surface Alt:   oklch(0.22 0.02 50)  → #2D2520  — Nền phụ tối
Dark Card:          oklch(0.25 0.02 50)  → #342E28  — Card tối
Dark Text Primary:  oklch(0.92 0.01 50)  → #EDE5DD  — Text sáng
Dark Text Secondary:oklch(0.72 0.02 50)  → #B0A498  — Text phụ
Dark Border:        oklch(0.32 0.02 50)  → #443C35  — Viền tối
```

**Tại sao chọn palette này:**
- **Đỏ cam (ớt)** = năng lượng, ẩm thực Việt, thu hút click
- **Vàng nghệ** = ấm áp, truyền thống, menu/tag highlight
- **Xanh lá (herbs)** = tươi mát, balance, success states
- **Nền kem** = ấm, mềm mại, không chói như trắng thuần — KHÔNG dùng `#fff`
- **Text nâu đậm** = dễ đọc, ấm áp hơn đen thuần — KHÔNG dùng `#000`

### Typography

```
Display:  "Outfit" (600-800) — Headings, hero text. Geometric, hiện đại, đặc trưng.
Body:     "Source Sans 3" (400-600) — Body text, descriptions. Dễ đọc, humanist.
Mono:     "JetBrains Mono" (admin code/data) — Chỉ dùng trong admin panel cho data tables.
```

**Lưu ý:** Tất cả fonts sử dụng `font-display: swap` để tránh FOIT (Flash of Invisible Text).

**Type Scale** (fluid sizing):
```css
--text-xs:   clamp(0.70rem, 0.65rem + 0.25vw, 0.75rem);
--text-sm:   clamp(0.80rem, 0.75rem + 0.25vw, 0.875rem);
--text-base: clamp(0.90rem, 0.85rem + 0.25vw, 1rem);
--text-lg:   clamp(1.05rem, 0.95rem + 0.5vw, 1.25rem);
--text-xl:   clamp(1.20rem, 1.05rem + 0.75vw, 1.5rem);
--text-2xl:  clamp(1.50rem, 1.20rem + 1.5vw, 2rem);
--text-3xl:  clamp(1.80rem, 1.40rem + 2vw, 2.5rem);
--text-hero: clamp(2.20rem, 1.60rem + 3vw, 3.5rem);
```

### Animation Principles
- **Entry animations**: stagger từ dưới lên, `ease-out-quart` (cubic-bezier(0.25, 1, 0.5, 1))
- **Hover/Interactive**: scale nhẹ + shadow lift, `150ms ease-out`
- **Page transitions**: crossfade + slide, `300ms ease-out-quint`
- **Map markers**: pulse animation khi selected, bounce-in khi load
- **Skeleton loading**: shimmer gradient animation thay vì spinner
- **Respect `prefers-reduced-motion`**: tắt tất cả animation cho accessibility

---

## Project Structure

```
frontend/
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker
│   ├── icons/                   # PWA icons (192, 512)
│   └── locales/
│       ├── en.json              # English translations
│       └── vi.json              # Vietnamese translations
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Router + Layout
│   ├── index.css                # Global styles, CSS variables, TailwindCSS imports
│   ├── vite-env.d.ts
│   │
│   ├── api/                     # API layer
│   │   ├── client.ts            # Axios instance, interceptors, base URL
│   │   ├── auth.ts              # Admin & Owner Auth API calls
│   │   ├── pois.ts              # POI API calls
│   │   ├── audio.ts             # Audio API calls
│   │   ├── analytics.ts         # Analytics API calls
│   │   ├── tours.ts             # Tour API calls
│   │   ├── upload.ts            # Upload API calls
│   │   ├── owner.ts             # Owner specific API calls (POI & Menu management)
│   │   ├── qr.ts                # QR scanning & generation API calls
│   │   ├── admin.ts             # Admin API calls
│   │   ├── quiz.ts              # Quiz API calls
│   │   └── translations.ts     # Translation API calls
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useLanguage.ts       # i18n hook
│   │   ├── useAuth.ts           # Auth state hook
│   │   ├── usePOIs.ts           # POI data fetching
│   │   ├── useGeolocation.ts    # Browser geolocation
│   │   ├── useAudioPlayer.ts    # Audio playback control
│   │   ├── useMapbox.ts         # Map instance management
│   │   ├── useMediaQuery.ts     # Responsive breakpoints
│   │   ├── useNotifications.ts  # Notification polling for owners
│   │   ├── useTours.ts          # Tour fetching hook
│   │   └── useQuiz.ts           # Quiz state management
│   │
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx      # Auth state provider (Admin/Owner)
│   │   ├── LanguageContext.tsx  # i18n provider
│   │   ├── ThemeContext.tsx     # Light/Dark theme provider
│   │   └── MapContext.tsx       # Shared Mapbox map instance provider
│   │
│   ├── components/              # Shared components
│   │   ├── layout/
│   │   │   ├── Header.tsx       # Top bar (logo, search, language, theme toggle)
│   │   │   ├── MobileNav.tsx    # Bottom navigation bar (mobile)
│   │   │   ├── AdminLayout.tsx  # Admin shell (sidebar + content)
│   │   │   └── OwnerLayout.tsx  # Owner shell (sidebar + content)
│   │   │
│   │   ├── map/
│   │   │   ├── MapView.tsx      # Main Mapbox map component
│   │   │   ├── POIMarker.tsx    # Custom marker component
│   │   │   ├── MarkerPopup.tsx  # Popup khi click marker
│   │   │   ├── DirectionLayer.tsx # Route line overlay
│   │   │   ├── TourLayer.tsx    # Tour stop route line overlay
│   │   │   └── UserLocation.tsx # Current user location dot
│   │   │
│   │   ├── poi/
│   │   │   ├── POICard.tsx      # Card địa điểm (trong sidebar list)
│   │   │   ├── POIDetail.tsx    # Chi tiết địa điểm (slide-up panel)
│   │   │   ├── POIGallery.tsx   # Image gallery/carousel
│   │   │   ├── AudioPlayer.tsx  # Audio player với progress bar
│   │   │   └── MenuList.tsx     # Danh sách menu items
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.tsx    # Thanh tìm kiếm
│   │   │   ├── FilterPanel.tsx  # Panel lọc category + price
│   │   │   └── SearchResults.tsx # Kết quả tìm kiếm
│   │   │
│   │   ├── quiz/
│   │   │   ├── QuizCard.tsx     # Hiển thị câu hỏi + 4 options
│   │   │   └── QuizResult.tsx   # Kết quả đúng/sai + giải thích
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Badge.tsx
│   │       ├── Skeleton.tsx     # Loading skeleton
│   │       ├── Toast.tsx        # Toast notifications
│   │       ├── Modal.tsx        # Modal (chỉ khi thật sự cần)
│   │       └── ThemeToggle.tsx  # Light/Dark toggle button
│   │
│   ├── pages/
│   │   ├── HomePage.tsx         # Bản đồ + sidebar (trang chính, có tab Tours)
│   │   ├── POIDetailPage.tsx    # Trang chi tiết (route: /place/:slug)
│   │   ├── QRScanPage.tsx       # Trang điều hướng khi quét QR (route: /qr/:code)
│   │   ├── QuizPage.tsx          # Trang quiz ẩm thực (route: /place/:slug/quiz)
│   │   │
│   │   ├── admin/
│   │   │   ├── LoginPage.tsx        # Admin login
│   │   │   ├── DashboardPage.tsx    # Thống kê tổng quan + Audit logs
│   │   │   ├── OwnerApprovalPage.tsx # Duyệt đăng ký tài khoản Owner
│   │   │   ├── POIApprovalPage.tsx   # Duyệt đăng ký địa điểm POI từ Owner
│   │   │   ├── POIListPage.tsx      # Danh sách POIs (CRUD)
│   │   │   ├── POIFormPage.tsx      # Form thêm/sửa POI
│   │   │   ├── CategoryPage.tsx     # Quản lý danh mục
│   │   │   ├── TourListPage.tsx     # Quản lý danh sách Tours
│   │   │   ├── TourFormPage.tsx     # Form thêm/sửa Tour và stops
│   │   │   ├── QRListPage.tsx       # Quản lý & in mã QR cho các POI
│   │   │   ├── AudioListPage.tsx    # Quản lý danh sách Audio và tái tạo TTS
│   │   │   ├── QuizManagePage.tsx   # Quản lý câu hỏi Quiz cho các POI
│   │   │   └── LanguagePage.tsx     # Quản lý ngôn ngữ hệ thống
│   │   │
│   │   └── owner/
│   │       ├── LoginPage.tsx        # Đăng nhập Owner
│   │       ├── RegisterPage.tsx     # Đăng ký tài khoản Owner (pending)
│   │       ├── DashboardPage.tsx    # Báo cáo lượt truy cập POI của mình
│   │       ├── POIListPage.tsx      # Danh sách POI tự quản lý
│   │       ├── POIFormPage.tsx      # Form đăng ký/sửa POI của Owner
│   │       ├── MenuListPage.tsx     # Quản lý menu món ăn (CRUD + availability)
│   │       └── NotificationListPage.tsx # Xem thông báo duyệt duyệt tài khoản/POI
│   │
│   ├── i18n/
│   │   └── index.ts             # i18n setup (react-i18next)
│   │
│   ├── types/
│   │   ├── poi.ts               # POI type definitions
│   │   ├── auth.ts              # Auth types
│   │   └── api.ts               # API response types
│   │
│   └── utils/
│       ├── constants.ts         # Mapbox token, API URL, etc.
│       ├── format.ts            # Price formatter, date formatter
│       └── cn.ts                # ClassName merge utility (clsx + twMerge)
│
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── package.json
```

---

## Proposed Changes

### Component 1: Project Scaffolding

#### [NEW] `frontend/` — Vite + React + TypeScript project

1. Khởi tạo project Vite với React + TypeScript template
2. Cài đặt dependencies:
   - **Core**: `react-router-dom`, `axios`
   - **Map**: `mapbox-gl`, `@mapbox/mapbox-gl-directions`
   - **i18n**: `react-i18next`, `i18next`, `i18next-browser-languagedetector`
   - **Styling**: `tailwindcss`, `@tailwindcss/vite`, `clsx`, `tailwind-merge`
   - **Icons**: `lucide-react`
   - **PWA**: `vite-plugin-pwa`
   - **Utilities**: `date-fns`
   - **Gesture**: `@use-gesture/react` (cho mobile bottom sheet spring physics drag)
   - **Dev**: `eslint`, `@eslint/js`, `typescript-eslint` (lint kiểm tra)

#### [NEW] `vite.config.ts`
- Dev server proxy `/api` → `http://localhost:5062`
- PWA plugin config
- Path aliases (`@/` → `src/`)

#### [NEW] `tailwind.config.ts`
- Custom color tokens từ palette ở trên
- Custom font families (Outfit, Source Sans 3)
- Custom spacing scale
- Custom animation keyframes (slide-up, fade-in, shimmer, pulse-ring)
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Dark mode: `class` strategy

---

### Component 2: Design System & Global Styles

#### [NEW] `src/index.css`
- Import Tailwind layers (`@tailwind base/components/utilities`)
- Google Fonts import (Outfit, Source Sans 3)
- CSS custom properties cho toàn bộ color palette (hỗ trợ `light-dark()`)
- Fluid type scale variables
- Mapbox GL CSS import override (custom popup styles)
- Global transitions & reduced motion media query
- Scrollbar styling (thin, custom colors)
- Selection color styling

#### [NEW] `src/utils/cn.ts`
- `cn()` utility = `twMerge(clsx(...inputs))` — merge TailwindCSS classes

---

### Component 3: Contexts & Providers

#### [NEW] `src/contexts/ThemeContext.tsx`
- `ThemeProvider` wraps app
- Reads `prefers-color-scheme` as default
- Persists choice to `localStorage`
- Toggles `dark` class on `<html>`

#### [NEW] `src/contexts/LanguageContext.tsx`
- Wraps `react-i18next` provider
- Default: detect from browser, fallback `en`
- Supported: `vi`, `en`
- Language selection persists to `localStorage`

#### [NEW] `src/contexts/AuthContext.tsx`
- Hỗ trợ cả Admin và Owner auth state (token, role: "admin" | "owner", isAuthenticated, user/owner profile)
- Login/logout functions cho Admin và Owner riêng biệt
- Register function cho Owner (`api/auth/register`)
- Token refresh logic tự động lưu trữ và xoay vòng Refresh Token
- Persists JWT và Role to `localStorage`

#### [NEW] `src/contexts/MapContext.tsx`
- Quản lý shared Mapbox map instance giữa các component (HomePage, TourLayer, DirectionLayer)
- Cung cấp `mapRef` để các component con truy cập map instance mà không cần prop drilling
- Xử lý cleanup khi unmount

---

### Component 4: API Layer

#### [NEW] `src/api/client.ts`
- Axios instance với `baseURL: '/api'`
- Request interceptor: tự động attach JWT token từ localStorage vào header Authorization (Bearer token)
- Response interceptor: 401 → attempt refresh → redirect to corresponding login page (Admin login vs Owner login)

#### [NEW] `src/api/pois.ts`
- `getPOIs(params)` → GET `/pois?category=&q=&lang=`
- `getPOIById(id, lang)` → GET `/pois/{id}?lang=`
- `getPOIBySlug(slug, lang)` → GET `/pois/slug/{slug}?lang=`
- `searchPOIs(q, lang)` → GET `/pois/search?q=&lang=`
- `getNearbyPOIs(lat, lng, r, lang)` → GET `/pois/nearby?lat=&lng=&r=&lang=`
- `getPOIImages(poiId)` → GET `/pois/{id}/images`
- `getPOIMenu(poiId, lang)` → GET `/pois/{poiId}/menu?lang=`

#### [NEW] `src/api/auth.ts`
- `ownerRegister(dto)` → POST `/auth/register` (đăng ký Owner, chờ duyệt)
- `ownerLogin(dto)` → POST `/auth/login` (đăng nhập Owner)
- `adminLogin(credentials)` → POST `/auth/admin/login`
- `refreshToken(token)` → POST `/auth/refresh`
- `changePassword(dto)` → PUT `/auth/change-password`
- `updateProfile(dto)` → PUT `/auth/profile`

#### [NEW] `src/api/owner.ts`
- `getMyPOIs(lang)` → GET `/owner/pois?lang=`
- `getMyPOI(id, lang)` → GET `/owner/pois/{id}?lang=`
- `createPOI(dto)` → POST `/owner/pois` (đăng ký địa điểm mới ở trạng thái pending)
- `updatePOI(id, dto)` → PUT `/owner/pois/{id}`
- `createMenuItem(dto)` → POST `/owner/menu-items`
- `updateMenuItem(id, dto)` → PUT `/owner/menu-items/{id}`
- `deleteMenuItem(id)` → DELETE `/owner/menu-items/{id}`
- `toggleMenuAvailability(id, isAvailable)` → PUT `/owner/menu-items/{id}/availability`
- `addPOIImages(poiId, urls)` → POST `/owner/pois/{poiId}/images`
- `deletePOIImage(poiId, imageId)` → DELETE `/owner/pois/{poiId}/images/{imageId}`
- `setCoverImage(poiId, imageId)` → PUT `/owner/pois/{poiId}/cover-image`
- `reorderPOIImages(poiId, orders)` → PUT `/owner/pois/{poiId}/images/reorder`
- `getOwnerDashboard()` → GET `/owner/dashboard`
- `getOwnerDashboardCharts()` → GET `/owner/dashboard/charts`
- `getNotifications()` → GET `/notifications`
- `markNotificationRead(id)` → PUT `/notifications/{id}/read`
- `getUnreadCount()` → GET `/notifications/unread-count`

#### [NEW] `src/api/qr.ts`
- `scanQRCode(code, sessionId, lang)` → GET `/qr/{code}?sessionId=&lang=` (Quét mã QR - trả về thông tin POI và ghi nhận log)
- `adminGenerateQR(poiId)` → POST `/admin/pois/{poiId}/generate-qr`
- `adminGetPOIQR(poiId)` → GET `/admin/pois/{poiId}/qr`
- `adminGetAllQR()` → GET `/admin/qr`
- `adminToggleQRStatus(id, isActive)` → PUT `/admin/qr/{id}/status`

#### [NEW] `src/api/audio.ts`
- `getAudioUrl(text, lang, poiId)` → GET `/audio/generate?text=&lang=&poiId=`

#### [NEW] `src/api/analytics.ts`
- `logVisit(data)` → POST `/analytics/visit`
- `getDashboard()` → GET `/analytics/dashboard`

#### [NEW] `src/api/admin.ts`
- `getAdminDashboard()` → GET `/analytics/dashboard`
- **Owner Management:**
  - `getPendingOwners()` → GET `/admin/owners/pending`
  - `approveOwner(id)` → PUT `/admin/owners/{id}/approve`
  - `rejectOwner(id, reason)` → PUT `/admin/owners/{id}/reject`
- **POI Management:**
  - `getAdminPOIs(params)` → GET `/pois` (admin view — dùng chung public endpoint)
  - `createPOI(dto)` → POST `/pois`
  - `updatePOI(id, dto)` → PUT `/pois/{id}`
  - `deletePOI(id)` → DELETE `/pois/{id}`
  - `restorePOI(id)` → POST `/pois/{id}/restore`
  - `getPendingPOIs()` → GET `/admin/pois/pending`
  - `updatePOIStatus(id, status)` → PUT `/admin/pois/{id}/status`
- **Category Management:**
  - `getCategories()` → GET `/admin/languages` *(xem lưu ý bên dưới)*
  > ⚠️ **Backend chưa có CategoryController.** Entity `POICategory` tồn tại nhưng không có API CRUD. Cần bổ sung backend trước khi implement CategoryPage. Tạm thời frontend sẽ đọc categories từ POI response.
- **Audio Management:**
  - `getAudioFiles()` → GET `/admin/audio`
  - `deleteAudioFile(id)` → DELETE `/admin/audio/{id}`
  - `regenerateAudio(id)` → POST `/admin/audio/{id}/regenerate`
- **Audit Logs:**
  - `getAuditLogs()` → GET `/admin/audit-logs`
- **Language Management:**
  - `getLanguages()` → GET `/admin/languages`
  - `toggleLanguageStatus(code, isActive)` → PUT `/admin/languages/{code}/status`
  - `setDefaultLanguage(code)` → PUT `/admin/languages/{code}/default`
- **Quiz Management:**
  - `createQuiz(dto)` → POST `/admin/quiz`
  - `updateQuiz(id, dto)` → PUT `/admin/quiz/{id}`
  - `deleteQuiz(id)` → DELETE `/admin/quiz/{id}`

#### [NEW] `src/api/tours.ts`
- `getTours(lang)` → GET `/tours?lang=`
- `getTourById(id, lang)` → GET `/tours/{id}?lang=`
- `adminCreateTour(dto)` → POST `/admin/tours`
- `adminUpdateTour(id, dto)` → PUT `/admin/tours/{id}`
- `adminDeleteTour(id)` → DELETE `/admin/tours/{id}`
- `adminAddTourStop(tourId, dto)` → POST `/admin/tours/{tourId}/stops`
- `adminRemoveTourStop(tourId, poiId)` → DELETE `/admin/tours/{tourId}/stops/{poiId}`
- `adminReorderTourStops(tourId, orders)` → PUT `/admin/tours/{tourId}/stops/reorder`

#### [NEW] `src/api/quiz.ts`
- `getQuiz(poiId, lang)` → GET `/pois/{poiId}/quiz?lang=`
- `submitQuizAnswer(dto, lang)` → POST `/quiz/submit?lang=`

#### [NEW] `src/api/translations.ts`
- `getTranslation(poiId, lang)` → GET `/translations/{poiId}/{lang}`
- `createTranslation(dto)` → POST `/translations` (Admin only)

---

### Component 5: Public Pages — Map Home (Trang chủ)

#### [NEW] `src/pages/HomePage.tsx`

Layout chính — chiếm toàn bộ viewport:

```
┌─────────────────────────────────────────────────┐
│  Header (logo, search, lang toggle, theme)      │
├──────────────┬──────────────────────────────────┤
│              │                                   │
│   Sidebar    │        Mapbox Map                 │
│  (POI List)  │     (full height)                 │
│              │                                   │
│  - Search    │   [markers]                       │
│  - Filters   │                                   │
│  - Cards     │        [user location]            │
│              │                                   │
│              │                                   │
├──────────────┴──────────────────────────────────┤
│  Mobile Bottom Nav (chỉ mobile)                  │
└─────────────────────────────────────────────────┘
```

**Desktop** (≥ 1024px):
- Sidebar bên trái (380px) với danh sách POI cards, scrollable
- Map chiếm phần còn lại bên phải
- Sidebar có thể collapse (thu gọn) bằng nút kéo

**Tablet** (768px - 1023px):
- Sidebar dạng drawer overlay từ trái
- Map full width
- FAB button để mở sidebar

**Mobile** (< 768px):
- Map full screen
- POI list = bottom sheet kéo lên (3 trạng thái: peek/half/full)
- Bottom navigation bar cố định

**Tính năng:**
- Markers với custom icon (biểu tượng tô ẩm thực)
- Click marker → popup nhanh (tên + ảnh + "Xem chi tiết")
- Click "Xem chi tiết" → navigate đến `/place/:slug`
- Nút "Vị trí của tôi" → fly to user location
- Filter chips phía trên list (category tags)
- Search bar live filter
- Staggered load animation cho POI cards

**Animations:**
- POI cards: stagger slide-up khi load, `ease-out-quart`, delay 50ms mỗi card
- Marker: scale-in bounce khi appear trên map
- Selected marker: pulse ring animation
- Sidebar: slide-in `350ms ease-out-quint`
- Bottom sheet (mobile): spring physics drag gesture

---

### Component 6: POI Detail Page

#### [NEW] `src/pages/POIDetailPage.tsx`

Route: `/place/:slug`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  ← Back   |   Place Name   |   🔊  Share       │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │        Hero Image Gallery                  │  │
│  │        (swipeable carousel)                │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  Place Name (h1)           Category Badge        │
│  📍 Address                                      │
│  💰 Price Range                                  │
│                                                  │
│  ─── Audio Player ──────────────────────────    │
│  │ ▶️ | ████████░░░░ 2:34 / 5:00 |  🔈  │    │
│  ────────────────────────────────────────────    │
│                                                  │
│  Description (expandable)                        │
│                                                  │
│  🍜 Menu Items                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ Item 1 │ │ Item 2 │ │ Item 3 │               │
│  │ 35k VND│ │ 45k VND│ │ 50k VND│               │
│  └────────┘ └────────┘ └────────┘               │
│                                                  │
│  Mini Map (Mapbox static/interactive)            │
│  [Get Directions Button]                         │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Tính năng:**
- Image gallery: swipe horizontal, dots indicator, pinch-to-zoom
- Audio player: play/pause/stop, progress bar draggable, duration display
- Description: truncated default, "Read more" expand with smooth height animation
- Menu items: horizontal scroll cards, giá format VND
- Mini map: hiện vị trí POI, click → mở directions
- Get Directions: sử dụng Mapbox Directions API, hiện route trên map
- Share button: Web Share API (mobile) hoặc copy link (desktop)

**Animations:**
- Hero image: fade-in on load
- Content sections: stagger reveal khi scroll vào viewport (IntersectionObserver)
- Audio player: waveform-style progress animation
- "Read more": `grid-template-rows` transition (0fr → 1fr)

---

### Component 7: Admin Pages

#### [NEW] `src/pages/admin/LoginPage.tsx`
- Form đơn giản: username + password
- Branded design nhưng tối giản
- Error toast khi sai credentials
- Redirect sau login thành công

#### [NEW] `src/pages/admin/DashboardPage.tsx`
- Stats cards: Tổng địa điểm, Tổng lượt xem, Tổng lượt nghe audio, Tổng Owner mới đăng ký
- Charts: Lượt truy cập toàn hệ thống theo ngày (SVG line/bar chart tự vẽ)
- Popular POIs list
- Language breakdown
- Bảng nhật ký Audit Logs tóm tắt gần đây

#### [NEW] `src/pages/admin/OwnerApprovalPage.tsx`
- Bảng danh sách Owner đang chờ duyệt (`OwnerStatus == "pending"`)
- Chi tiết thông tin Owner (Username, Email, Display Name, ngày đăng ký)
- Tương tác: Bấm Approve (Duyệt tài khoản) hoặc Reject (Từ chối, mở popup nhập lý do và lưu vào `AdminNote`)

#### [NEW] `src/pages/admin/POIApprovalPage.tsx`
- Bảng danh sách địa điểm do Owner đăng ký chờ duyệt (`ApprovalStatus == "pending"`)
- Xem trước chi tiết thông tin POI do Owner điền (tọa độ, hình ảnh, mô tả, menu)
- Tương tác: Duyệt (`status = approved`) hoặc Từ chối (`status = rejected`)

#### [NEW] `src/pages/admin/POIListPage.tsx`
- Table danh sách POI (bao gồm cả POI của Admin tạo và POI của các Owner)
- Columns: Tên, Category, Owner, Approval Status, Lượt xem, Actions (Edit/Delete)
- Search + Filter theo danh mục & trạng thái phê duyệt
- Pagination
- Khôi phục địa điểm đã bị xóa mềm (`/restore`)

#### [NEW] `src/pages/admin/POIFormPage.tsx`
- Form tạo/sửa POI
- Map picker cho Latitude/Longitude (Click chọn vị trí trực quan trên Mapbox)
- Image upload với preview (Drag-and-drop, upload thông qua `api/upload`)
- Quản lý hình ảnh: chọn cover image, kéo thả/sắp xếp thứ tự ảnh
- Form validation với error messages inline tiếng Việt/tiếng Anh

#### [NEW] `src/pages/admin/CategoryPage.tsx`
- Danh sách categories (tên, icon class, mã màu)
- Thêm mới danh mục nhanh
- Inline edit trực tiếp trên dòng

> ⚠️ **Yêu cầu backend:** Hiện tại backend CHƯA có CategoryController. Cần bổ sung API CRUD cho `POICategory` entity trước khi implement trang này. Nếu backend không kịp bổ sung, tạm thời hiển thị read-only danh sách categories lấy từ POI response.

#### [NEW] `src/pages/admin/LanguagePage.tsx`
- Bảng danh sách ngôn ngữ hệ thống (code, name, native name, trạng thái)
- Toggle bật/tắt ngôn ngữ (`PUT /admin/languages/{code}/status`)
- Đặt ngôn ngữ mặc định (`PUT /admin/languages/{code}/default`)

#### [NEW] `src/pages/admin/QuizManagePage.tsx`
- Bảng danh sách câu hỏi Quiz theo từng POI
- Form CRUD câu hỏi: nội dung câu hỏi, 4 đáp án (A-D), đáp án đúng, giải thích
- Hỗ trợ đa ngôn ngữ (QuizQuestionTranslation)

#### [NEW] `src/pages/admin/TourListPage.tsx` & `TourFormPage.tsx`
- Danh sách Tours của hệ thống, trạng thái (Active/Inactive)
- Form CRUD Tour (tên tour, mô tả, ảnh cover)
- Giao diện quản lý điểm dừng (Stops Manager):
  - Hiển thị danh sách các POI thuộc Tour theo thứ tự (`StopOrder`)
  - Thêm điểm dừng bằng cách chọn POI từ dropdown, nhập ghi chú chuyển tiếp (`TransitionNote`)
  - Kéo thả sắp xếp lại thứ tự điểm dừng
  - Xóa điểm dừng khỏi Tour

#### [NEW] `src/pages/admin/QRListPage.tsx`
- Bảng quản lý mã QR trên hệ thống
- Tương tác: Chọn POI -> Bấm "Tạo mã QR" -> Backend sinh mã QR code ngẫu nhiên -> Hiển thị QR Image
- Cho phép hiển thị số lượt quét QR (`ScanCount`) của từng địa điểm
- Nút Tải xuống (Download QR) dạng file ảnh để in ấn và nút đổi trạng thái Active/Inactive mã QR

#### [NEW] `src/pages/admin/AudioListPage.tsx` & `SystemLogsPage.tsx`
- Quản lý danh sách file Audio đã được hệ thống tự động sinh bằng TTS
- Bấm "Tái tạo" (Regenerate) để gọi API dịch giọng nói lại khi thông tin POI thay đổi
- Trang xem nhật ký hệ thống toàn cục (Audit Logs) để theo dõi các hành vi thay đổi dữ liệu của các Admin/Owner

**Admin Layout:**
```
┌──────────┬──────────────────────────────────────┐
│          │  Header (Admin name, Logout)         │
│ Sidebar  ├──────────────────────────────────────┤
│          │                                      │
│ Dashboard│         Page Content                 │
│ Owners   │                                      │
│ POIs     │                                      │
│ Category │                                      │
│ Tours    │                                      │
│ Quiz     │                                      │
│ QR Code  │                                      │
│ Audios   │                                      │
│ Language │                                      │
│ AuditLog │                                      │
│ ──────── │                                      │
│ Logout   │                                      │
└──────────┴──────────────────────────────────────┘
```

Mobile admin: sidebar → hamburger menu overlay

---

### Component 8: Shared Components

#### [NEW] `src/components/ui/Button.tsx`
- Variants: `primary`, `secondary`, `ghost`, `danger`
- Sizes: `sm`, `md`, `lg`
- Loading state (spinner)
- Icon support (left/right)

#### [NEW] `src/components/ui/Input.tsx`
- Text, search, password variants
- Error state styling
- Label + helper text

#### [NEW] `src/components/ui/Badge.tsx`
- Category badges (colored dot + text)
- Price range badge
- Status badge (active/inactive)

#### [NEW] `src/components/ui/Skeleton.tsx`
- Shimmer animation loading placeholder
- Variants: text line, card, image, circle

#### [NEW] `src/components/ui/Toast.tsx`
- Success/Error/Info variants
- Auto-dismiss với progress bar
- Slide-in từ top-right (desktop) hoặc top (mobile)

#### [NEW] `src/components/layout/Header.tsx`
- Logo + app name
- Search bar (desktop: inline, mobile: expandable)
- Language toggle (VI/EN dropdown)
- Theme toggle (sun/moon icon)

#### [NEW] `src/components/layout/MobileNav.tsx`
- Bottom tab bar: Map | List | Tours | More
- Active tab indicator animation (sliding underline)
- Safe area padding cho notch devices

#### [NEW] `src/components/map/MapView.tsx`
- Mapbox GL JS initialization
- Custom map style (light-mode friendly)
- Cluster markers khi zoom out
- GeolocateControl (nút vị trí hiện tại)
- NavigationControl (zoom buttons)

#### [NEW] `src/components/poi/AudioPlayer.tsx`
- Custom HTML5 audio controls
- Progress bar: click/drag to seek
- Time display: current / total
- Volume control (desktop)
- Play/Pause/Stop buttons
- Waveform-style visualization (CSS art, không cần thư viện)

---

### Component 9: i18n (Đa ngôn ngữ)

#### [NEW] `public/locales/en.json`
Toàn bộ UI text bằng tiếng Anh:
- Navigation labels
- Search placeholder
- Filter labels
- POI detail labels (address, price range, description, menu)
- Audio player controls
- Admin panel text
- Error messages

#### [NEW] `public/locales/vi.json`
Tương tự file EN nhưng bằng tiếng Việt.

#### [NEW] `src/i18n/index.ts`
- react-i18next setup
- Auto-detect browser language
- Lazy load translation files
- Fallback: `en`

---

### Component 10: PWA Setup

#### [NEW] `public/manifest.json`
```json
{
  "name": "VinhKhanh Food Explorer",
  "short_name": "VK Food",
  "description": "Explore street food in Vinh Khanh",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F7F5F0",
  "theme_color": "#E8523A",
  "icons": [...]
}
```

#### [NEW] `vite.config.ts` — VitePWA plugin
- Auto-generate service worker
- Cache: CSS, JS, fonts, translation JSON
- Network-first for API calls
- Offline fallback page

---

### Component 11: Routing

#### [NEW] `src/App.tsx`

```
Routes:
/                        → HomePage (Map + Sidebar)
/place/:slug             → POIDetailPage
/qr/:code                → QRScanPage (Xử lý quét QR)
/place/:slug/quiz        → QuizPage (Trắc nghiệm ẩm thực)

/admin/login             → Admin LoginPage
/admin                   → Admin DashboardPage (protected)
/admin/owners/pending    → Admin OwnerApprovalPage (protected)
/admin/pois/pending      → Admin POIApprovalPage (protected)
/admin/pois              → Admin POIListPage (protected)
/admin/pois/new          → Admin POIFormPage (protected - Create)
/admin/pois/:id/edit     → Admin POIFormPage (protected - Edit)
/admin/categories        → Admin CategoryPage (protected)
/admin/tours             → Admin TourListPage (protected)
/admin/tours/new         → Admin TourFormPage (protected - Create)
/admin/tours/:id/edit    → Admin TourFormPage (protected - Edit)
/admin/qr                → Admin QRListPage (protected)
/admin/audios            → Admin AudioListPage (protected)
/admin/quiz              → Admin QuizManagePage (protected)
/admin/languages         → Admin LanguagePage (protected)

/owner/login             → Owner LoginPage
/owner/register          → Owner RegisterPage
/owner                   → Owner DashboardPage (protected)
/owner/pois              → Owner POIListPage (protected)
/owner/pois/new          → Owner POIFormPage (protected - Create)
/owner/pois/:id/edit     → Owner POIFormPage (protected - Edit)
/owner/pois/:id/menu     → Owner MenuListPage (protected)
/owner/notifications     → Owner NotificationListPage (protected)
```

- `ProtectedRoute` wrapper cho admin routes (yêu cầu role: "admin") và owner routes (yêu cầu role: "owner")
- Lazy loading (`React.lazy`) cho tất cả các trang Admin & Owner (code split giảm size bundle chính)
- Animated route transitions (fade + slide) khi chuyển trang bằng React Router và CSS Transitions

---

### Component 12: Store Owner Panel (Kênh đối tác/chủ quán)

#### [NEW] `src/components/layout/OwnerLayout.tsx`
- Sidebar shell cho Owner chứa: Dashboard, Địa điểm của tôi, Thông báo, Profile, Đăng xuất
- Responsive: tự động thu gọn thành hamburger menu trên thiết bị di động
- Hiển thị badge số lượng thông báo chưa đọc của Owner

#### [NEW] `src/pages/owner/LoginPage.tsx` & `RegisterPage.tsx`
- Trang Đăng ký (`RegisterPage.tsx`): Form nhập username, email, mật khẩu, display name để đăng ký làm đối tác Owner. Sau khi gửi, tài khoản có trạng thái `pending` chờ Admin duyệt. Hiển thị thông báo hướng dẫn rõ ràng.
- Trang Đăng nhập (`LoginPage.tsx`): Nhập tài khoản, gọi API `/auth/login` kiểm tra JWT. Nếu tài khoản chưa được duyệt (`pending`), hiển thị cảnh báo "Tài khoản đang chờ duyệt từ hệ thống". Nếu đã được duyệt (`approved`), lưu token và chuyển hướng tới `/owner`.

#### [NEW] `src/pages/owner/DashboardPage.tsx`
- Thẻ thống kê: Tổng số POI sở hữu, Tổng lượt xem địa điểm, Lượt nghe audio và Lượt quét QR của khách du lịch
- Biểu đồ: Lượt ghé thăm POI theo ngày vẽ bằng SVG line chart (không dùng thư viện ngoài) lấy dữ liệu từ `api/owner/dashboard/charts`

#### [NEW] `src/pages/owner/POIListPage.tsx` & `POIFormPage.tsx`
- Danh sách địa điểm do Owner tự quản lý, hiển thị trạng thái phê duyệt (Pending/Approved/Rejected)
- Form đăng ký địa điểm mới: Nhập tên quán, địa chỉ, khoảng giá, mô tả. Có tích hợp Map Picker để Owner tự chấm tọa độ trên Mapbox
- Form chỉnh sửa thông tin địa điểm: Cập nhật thông tin chi tiết
- Quản lý hình ảnh POI:
  - Chọn ảnh cover, reorder (sắp xếp lại thứ tự hiển thị bằng cách kéo thả)
  - Upload ảnh thông qua API upload chung

#### [NEW] `src/pages/owner/MenuListPage.tsx`
- Quản lý thực đơn (menu món ăn) đi kèm với từng POI
- Form CRUD món ăn: tên món, giá (VND), ảnh món ăn, mô tả ngắn
- Switch tương tác nhanh bật/tắt trạng thái món ăn: "Còn hàng" (Available) / "Hết hàng" (Unavailable) mà không cần vào màn hình sửa

#### [NEW] `src/pages/owner/NotificationListPage.tsx`
- Danh sách thông báo gửi riêng cho Owner (ví dụ: "Địa điểm X đã được Admin phê duyệt", "Tài khoản Owner của bạn đã được kích hoạt")
- Click vào thông báo để gọi API đánh dấu đã đọc (`/read`), tự động cập nhật số lượng badge thông báo trên Sidebar

---

### Component 13: QR Scan Redirect Page (Điều hướng quét mã QR)

#### [NEW] `src/pages/QRScanPage.tsx`
- Route: `/qr/:code`
- Khi khách du lịch quét mã QR dán tại quán bằng điện thoại, trình duyệt sẽ truy cập thẳng vào đường dẫn này
- Component thực hiện:
  1. Hiển thị màn hình chờ (Loading) đẹp mắt mang phong cách Street Food (icon xoay nhẹ, thông báo "Đang chuẩn bị thông tin ẩm thực cho bạn...")
  2. Tự động lấy hoặc sinh ngẫu nhiên `sessionId` lưu vào sessionStorage để định danh thiết bị
  3. Gọi API `GET /api/qr/{code}?sessionId={sessionId}&lang={currentLang}`
  4. Backend tăng số lần quét (`ScanCount`), ghi nhận analytics với `triggerType: "qr"` và trả về dữ liệu POI
  5. Frontend lưu thông tin, ngay lập tức điều hướng (redirect) người dùng sang trang chi tiết địa điểm `/place/:slug`
  6. Nếu mã QR không tồn tại hoặc hết hiệu lực, hiển thị giao diện báo lỗi thân thiện kèm nút quay về Bản đồ chính

---

### Component 14: Lộ trình du lịch (Tours Feature)

#### [NEW] `src/components/map/TourLayer.tsx`
- Lớp vẽ lộ trình tour bằng Mapbox GL JS Source & Layer (`line` type) nối liền tọa độ các Stop của tour theo thứ tự `StopOrder`
- Hiển thị các marker stop dạng chấm tròn có số thứ tự từ `1` đến `N` thay vì marker POI thông thường để biểu diễn chuỗi hành trình

#### [NEW] Giao diện Tour bên phía Khách du lịch (trong `HomePage.tsx`)
- Sidebar bổ sung tab "Tours" hiển thị danh sách các tour ẩm thực có sẵn (ví dụ: "Bản đồ ốc Vĩnh Khánh", "Hành trình các món cay nồng")
- Click chọn một Tour:
  - Vẽ lộ trình tour lên bản đồ qua `TourLayer` và di chuyển camera bao quát toàn bộ lộ trình
  - Sidebar hiển thị danh sách các điểm dừng theo dạng timeline thứ tự từ trên xuống dưới
  - Mỗi điểm dừng hiển thị thông tin tóm tắt và `TransitionNote` (ví dụ: "Đi bộ 50m sang ngã tư tiếp theo...")
  - Click điểm dừng trên timeline sẽ mở popup POI tương ứng trên bản đồ và chạy file thuyết minh audio giới thiệu về điểm dừng đó

---

### Component 15: Quiz / Gamification (Trắc nghiệm ẩm thực)

#### [NEW] `src/pages/QuizPage.tsx`

Route: `/place/:slug/quiz`

**Layout:**
- Hero section nhỏ: tên POI + ảnh thumbnail
- Danh sách câu hỏi quiz liên quan đến POI (ví dụ: "Món ốc nào nổi tiếng nhất khu Vĩnh Khánh?")
- Mỗi câu hỏi hiển thị 4 lựa chọn (A-D)
- Click chọn → hiệu ứng đúng (xanh pulse) / sai (đỏ shake) + hiển thị giải thích
- Kết thúc quiz → hiển thị điểm số + khuyến khích chia sẻ

**Tính năng:**
- Fetch quiz từ API `GET /pois/{poiId}/quiz?lang=`
- Submit answer qua `POST /quiz/submit?lang=`
- Hiển thị kết quả ngay lập tức (không cần chờ server xác nhận)
- Nút "🎮 Thử thách kiến thức" trên POIDetailPage dẫn tới trang này

**Animations:**
- Câu hỏi: slide-in từ phải, stagger 100ms
- Chọn đáp án: scale-in feedback animation
- Đúng: confetti burst nhẹ (CSS particles)
- Sai: shake + red flash

#### [NEW] `src/components/quiz/QuizCard.tsx`
- Hiển thị 1 câu hỏi + 4 options dạng card
- Click option → disable các option khác + highlight đáp án đúng
- Progress bar (câu 1/5, 2/5...)

#### [NEW] `src/components/quiz/QuizResult.tsx`
- Hiển thị điểm tổng (ví dụ: 4/5 correct)
- Giải thích cho từng câu sai
- Nút "Quay lại địa điểm" và "Chia sẻ kết quả"

---

### Component 16: Admin Quiz & Language Management

#### [NEW] `src/pages/admin/QuizManagePage.tsx`
- Dropdown chọn POI → hiển thị danh sách câu hỏi quiz hiện có
- Form tạo/sửa câu hỏi: question text, 4 options (A-D), correct option, explanation
- Hỗ trợ song ngữ VI/EN
- Xóa câu hỏi với confirmation modal

#### [NEW] `src/pages/admin/LanguagePage.tsx`
- Bảng ngôn ngữ: Code, Tên, Tên gốc, Trạng thái (Active/Inactive), Default
- Toggle switch bật/tắt ngôn ngữ
- Nút đặt làm ngôn ngữ mặc định
- Thao tác nhẹ, không cần form phức tạp

---

## Key Interaction Details

### Bản đồ tương tác (Map)
1. Load map centered tại khu vực Vĩnh Khánh (10.7537, 106.6825)
2. Fetch POIs → render markers
3. User click marker → show popup (tên + ảnh thumbnail + nút "Chi tiết")
4. Click "Chi tiết" → navigate `/place/:slug`
5. Nút "Chỉ đường" trên detail page → Mapbox Directions API → vẽ route line
6. Nút "Vị trí của tôi" → browser geolocation → fly to location

### Audio Player
1. Load audio URL từ API `/audio/generate?poiId=&lang=` hoặc dùng trực tiếp link file audio tĩnh đã được upload bởi admin/owner
2. Play: `HTMLAudioElement.play()`
3. Pause: `HTMLAudioElement.pause()`
4. Progress: `timeupdate` event → update progress bar
5. Seek: click/drag trên progress bar → `currentTime =`
6. Log play event → POST `/analytics/visit` với `triggerType: "manual"`

### Tìm kiếm & Lọc
1. Search input → debounce 300ms → GET `/pois/search?q=`
2. Category filter chips → GET `/pois?category=`
3. Kết quả cập nhật cả list lẫn markers trên map
4. Clear filter → show all POIs

### Chuyển ngôn ngữ
1. Click language toggle → thay đổi `i18next.language`
2. Tất cả UI text thay đổi ngay (react-i18next reactive)
3. Re-fetch POI data với `?lang=` mới (tên, mô tả, audio text phụ thuộc ngôn ngữ)
4. Persist choice vào localStorage

### Quét mã QR (QR Scan Handling)
1. Người dùng quét mã QR thực tế tại quán ăn dẫn tới link `/qr/:code`
2. Ứng dụng hiển thị màn hình loading nhẹ (Skeleton/Spining) với dòng chữ "Đang nhận diện địa điểm..."
3. Gọi API quét mã: `GET /api/qr/{code}?sessionId=&lang=` (tự động đính kèm SessionId trình duyệt để lưu Analytics log)
4. Backend xử lý: Ghi nhận log visit với `triggerType = "qr"`, trả về thông tin POI
5. Frontend nhận kết quả, lấy `slug` của POI và điều hướng (redirect) ngay lập tức tới `/place/:slug`

### Lộ trình du lịch (Tours Interface)
1. Chọn một Tour từ danh sách Tours công cộng trong tab "Tours"
2. Bản đồ ẩn tất cả các marker không liên quan, chỉ hiển thị marker của các điểm dừng trong Tour với số thứ tự (`StopOrder`) trực quan trên marker icon
3. Hệ thống kết nối các điểm dừng bằng một đường vẽ tuyến đường (`TourLayer` dùng Mapbox Polyline hoặc Directions API)
4. Sidebar bên trái chuyển sang danh sách các stops kèm ghi chú chuyển tiếp (`TransitionNote` - mô tả hướng đi, khoảng cách giữa các điểm)
5. Click từng stop trong danh sách → Bản đồ fly to stop đó và mở popup giới thiệu nhanh

### Trắc nghiệm ẩm thực (Quiz)
1. Từ trang chi tiết POI (`/place/:slug`), bấm nút "🎮 Thử thách kiến thức"
2. Navigate tới `/place/:slug/quiz`
3. Fetch quiz: `GET /pois/{poiId}/quiz?lang=`
4. Hiển thị từng câu hỏi lần lượt, user chọn đáp án
5. Submit: `POST /quiz/submit?lang=` → server trả kết quả đúng/sai + giải thích
6. Kết thúc quiz → hiển thị tổng điểm

---

## Open Questions

> [!NOTE]
> **Mapbox token**: Bạn đã có Mapbox access token chưa? Nếu chưa, tôi sẽ cần bạn tạo một cái trước khi triển khai.

> [!NOTE]
> **Audio source**: Backend có endpoint `GET /audio/generate?text=&lang=&poiId=` dùng TTS (OpenAI). Tuy nhiên yêu cầu ghi "Không sử dụng AI/TTS" — admin upload audio sẵn. Tôi sẽ implement audio player để play file đã upload. Nếu backend trả về URL audio file thì dùng trực tiếp.

> [!WARNING]
> **Backend CategoryController thiếu**: Plan thiết kế CategoryPage nhưng backend chưa có API CRUD cho categories. Cần bổ sung `CategoryController` với các endpoints `GET/POST/PUT/DELETE /admin/categories` trước khi implement frontend.

> [!WARNING]
> **Upload permission cho Owner**: Backend `UploadController` hiện chỉ cho phép role `admin`. Cần mở rộng để `owner` cũng có thể upload ảnh cho POI và menu items của mình.

> [!NOTE]
> **Route casing**: Một số backend routes dùng PascalCase (`api/Audio`, `api/Auth`, `api/Upload`) trong khi số khác dùng lowercase (`api/admin`, `api/pois`). Frontend spec dùng lowercase cho tất cả. Cần thống nhất trước khi deploy lên Linux (case-sensitive).

---

## Verification Plan

### Prerequisites
```bash
# Cài đặt ESLint (nếu chưa có)
npm install -D eslint @eslint/js typescript-eslint

# Thêm script vào package.json
# "lint": "eslint src/"
```

### Automated Tests
```bash
# Build check - đảm bảo không có TypeScript errors
npm run build

# Lint check
npm run lint

# Lighthouse PWA audit (CI)
npx lighthouse http://localhost:5173 --only-categories=pwa --output=json
```

### Manual Verification
1. **Responsive**: Mở trên Chrome DevTools, test các breakpoints (320px, 768px, 1024px, 1440px) cho cả trang người dùng, Admin và Owner.
2. **Dark mode**: Toggle theme, kiểm tra tất cả text đều đọc được trên nền tối ở tất cả các trang quản trị và bản đồ.
3. **Contrast**: Đảm bảo tỷ lệ tương phản đạt tiêu chuẩn WCAG, không có text nào bị trùng màu nền.
4. **i18n**: Chuyển VI ↔ EN, kiểm tra tất cả text thay đổi, re-fetch dữ liệu POI/Tour/Menu theo đúng ngôn ngữ được chọn.
5. **Map & Tours**:
   - Load markers đầy đủ trên bản đồ chính.
   - Chọn Tour từ tab Lộ Trình: kiểm tra vẽ đường nối liền `TourLayer` giữa các stops theo thứ tự, click stop trong Timeline kiểm tra Map fly-to và mở popup.
6. **Audio**: Play/pause/stop, progress bar kéo thả tua thời gian mượt mà, tải đúng file âm thanh thuyết minh tương ứng của POI.
7. **QR Scan Flow**:
   - Truy cập thủ công đường dẫn `/qr/{code}` (giả lập quét mã QR thực tế).
   - Kiểm tra màn hình loading xuất hiện, gọi API log visit, sau đó tự động chuyển hướng (Redirect) chính xác sang trang `/place/{slug}` của địa điểm.
   - Kiểm tra tham số `ScanCount` của mã QR tương ứng tăng lên 1 trên trang quản trị.
8. **Owner Flow**:
   - Đăng ký tài khoản Owner mới → kiểm tra tài khoản ở trạng thái chưa thể login do chưa được duyệt.
   - Admin Login → vào trang Owner Approval → duyệt tài khoản vừa đăng ký.
   - Đăng nhập Owner thành công → vào Dashboard xem thống kê trống.
   - Owner tạo POI mới bằng Map Picker và điền thông tin (trạng thái sẽ là pending).
   - Admin duyệt POI → kiểm tra POI xuất hiện trên Bản đồ chính của khách du lịch.
   - Owner upload ảnh, kéo thả thay đổi thứ tự ảnh cover, thêm thực đơn (menu), bật/tắt trạng thái hết hàng của món ăn.
   - Kiểm tra thông báo duyệt địa điểm gửi tới tài khoản Owner và số badge thông báo hiển thị đúng.
9. **Quiz Flow**:
   - Mở trang chi tiết POI → bấm nút "Thử thách kiến thức" → chuyển sang QuizPage.
   - Trả lời câu hỏi → kiểm tra animation đúng/sai hiển thị chính xác.
   - Hoàn thành quiz → kiểm tra điểm tổng hiển thị đúng.
   - Chuyển ngôn ngữ VI ↔ EN → kiểm tra nội dung quiz thay đổi theo ngôn ngữ.
10. **Admin Panel**:
   - Login → Xem Dashboard thống kê và nhật ký hệ thống (Audit logs).
   - Quản lý danh mục (Category CRUD), quản lý tour (Tour & Stops CRUD).
   - Tạo mã QR cho một địa điểm ẩm thực bất kỳ, tải mã QR xuống máy tính.
   - Quản lý file Audio TTS, bấm tái tạo và nghe thử.
11. **PWA**: Kiểm tra điểm số audit PWA trên Lighthouse đạt chuẩn (đáp ứng offline và cài đặt làm app được).
12. **Animation**: Đảm bảo các hiệu ứng chuyển trang, trượt Drawer, kéo drag Bottom Sheet đạt hiệu suất 60fps mượt mà, tự động tắt nếu trình duyệt kích hoạt reduced-motion.
