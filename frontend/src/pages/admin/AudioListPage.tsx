import { useEffect, useState, useRef, useMemo } from 'react';
import { adminApi } from '@/api/admin';
import { poisApi } from '@/api/pois';
import { Loader2, Play, Pause, RefreshCw, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import type { Language } from '@/types/api';

interface AudioFileItem {
  id: number;
  poiId: number;
  poiName?: string;
  languageCode: string;
  filePath: string;
  durationSeconds: number;
  audioType: string;
  fileExists?: boolean;
}

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

  // Popover States
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement | null>(null);

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
      // Fallback mocks
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

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset page to 1 when search term or filter language changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLanguage]);

  const handlePlay = (item: AudioFileItem) => {
    // If playing the same file, pause it
    if (playingId === item.id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingId(null);
      return;
    }

    // Initialize player if not exists
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
      audioPlayerRef.current.onended = () => setPlayingId(null);
      audioPlayerRef.current.onerror = () => {
        toastError('Failed to play audio.');
        setPlayingId(null);
      };
    }

    // Play
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
      loadData(); // reload
    } catch (err) {
      console.error('Failed to regenerate audio:', err);
      toastError('Regeneration request failed.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleRegenerateAll = async () => {
    if (selectedRegenLangs.length === 0) {
      toastError('Vui lòng chọn ít nhất một ngôn ngữ để tái tạo.');
      return;
    }
    const selectedNames = languages
      .filter((l) => selectedRegenLangs.includes(l.code))
      .map((l) => l.nativeName)
      .join(', ');

    if (!window.confirm(`Bạn có chắc chắn muốn làm mới (regenerate) tất cả các file TTS Audio cho ngôn ngữ: ${selectedNames}? Quá trình này có thể mất một lúc.`)) {
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

  const handleSelectAllLangs = () => {
    setSelectedRegenLangs(languages.map((l) => l.code));
  };

  const handleDeselectAllLangs = () => {
    setSelectedRegenLangs([]);
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

  const filteredLangsForDropdown = useMemo(() => {
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
        l.nativeName.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
        l.code.toLowerCase().includes(langSearchQuery.toLowerCase())
    );
  }, [languages, langSearchQuery]);

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
          <span className={`text-[10px] text-danger font-medium transition-opacity duration-200 ${selectedRegenLangs.length === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'}`}>
            Vui lòng chọn ít nhất một ngôn ngữ
          </span>
          <button
            disabled={regeneratingAll || regeneratingId !== null || selectedRegenLangs.length === 0}
            onClick={handleRegenerateAll}
            className="h-10 px-5 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-60"
          >
            {regeneratingAll ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            <span>Regenerate Selected TTS ({selectedRegenLangs.length})</span>
          </button>
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
                {getPaginationRange(currentPage, totalPages).map((page, index) => {
                  if (page === '...') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="w-8 h-8 flex items-center justify-center text-text-muted select-none font-medium"
                      >
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={`page-${page}`}
                      onClick={() => setCurrentPage(page as number)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer outline-none ${
                        currentPage === page
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-border bg-card hover:bg-surface text-text-secondary'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
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

function getPaginationRange(currentPage: number, totalPages: number): (number | string)[] {
  const delta = 2; // Number of pages to show on either side of current page
  const range: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      range.push(i);
    }
    return range;
  }

  // Always show page 1
  range.push(1);

  const left = currentPage - delta;
  const right = currentPage + delta;

  // Check if we need a left ellipsis
  if (left > 2) {
    range.push('...');
  } else if (left === 2) {
    range.push(2);
  }

  // Add middle pages
  const start = Math.max(2, left);
  const end = Math.min(totalPages - 1, right);
  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  // Check if we need a right ellipsis
  if (right < totalPages - 1) {
    range.push('...');
  } else if (right === totalPages - 1) {
    range.push(totalPages - 1);
  }

  // Always show last page
  range.push(totalPages);

  return range;
}

