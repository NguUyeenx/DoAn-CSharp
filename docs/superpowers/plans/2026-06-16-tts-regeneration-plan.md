# TTS Voice Audio Manager Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the Admin TTS Voice Audio Manager to support selected language regeneration instead of regenerating all files, and add pagination, sorting, and search/filtering features.

**Architecture:** 
1. The backend endpoint `/api/admin/audio/regenerate-all` is updated to accept an optional list of languages in the body. If provided, it filters the audio files to regenerate.
2. The frontend fetches languages, renders checkboxes for selecting languages to regenerate, and provides client-side pagination, sorting, and filtering on the audio table.

**Tech Stack:** ASP.NET Core, React, Tailwind CSS

---

### Task 1: Backend DTO & API Action Update

**Files:**
- Modify: `backend/DoAn-CSharp/Controllers/AdminController.cs`

- [ ] **Step 1: Add request DTO class**
  At the bottom of `backend/DoAn-CSharp/Controllers/AdminController.cs`, define `RegenerateAudioRequest`:
  ```csharp
      public class RegenerateAudioRequest
      {
          public List<string>? Languages { get; set; }
      }
  ```

- [ ] **Step 2: Update RegenerateAllAudio signature and logic**
  Modify `RegenerateAllAudio` at lines 459-518 of `backend/DoAn-CSharp/Controllers/AdminController.cs` to accept `[FromBody] RegenerateAudioRequest? request` and filter by the selected languages if provided:
  ```csharp
          [HttpPost("audio/regenerate-all")]
          public async Task<IActionResult> RegenerateAllAudio([FromBody] RegenerateAudioRequest? request)
          {
              var query = _context.AudioFiles
                  .Where(x => x.AudioType == "tts" && x.TranslationType == Models.Entities.TranslationType.POI);

              if (request?.Languages != null && request.Languages.Any())
              {
                  var targetLangs = request.Languages.Select(l => l.ToLowerInvariant()).ToList();
                  query = query.Where(x => targetLangs.Contains(x.LanguageCode.ToLower()));
              }

              var audios = await query.ToListAsync();

              int successCount = 0;
              int failCount = 0;

              foreach (var audio in audios)
              {
                  var translation = await _context.POITranslations.FindAsync(audio.TranslationId);
                  if (translation == null || string.IsNullOrWhiteSpace(translation.AudioText))
                  {
                      failCount++;
                      continue;
                  }

                  // Delete existing physical file if exists
                  var physicalPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", audio.FilePath.TrimStart('/'));
                  if (System.IO.File.Exists(physicalPath))
                  {
                      try
                      {
                          System.IO.File.Delete(physicalPath);
                      }
                      catch (System.Exception ex)
                      {
                          System.Console.WriteLine($"Error deleting physical audio file before regeneration: {ex.Message}");
                      }
                  }

                  try
                  {
                      string audioUrl = await _ttsService.GenerateAudioAsync(translation.AudioText, audio.LanguageCode, translation.POIId);
                      string newPhysicalPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", audioUrl.TrimStart('/'));
                      int duration = TTSService.GetMp3Duration(newPhysicalPath);

                      audio.FilePath = audioUrl;
                      audio.DurationSeconds = duration;
                      audio.GeneratedAt = DateTime.UtcNow;
                      await _context.SaveChangesAsync();
                      successCount++;
                  }
                  catch (System.Exception ex)
                  {
                      System.Console.WriteLine($"Error regenerating TTS audio ID {audio.Id}: {ex.Message}");
                      failCount++;
                  }
              }

              return Ok(new
              {
                  message = "Regeneration of all TTS audio files completed.",
                  total = audios.Count,
                  success = successCount,
                  failed = failCount
              });
          }
  ```

- [ ] **Step 3: Run backend build to verify**
  Run: `dotnet build backend/DoAn-CSharp/DoAn-CSharp.csproj` in the terminal and verify there are no compilation errors.

- [ ] **Step 4: Commit changes**
  Stage and commit changes if `auto_commit` is enabled.

---

### Task 2: Frontend API Client Update

**Files:**
- Modify: `frontend/src/api/admin.ts`

- [ ] **Step 1: Modify regenerateAllAudio signature**
  Modify line 28 in `frontend/src/api/admin.ts` to accept `languages` array:
  ```typescript
    regenerateAllAudio: (languages?: string[]) => api.post<any>('/admin/audio/regenerate-all', { languages }),
  ```

- [ ] **Step 2: Commit changes**
  Stage and commit changes if `auto_commit` is enabled.

---

### Task 3: Frontend UI Enhancements

**Files:**
- Modify: `frontend/src/pages/admin/AudioListPage.tsx`

- [ ] **Step 1: Modify imports**
  Update imports at the top of `AudioListPage.tsx` to include `useMemo`, search & sorting icons, and the `Language` type:
  ```typescript
  import { useEffect, useState, useRef, useMemo } from 'react';
  import { adminApi } from '@/api/admin';
  import { poisApi } from '@/api/pois';
  import { Loader2, Play, Pause, RefreshCw, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
  import { useToast } from '@/components/ui/Toast';
  import type { Language } from '@/types/api';
  ```

- [ ] **Step 2: Add States, loadData updates, filter/sort/pagination logic**
  Rewrite the components states, update `loadData` to fetch languages, and implement sorting, filtering, and pagination using `useMemo`:
  ```typescript
  export default function AudioListPage() {
    const { success, error: toastError } = useToast();

    const [audios, setAudios] = useState<AudioFileItem[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [selectedRegenLangs, setSelectedRegenLangs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
    const [regeneratingAll, setRegeneratingAll] = useState(false);

    // Audio Playback states
    const [playingId, setPlayingId] = useState<number | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // Filter, Sort, Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLanguage, setFilterLanguage] = useState('');
    const [sortBy, setSortBy] = useState<'poiName' | 'languageCode' | null>('poiName');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const loadData = async () => {
      setLoading(true);
      try {
        const [audioRes, poisRes, langsRes] = await Promise.all([
          adminApi.getAudioFiles(),
          poisApi.getAll(),
          adminApi.getLanguages(),
        ]);

        const poisList = poisRes.data;
        const audioList = audioRes.data.map((audio: any) => {
          const matchingPoi = poisList.find((p) => p.id === audio.poiId);
          return {
            ...audio,
            poiName: matchingPoi ? matchingPoi.name : `Food Spot #${audio.poiId}`,
          };
        });

        setAudios(audioList);
        
        const activeLangs = langsRes.data.filter((l) => l.isActive);
        setLanguages(activeLangs);
        setSelectedRegenLangs(activeLangs.map((l) => l.code));
      } catch (err) {
        console.error('Failed to load data:', err);
        setAudios([
          {
            id: 1,
            poiId: 5,
            poiName: 'Oc Oanh',
            languageCode: 'en',
            filePath: '/audio/poi_5_en.mp3',
            durationSeconds: 154,
            audioType: 'tts',
          },
          {
            id: 2,
            poiId: 5,
            poiName: 'Oc Oanh',
            languageCode: 'vi',
            filePath: '/audio/poi_5_vi.mp3',
            durationSeconds: 165,
            audioType: 'tts',
          },
        ]);
        setLanguages([
          { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', isActive: true, isDefault: true, sortOrder: 1 },
          { code: 'en', name: 'English', nativeName: 'English', isActive: true, isDefault: false, sortOrder: 2 },
        ]);
        setSelectedRegenLangs(['vi', 'en']);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadData();
      return () => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
      };
    }, []);

    // Reset to page 1 on search or filter change
    useEffect(() => {
      setCurrentPage(1);
    }, [searchTerm, filterLanguage]);

    const handlePlay = (item: AudioFileItem) => {
      if (playingId === item.id && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setPlayingId(null);
        return;
      }
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
        audioPlayerRef.current.onended = () => setPlayingId(null);
        audioPlayerRef.current.onerror = () => {
          toastError('Failed to play audio.');
          setPlayingId(null);
        };
      }
      audioPlayerRef.current.src = item.filePath;
      audioPlayerRef.current.load();
      audioPlayerRef.current.play()
        .then(() => setPlayingId(item.id))
        .catch(() => {
          toastError('Playback block or fail.');
          setPlayingId(null);
        });
    };

    const handleRegenerate = async (id: number) => {
      setRegeneratingId(id);
      try {
        await adminApi.regenerateAudio(id);
        success('Audio regenerated via TTS successfully!');
        loadData();
      } catch (err) {
        console.error('Failed to regenerate audio:', err);
        toastError('Regeneration request failed.');
      } finally {
        setRegeneratingId(null);
      }
    };

    const handleRegenerateAll = async () => {
      if (selectedRegenLangs.length === 0) {
        toastError('Vui lòng chọn ít nhất một ngôn ngữ để làm mới.');
        return;
      }
      const selectedNames = languages
        .filter((l) => selectedRegenLangs.includes(l.code))
        .map((l) => l.nativeName)
        .join(', ');

      if (!window.confirm(`Bạn có chắc chắn muốn làm mới (regenerate) các file TTS cho ngôn ngữ: ${selectedNames}? Quá trình này có thể mất một lúc.`)) {
        return;
      }
      setRegeneratingAll(true);
      try {
        const { data } = await adminApi.regenerateAllAudio(selectedRegenLangs);
        success(`Tái tạo thành công: ${data.success}/${data.total} audio files.`);
        loadData();
      } catch (err) {
        console.error('Failed to regenerate selected audio:', err);
        toastError('Không thể làm mới các TTS Audio đã chọn.');
      } finally {
        setRegeneratingAll(false);
      }
    };

    const handleDelete = async (id: number) => {
      if (!window.confirm('Delete this TTS audio file from the disk?')) return;
      try {
        await adminApi.deleteAudio(id);
        success('Audio file deleted.');
        setAudios((prev) => prev.filter((a) => a.id !== id));
        if (playingId === id && audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          setPlayingId(null);
        }
      } catch (err) {
        console.error('Failed to delete audio:', err);
        toastError('Deletion failed.');
      }
    };

    const handleRegenLangToggle = (code: string) => {
      setSelectedRegenLangs((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      );
    };

    const handleSort = (field: 'poiName' | 'languageCode') => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(field);
        setSortOrder('asc');
      }
    };

    // Filter, Sort, Pagination Memos
    const filteredAudios = useMemo(() => {
      return audios.filter((audio) => {
        const matchesSearch = audio.poiName
          ? audio.poiName.toLowerCase().includes(searchTerm.toLowerCase())
          : false;
        const matchesLang = filterLanguage
          ? audio.languageCode.toLowerCase() === filterLanguage.toLowerCase()
          : true;
        return matchesSearch && matchesLang;
      });
    }, [audios, searchTerm, filterLanguage]);

    const sortedAudios = useMemo(() => {
      if (!sortBy) return filteredAudios;
      return [...filteredAudios].sort((a, b) => {
        let valA = '';
        let valB = '';
        if (sortBy === 'poiName') {
          valA = a.poiName || '';
          valB = b.poiName || '';
        } else if (sortBy === 'languageCode') {
          valA = a.languageCode;
          valB = b.languageCode;
        }
        const compare = valA.localeCompare(valB, undefined, { sensitivity: 'base', numeric: true });
        return sortOrder === 'asc' ? compare : -compare;
      });
    }, [filteredAudios, sortBy, sortOrder]);

    const paginatedAudios = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return sortedAudios.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedAudios, currentPage]);

    const totalPages = Math.ceil(sortedAudios.length / itemsPerPage);

    const formatDuration = (secs: number) => {
      const mins = Math.floor(secs / 60);
      const remainingSecs = Math.round(secs % 60);
      return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    if (loading && audios.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
          <Loader2 className="animate-spin text-primary" size={28} />
          <span className="text-xs font-semibold">Loading generated audio files...</span>
        </div>
      );
    }
  ```

- [ ] **Step 3: Update return JSX block**
  Replace the returned JSX in `AudioListPage.tsx` to add checkboxes, search bar, select language filter, clickable table headers, and pagination controls:
  ```tsx
    return (
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
              TTS Voice Audio Manager
            </h2>
            <p className="text-xs text-text-secondary">
              Overview of synthetic TTS audio commentaries generated for Points of Interest
            </p>
          </div>
        </div>

        {/* Regenerate Section Toolbar */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Chọn ngôn ngữ để tạo lại (Regenerate TTS)
            </h3>
            <div className="flex flex-wrap gap-4 items-center mt-1">
              {languages.map((lang) => (
                <label key={lang.code} className="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedRegenLangs.includes(lang.code)}
                    onChange={() => handleRegenLangToggle(lang.code)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <span>{lang.nativeName} ({lang.code.toUpperCase()})</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Search & Filter controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm theo Food Spot Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="h-11 px-4 rounded-xl border border-border bg-card text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer sm:w-48"
          >
            <option value="">Tất cả ngôn ngữ</option>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>

        {filteredAudios.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center text-text-muted text-xs">
            Không tìm thấy file âm thanh nào khớp với bộ lọc.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider select-none">
                    <th
                      onClick={() => handleSort('poiName')}
                      className="p-4 cursor-pointer hover:bg-border/20 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Food Spot Name</span>
                        <ArrowUpDown size={12} className={sortBy === 'poiName' ? 'text-primary' : 'text-text-muted'} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('languageCode')}
                      className="p-4 cursor-pointer hover:bg-border/20 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Language</span>
                        <ArrowUpDown size={12} className={sortBy === 'languageCode' ? 'text-primary' : 'text-text-muted'} />
                      </div>
                    </th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">File Path</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedAudios.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-alt/40 transition-colors">
                      <td className="p-4 font-bold text-text-primary">
                        <div className="flex flex-col gap-1">
                          <span>{item.poiName}</span>
                          {item.fileExists === false && (
                            <span className="inline-self-start px-1.5 py-0.5 bg-danger/10 text-danger border border-danger/20 rounded-md text-[9px] font-bold uppercase tracking-wider w-fit">
                              File missing on disk
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-primary uppercase">{item.languageCode}</td>
                      <td className="p-4 font-semibold">{formatDuration(item.durationSeconds)}</td>
                      <td className="p-4 font-mono text-text-secondary truncate max-w-xs">{item.filePath}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-2.5">
                        {/* Play / Pause Toggle */}
                        <button
                          disabled={item.fileExists === false || regeneratingAll}
                          onClick={() => handlePlay(item)}
                          className={`p-2 border rounded-lg transition-colors outline-none ${
                            item.fileExists === false || regeneratingAll
                              ? 'border-border bg-surface-alt text-text-muted opacity-40 cursor-not-allowed'
                              : playingId === item.id
                              ? 'bg-accent/10 border-accent text-accent cursor-pointer'
                              : 'border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover cursor-pointer'
                          }`}
                          title={item.fileExists === false ? 'Audio file is missing on local server' : (playingId === item.id ? 'Pause' : 'Play')}
                        >
                          {playingId === item.id ? <Pause size={14} /> : <Play size={14} />}
                        </button>

                        {/* Regenerate TTS */}
                        <button
                          disabled={regeneratingId === item.id || regeneratingAll}
                          onClick={() => handleRegenerate(item.id)}
                          className="p-2 border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover rounded-lg transition-colors cursor-pointer outline-none disabled:opacity-50"
                          title="Regenerate TTS Voice"
                        >
                          {regeneratingId === item.id ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          disabled={regeneratingAll}
                          onClick={() => handleDelete(item.id)}
                          className={`p-2 border rounded-lg transition-colors outline-none ${
                            regeneratingAll
                              ? 'border-border bg-surface-alt text-text-muted opacity-40 cursor-not-allowed'
                              : 'border-border bg-card text-danger hover:border-danger/40 hover:bg-danger/5 cursor-pointer'
                          }`}
                          title="Delete File"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-surface-alt px-4 py-3.5 border-t border-border flex items-center justify-between gap-4 text-xs font-semibold text-text-secondary select-none">
                <div>
                  Showing {Math.min(filteredAudios.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
                  {Math.min(filteredAudios.length, currentPage * itemsPerPage)} of {filteredAudios.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="p-2 rounded-lg border border-border bg-card hover:bg-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer outline-none ${
                        currentPage === page
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-border bg-card hover:bg-surface text-text-secondary'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="p-2 rounded-lg border border-border bg-card hover:bg-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 4: Verify frontend code compiles**
  Run `npm run build` or inspect typing in VSCode context to ensure no errors.

- [ ] **Step 5: Commit changes**
  Stage and commit changes if `auto_commit` is enabled.

---

### Task 4: Complete System Testing and Validation

- [ ] **Step 1: Start backend and frontend**
  Run the backend: `dotnet run --project backend/DoAn-CSharp/DoAn-CSharp.csproj`
  Run the frontend: `npm run dev --prefix frontend`

- [ ] **Step 2: Verify functionality**
  1. Open TTS Voice Audio Manager page in browser.
  2. Verify active languages checkboxes are shown, checked by default.
  3. Deselect a language and click "Regenerate Selected TTS" to verify only the chosen languages are regenerated.
  4. Type in Search input and check if the list is filtered instantly by Food Spot Name.
  5. Select a language in dropdown and check if list is filtered.
  6. Click headers to sort by Name and Language.
  7. Check if pagination shows 10 items per page and switching pages works correctly.
