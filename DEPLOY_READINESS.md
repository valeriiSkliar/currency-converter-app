# Анализ готовности к деплою — Convertoff Currency Converter

Дата анализа: 2026-07-13
Версия приложения: 1.0.0 (branch `feat/monetization-iap-admob`, commit `9e29f44`)

## TL;DR

Ядро приложения (конвертер, калькулятор, сканер цен, свой курс, настройки, i18n) функционально готово. Реальные IAP и AdMob interstitial интегрированы; `pnpm check-all` проходит (14 suites / 114 tests). До релиза остаются внешние настройки сторов, AdMob и device-level smoke test, а также инфраструктурные пробелы: нет crash-репортинга, пустые submit-профили EAS, неявная конфигурация разрешений камеры.

## Состояние основных фич

| Фича | Состояние |
|---|---|
| Конвертер (главный экран) | ✅ Готов: мультисписок валют, numpad, курсы fiat/crypto с бэкенда через React Query с polling |
| Калькулятор | ✅ Готов (`src/app/(app)/calculator.tsx`, движок в хуке с тестами) |
| Сканер цен (OCR) | ✅ Активно дорабатывался (ручной захват, фильтрация по видоискателю), покрыт тестами; лимит 3 бесплатных скана |
| Свой курс (My Rate) | ✅ Готов, лимит 3 бесплатные попытки |
| Paywall PRO | ✅ `expo-iap`: store-driven Monthly/Yearly планы, purchase, restore и отзыв устаревшего локального PRO-статуса. Клиентская валидация без бэкенда |
| Реклама | ✅ AdMob interstitial: UMP/ATT init, test ID fallback, порог 5 действий, интервал 3 минуты и полное отключение для PRO. Баннер и разовый offer удалены |
| Exchange Rates | 🔒 За фиче-флагом, в production выключен (`ENABLE_EXCHANGE_RATES=false`) — это ок |
| Настройки, темы, i18n | ✅ Light/Dark/System; en/ru/ar синхронны (по 180 строк) |
| Feedback | ✅ POST `/feedback` на бэкенд |

## Качество кода

- `type-check` ✅
- `pnpm test` — 14 suites / 114 тестов ✅
- ESLint по `src` ✅
- `pnpm check-all` ✅ — `.cyrboard/` исключена из ESLint и Jest.

## План подготовки к деплою (по приоритету)

### Блокеры

1. **Внешняя настройка монетизации** — код интегрирован, но владелец должен создать `pro_monthly` и `pro_yearly` в App Store Connect / Play Console, принять Paid Apps agreement, создать AdMob apps/interstitial unit IDs, задать production env IDs и выполнить sandbox/device smoke test. До этого используются Google test IDs, а paywall корректно остаётся в loading/error-состоянии.
2. **`check-all`** — ✅ исправлено: `.cyrboard/` исключена из ESLint и Jest.
3. **Разрешения камеры** — ✅ исправлено: `expo-camera` config plugin задаёт осмысленный `NSCameraUsageDescription`, отключает `NSMicrophoneUsageDescription` и Android `RECORD_AUDIO`.

### Сильно рекомендуется до релиза

4. **Crash-репортинг и аналитика** — Sentry (`@sentry/react-native`) отсутствует; выпускать v1 вслепую рискованно.
5. **EAS Submit** — профили `submit.production` в `eas.json` пустые: нужны `ascAppId` для iOS и service account key для Android.
6. **Проверить внешние URL** — `currencyconverterapp.com` (share, privacy policy) и ссылки на сторы в `.env.production` выглядят как плейсхолдеры. Работающая privacy policy — обязательное требование обоих сторов (в приложении есть камера).
7. **Бэкенд** — прод-API `converter.firstbot.online`: убедиться в стабильности, мониторинге и лимитах; `APP_SERVICE_KEY` вшивается в клиент (для публичного API приемлемо, но нужен rate limiting на сервере).

### Мелочи

8. Почистить `assets/` от черновиков («Convertoff LOGO1.png», «icon Convertoff.png»); проверить финальные иконку и splash на устройствах.
9. Убрать/закрыть dev-роут `src/app/style-guide.tsx` в production-сборке; исправить TODO с языком по умолчанию в `src/lib/i18n/index.tsx:14`.
10. Закоммитить `DEVELOP.md` (или добавить в `.gitignore`) — `eas.json` требует чистый коммит (`requireCommit: true`).
11. Подготовить store listing: скриншоты, описания (en/ru/ar), privacy questionnaire (камера, отсутствие трекинга). `ITSAppUsesNonExemptEncryption=false` уже стоит ✅.
12. Опционально: решить до первого релиза, добавлять ли `expo-updates` для OTA-обновлений (после релиза сложнее из-за смены runtime version).

## Ключевое решение

Монетизация реализована в коде. Для выпуска критичен пункт 1: завершить настройки сторов/AdMob и подтвердить их на устройствах.
