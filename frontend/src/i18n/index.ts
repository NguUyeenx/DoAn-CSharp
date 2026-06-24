import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'vi', 'ja', 'ko', 'zh', 'fr', 'es', 'de', 'it', 'ru', 'pt', 'th', 'id', 'ms', 'hi', 'ar', 'nl', 'pl', 'tr', 'sv', 'fil', 'km'],

    backend: {
      loadPath: '/locales/{{lng}}.json',
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'vk_language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React handles escaping
    },
  });

export default i18n;
