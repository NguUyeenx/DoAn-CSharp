import { useSettingsStore } from '../stores/settingsStore';
import { useNarrationStore } from '../stores/narrationStore';
import { 
  Languages, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Moon, 
  Sun,
  ShieldAlert
} from 'lucide-react';

export default function SettingsPage() {
  const { language, audioEnabled, darkMode, setLanguage, setAudioEnabled, setDarkMode } = useSettingsStore();
  const { clearCooldowns } = useNarrationStore();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  };

  const handleResetCooldowns = () => {
    clearCooldowns();
    alert(language === 'vi' ? 'Đã thiết lập lại lịch sử kích hoạt!' : 'Geofence trigger history reset!');
  };

  return (
    <div className="p-6 max-w-lg mx-auto text-white flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 border-b border-zinc-900 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-400">
          Customize your Smart Walking Tour exploration experience on Vinh Khanh street.
        </p>
      </div>

      {/* Language Section */}
      <div className="flex flex-col gap-3 bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <Languages className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-base">Language Preferences</h3>
        </div>
        <p className="text-xs text-zinc-400">Select your preferred language for maps, narratives, and restaurant menus.</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => handleLanguageChange('vi')}
            className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              language === 'vi'
                ? 'bg-emerald-500 border-emerald-400 text-zinc-950 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Tiếng Việt (VI)
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              language === 'en'
                ? 'bg-emerald-500 border-emerald-400 text-zinc-950 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            English (EN)
          </button>
        </div>
      </div>

      {/* Audio & Narration */}
      <div className="flex flex-col gap-4 bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {audioEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-zinc-500" />}
            <div className="flex flex-col">
              <h3 className="font-semibold text-base">Bilingual Audio Narration</h3>
              <span className="text-[11px] text-zinc-500">Automatically trigger voice guides upon walking in perimeters</span>
            </div>
          </div>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              audioEnabled ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                audioEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Visual Themes */}
      <div className="flex flex-col gap-4 bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-5 h-5 text-emerald-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
            <div className="flex flex-col">
              <h3 className="font-semibold text-base">Dark Visual Theme</h3>
              <span className="text-[11px] text-zinc-500">Use curated oklch dark themes for walking exploration</span>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              darkMode ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                darkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Developer Triggers */}
      <div className="flex flex-col gap-3 bg-red-950/10 border border-red-900/20 p-5 rounded-2xl mt-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <h3 className="font-semibold text-base text-red-400">Developer Testing Sandbox</h3>
        </div>
        <p className="text-xs text-zinc-500">Reset historical geofence triggers to re-activate the same POI perimeters immediately during simulations.</p>
        <button
          onClick={handleResetCooldowns}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 transition-colors mt-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Geofence Trigger History</span>
        </button>
      </div>
    </div>
  );
}
