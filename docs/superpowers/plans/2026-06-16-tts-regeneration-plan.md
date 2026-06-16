# TTS Voice Audio Manager Popover Multi-select Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the Admin TTS Voice Audio Manager to use a popover multi-select dropdown for language selection, including quick "Select All" and "Deselect All" buttons. Also, ensure 22 system languages are seeded on backend startup.

**Architecture:** 
1. `SeedData.cs` is updated to seed all 22 system languages instead of just 2.
2. `AudioListPage.tsx` is updated to replace the inline language checkboxes with a custom Popover multi-select dropdown, containing select all / deselect all controls and a search bar.

**Tech Stack:** ASP.NET Core, React, Tailwind CSS

---

### Task 1: Update Database Seeding for 22 Languages

**Files:**
- Modify: [SeedData.cs](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/backend/DoAn-CSharp/Data/SeedData.cs)

- [ ] **Step 1: Check and update SeedData.cs**
  Replace lines 52-61 of `SeedData.cs` with the full 22-language seeding list:
  ```csharp
              var supportedLanguages = new System.Collections.Generic.List<Language>
              {
                  new Language { Code = "vi", Name = "Vietnamese", NativeName = "Tiếng Việt", IsActive = true, SortOrder = 1 },
                  new Language { Code = "en", Name = "English", NativeName = "English", IsActive = true, SortOrder = 2 },
                  new Language { Code = "ja", Name = "Japanese", NativeName = "日本語", IsActive = true, SortOrder = 3 },
                  new Language { Code = "ko", Name = "Korean", NativeName = "한국어", IsActive = true, SortOrder = 4 },
                  new Language { Code = "zh", Name = "Chinese", NativeName = "中文", IsActive = true, SortOrder = 5 },
                  new Language { Code = "fr", Name = "French", NativeName = "Français", IsActive = true, SortOrder = 6 },
                  new Language { Code = "es", Name = "Spanish", NativeName = "Español", IsActive = true, SortOrder = 7 },
                  new Language { Code = "de", Name = "German", NativeName = "Deutsch", IsActive = true, SortOrder = 8 },
                  new Language { Code = "it", Name = "Italian", NativeName = "Italiano", IsActive = true, SortOrder = 9 },
                  new Language { Code = "ru", Name = "Russian", NativeName = "Русский", IsActive = true, SortOrder = 10 },
                  new Language { Code = "pt", Name = "Portuguese", NativeName = "Português", IsActive = true, SortOrder = 11 },
                  new Language { Code = "th", Name = "Thai", NativeName = "ไทย", IsActive = true, SortOrder = 12 },
                  new Language { Code = "id", Name = "Indonesian", NativeName = "Bahasa Indonesia", IsActive = true, SortOrder = 13 },
                  new Language { Code = "ms", Name = "Malay", NativeName = "Bahasa Melayu", IsActive = true, SortOrder = 14 },
                  new Language { Code = "hi", Name = "Hindi", NativeName = "हिन्दी", IsActive = true, SortOrder = 15 },
                  new Language { Code = "ar", Name = "Arabic", NativeName = "العربية", IsActive = true, SortOrder = 16 },
                  new Language { Code = "nl", Name = "Dutch", NativeName = "Nederlands", IsActive = true, SortOrder = 17 },
                  new Language { Code = "pl", Name = "Polish", NativeName = "Polski", IsActive = true, SortOrder = 18 },
                  new Language { Code = "tr", Name = "Turkish", NativeName = "Türkçe", IsActive = true, SortOrder = 19 },
                  new Language { Code = "sv", Name = "Swedish", NativeName = "Svenska", IsActive = true, SortOrder = 20 },
                  new Language { Code = "fil", Name = "Filipino", NativeName = "Tagalog", IsActive = true, SortOrder = 21 },
                  new Language { Code = "km", Name = "Khmer", NativeName = "ភាសាខ្មែរ", IsActive = true, SortOrder = 22 }
              };

              foreach (var lang in supportedLanguages)
              {
                  var exists = await context.Languages.AnyAsync(l => l.Code == lang.Code);
                  if (!exists)
                  {
                      await context.Languages.AddAsync(lang);
                  }
              }
              await context.SaveChangesAsync();
  ```

- [ ] **Step 2: Commit changes**
  Stage and commit changes if `auto_commit` is enabled.

---

### Task 2: Frontend UI Update - Popover Multi-select Dropdown

**Files:**
- Modify: [AudioListPage.tsx](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/frontend/src/pages/admin/AudioListPage.tsx)

- [ ] **Step 1: Update AudioListPage.tsx logic and JSX**
  Add popover visibility state and search state for the language dropdown:
  ```typescript
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [langSearchQuery, setLangSearchQuery] = useState('');
    const popoverRef = useRef<HTMLDivElement | null>(null);
  ```
  Add a hook to handle closing the popover when clicking outside:
  ```typescript
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          setPopoverOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  ```
  Add quick select/deselect functions:
  ```typescript
    const handleSelectAllLangs = () => {
      setSelectedRegenLangs(languages.map((l) => l.code));
    };

    const handleDeselectAllLangs = () => {
      setSelectedRegenLangs([]);
    };
  ```
  Filter languages in the dropdown based on search query:
  ```typescript
    const filteredLangsForDropdown = useMemo(() => {
      return languages.filter(
        (l) =>
          l.name.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
          l.nativeName.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
          l.code.toLowerCase().includes(langSearchQuery.toLowerCase())
      );
    }, [languages, langSearchQuery]);
  ```

  Update the "Regenerate Section Toolbar" inside `AudioListPage.tsx` to render the Popover multi-select:
  ```tsx
        {/* Regenerate Section Toolbar */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Tái tạo TTS theo Ngôn ngữ (Regenerate TTS)
            </h3>
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setPopoverOpen(!popoverOpen)}
                className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-surface-alt font-semibold text-xs flex items-center justify-between gap-3 shadow-sm select-none cursor-pointer outline-none w-64 text-left"
              >
                <span className="truncate">
                  {selectedRegenLangs.length === 0
                    ? 'Chưa chọn ngôn ngữ nào'
                    : selectedRegenLangs.length === languages.length
                    ? 'Tất cả ngôn ngữ'
                    : `Đang chọn ${selectedRegenLangs.length} ngôn ngữ`}
                </span>
                <ChevronRight size={14} className={`transform transition-transform ${popoverOpen ? 'rotate-90' : ''}`} />
              </button>

              {popoverOpen && (
                <div className="absolute left-0 mt-2 z-50 w-64 bg-card border border-border rounded-xl shadow-xl p-3.5 space-y-3">
                  {/* Search bar inside popover */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                    <input
                      type="text"
                      placeholder="Tìm ngôn ngữ..."
                      value={langSearchQuery}
                      onChange={(e) => setLangSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border bg-surface text-[11px] font-medium focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all outline-none"
                    />
                  </div>

                  {/* Select All / Deselect All */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <button
                      type="button"
                      onClick={handleSelectAllLangs}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer select-none outline-none"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllLangs}
                      className="text-[10px] font-bold text-danger hover:underline cursor-pointer select-none outline-none"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>

                  {/* Languages list */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {filteredLangsForDropdown.length === 0 ? (
                      <div className="text-[10px] text-text-muted text-center py-2">Không tìm thấy ngôn ngữ</div>
                    ) : (
                      filteredLangsForDropdown.map((lang) => (
                        <label
                          key={lang.code}
                          className="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer select-none py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRegenLangs.includes(lang.code)}
                            onChange={() => handleRegenLangToggle(lang.code)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                          />
                          <span className="truncate">
                            {lang.nativeName} ({lang.code.toUpperCase()})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              disabled={regeneratingAll || regeneratingId !== null || selectedRegenLangs.length === 0}
              onClick={handleRegenerateAll}
              className="h-10 px-5 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {regeneratingAll ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
              <span>Regenerate Selected TTS ({selectedRegenLangs.length})</span>
            </button>
            {selectedRegenLangs.length === 0 && (
              <span className="text-[10px] text-danger font-medium">Vui lòng chọn ít nhất một ngôn ngữ</span>
            )}
          </div>
        </div>
  ```

- [ ] **Step 2: Verify code compiles**
  Run `npm run build --prefix frontend` to make sure there are no syntax or typing errors.

- [ ] **Step 3: Commit changes**
  Stage and commit changes if `auto_commit` is enabled.
