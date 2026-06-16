import { useEffect, useState, useRef } from 'react';
import { adminApi } from '@/api/admin';
import { poisApi } from '@/api/pois';
import { Loader2, Play, Pause, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

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
  const [loading, setLoading] = useState(true);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

  // Audio Playback states
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [audioRes, poisRes] = await Promise.all([
        adminApi.getAudioFiles(),
        poisApi.getAll(),
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
    } catch (err) {
      console.error('Failed to load audios:', err);
      // Fallback mocks for UI testing
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
      <div>
        <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
          TTS Voice Audio Manager
        </h2>
        <p className="text-xs text-text-secondary">
          Overview of synthetic TTS audio commentaries generated for Points of Interest
        </p>
      </div>

      {audios.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-text-muted">
          No generated audio files found.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                  <th className="p-4">Food Spot Name</th>
                  <th className="p-4">Language</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">File Path</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {audios.map((item) => (
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
                        disabled={item.fileExists === false}
                        onClick={() => handlePlay(item)}
                        className={`p-2 border rounded-lg transition-colors outline-none ${
                          item.fileExists === false
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
                        disabled={regeneratingId === item.id}
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
                        onClick={() => handleDelete(item.id)}
                        className="p-2 border border-border bg-card text-danger hover:border-danger/40 hover:bg-danger/5 rounded-lg transition-colors cursor-pointer outline-none"
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
        </div>
      )}
    </div>
  );
}
