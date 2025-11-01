import i18next from 'i18next';
import en from './locales/en.json';
import zhTW from './locales/zh-TW.json';

export async function initI18n(language: string = 'en'): Promise<void> {
  await i18next.init({
    lng: language,
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      'zh-TW': { translation: zhTW },
      zh: { translation: zhTW } // Alias for convenience
    },
    interpolation: {
      escapeValue: false
    }
  });
}

export function t(key: string, options?: any): string {
  return i18next.t(key, options) as string;
}

export async function changeLanguage(language: string): Promise<void> {
  await i18next.changeLanguage(language);
}

export { i18next };
