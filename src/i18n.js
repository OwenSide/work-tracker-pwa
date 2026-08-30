import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импортируем наши словари
import ru from './locales/ru.json';
import pl from './locales/pl.json';
import uk from './locales/uk.json';
import en from './locales/en.json';

const resources = {
  ru: { translation: ru },
  pl: { translation: pl },
  uk: { translation: uk },
  en: { translation: en }
};

i18n
  .use(LanguageDetector) // Автоматически определяет язык браузера/телефона
  .use(initReactI18next) // Подключает к React
  .init({
    resources,
    fallbackLng: 'en', // Язык по умолчанию
    interpolation: {
      escapeValue: false // Не нужно экранировать React-код
    }
  });

export default i18n;