import { create } from 'zustand';

interface SettingsState {
  language: string;
  audioEnabled: boolean;
  darkMode: boolean;
  setLanguage: (lang: string) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => {
  const storedLang = localStorage.getItem('vk_language') || 'en';
  const storedAudio = localStorage.getItem('vk_audio_enabled') !== 'false';
  const storedDark = localStorage.getItem('vk_dark_mode') === 'true';

  // Apply dark mode class initially
  if (storedDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    language: storedLang,
    audioEnabled: storedAudio,
    darkMode: storedDark,
    setLanguage: (language: string) => {
      localStorage.setItem('vk_language', language);
      set({ language });
    },
    setAudioEnabled: (audioEnabled: boolean) => {
      localStorage.setItem('vk_audio_enabled', audioEnabled.toString());
      set({ audioEnabled });
    },
    setDarkMode: (darkMode: boolean) => {
      localStorage.setItem('vk_dark_mode', darkMode.toString());
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ darkMode });
    },
  };
});
