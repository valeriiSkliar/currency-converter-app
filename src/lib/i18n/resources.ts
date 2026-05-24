import ar from "@/translations/ar.json";
import en from "@/translations/en.json";
import ru from "@/translations/ru.json";

export const resources = {
  en: {
    translation: en,
  },
  ru: {
    translation: ru,
  },
  ar: {
    translation: ar,
  },
};

export type Language = keyof typeof resources;
