# Монетизация v1: реальный IAP (expo-iap) + AdMob — дизайн

Дата: 2026-07-13
Статус: одобрен пользователем (уточнения собраны в диалоге)

## Цель

Устранить блокер деплоя №1 из `DEPLOY_READINESS.md`: заменить фиктивную покупку PRO
(`unlockPro()` без оплаты в `src/app/(app)/paywall.tsx`) на реальные покупки через
`expo-iap` и заменить макет рекламного баннера
(`src/features/converter/components/ad-banner.tsx`) на реальный AdMob.

## Принятые решения

| Вопрос | Решение |
|---|---|
| Набор продуктов | Только подписки: Monthly + Yearly. Карточка Lifetime удаляется из UI |
| Free trial | Нет. Тексты «3-day free trial» удаляются из переводов |
| Валидация покупок | Клиентская (StoreKit 2 / Play Billing на устройстве), без бэкенда |
| Платформы | iOS и Android в одной итерации |
| Реклама | Реальный AdMob (`react-native-google-mobile-ads`) в рамках этой же работы |
| Библиотека IAP | `expo-iap` (не RevenueCat) |

## Архитектура

Подход: отдельный feature-модуль поверх хука `useIAP` из `expo-iap`.
Paywall-экран остаётся презентационным; PRO-статус по-прежнему живёт только в
`useQuotaStore.isPro`, но выставляется/снимается исключительно IAP-слоем.

### Фаза 1 — IAP

**Продукты** (одинаковые ID на обеих платформах):

- `pro_monthly` — auto-renewable подписка, $4.99/мес
- `pro_yearly` — auto-renewable подписка, $19.99/год

App Store Connect: subscription group «PRO», без intro-офферов.
Play Console: две подписки, по одному base plan в каждой.

**Новый модуль `src/features/iap/`:**

- `products.ts` — константы SKU (`PRO_SKUS = ["pro_monthly", "pro_yearly"]`).
- `use-pro-purchase.ts` — хук поверх `useIAP`:
  - подключение к стору, `fetchProducts` по SKU;
  - маппинг продуктов стора в модель плана для UI (title, локализованная цена
    `displayPrice`, период);
  - `purchase(sku)` → `requestPurchase`; в колбэке успеха — `finishTransaction`,
    затем `unlockPro()` + flash-сообщение + закрытие paywall;
  - обработка ошибок: отмена пользователем — тихо; остальное — flash-ошибка;
  - `restore()` → `getAvailablePurchases`; активная подписка найдена →
    `unlockPro()` + сообщение об успехе; не найдена → сообщение «покупок нет»;
  - флаг `isProcessing` для блокировки CTA на время транзакции.
- `use-pro-status-sync.ts` — при старте приложения: если `isPro === true`, но в
  `getAvailablePurchases` нет активной подписки — вызвать `revokePro()`.
  Закрывает кейс «подписка отменена/истекла, а локальный флаг остался»
  без серверной валидации. Ошибки соединения со стором статус не снимают
  (снимаем только при успешном ответе стора без активных покупок).

**Изменения существующего кода:**

- `use-quota-store.ts`: добавить действие `revokePro()` (`isPro: false`).
- `paywall.tsx`:
  - планы строятся из продуктов стора (реальные локализованные цены), а не из
    хардкода; на время загрузки — состояние загрузки карточек;
  - карточка Lifetime и тексты trial удаляются;
  - «Restore purchase» вызывает реальный `restore()` (сейчас — `router.back()`);
  - CTA показывает спиннер и блокируется при `isProcessing`.
- Переводы `en/ru/ar`: удалить ключи lifetime/trial, добавить ключи для
  сообщений результата покупки/restore и ошибок. Каталоги остаются синхронными.

**Конфигурация:** `expo-iap` в зависимостях + config plugin в `app.config.ts`.
Нативный модуль ⇒ потребуется новый dev-build (`expo-dev-client` уже настроен).

**Тестирование:** мок `expo-iap` в Jest; юнит-тесты: маппинг продуктов в планы,
успех/отмена/ошибка покупки, restore (нашли/не нашли), sync-снятие PRO,
блокировка повторного нажатия CTA.

**Prerequisites вне кода (владелец):** подписки `pro_monthly`/`pro_yearly` в
App Store Connect и Play Console, Paid Apps agreement, sandbox-тестеры /
закрытый трек. До готовности сторов код проверяется на моках и
error-состояниях.

### Фаза 2 — AdMob

- Зависимость `react-native-google-mobile-ads` + config plugin в
  `app.config.ts` с `androidAppId`/`iosAppId`. До получения реальных ID —
  официальные тестовые app ID Google.
- `ad-banner.tsx`: макет заменяется реальным anchored adaptive `BannerAd`.
  Unit ID: тестовый в development/preview, боевой в production (через `env.ts`).
  Гейтинг сохраняется: при `isPro` баннер не рендерится.
- Consent: UMP-флоу (входит в библиотеку) при первом запуске до загрузки
  рекламы — требование Google для EEA/UK.
- iOS ATT: prompt через `expo-tracking-transparency` +
  `NSUserTrackingUsageDescription`; при отказе — non-personalized ads.
- Ошибка загрузки/нет fill → баннер схлопывается (высота 0), без пустой рамки.

**Prerequisites вне кода:** аккаунт AdMob, приложения iOS/Android, app ID и
banner unit ID.

## Порядок работы (небольшие валидируемые шаги)

Каждый шаг заканчивается зелёным `pnpm check-all` (после починки `.cyrboard`,
см. блокер №2) и ручной проверкой перед переходом дальше:

1. Установка `expo-iap`, модуль `src/features/iap/` + `revokePro()` в store,
   юнит-тесты на моках.
2. Подключение paywall к хуку: планы из стора, purchase, restore, состояния
   загрузки/процессинга.
3. Sync PRO-статуса при старте (`use-pro-status-sync.ts`) + тесты.
4. Чистка UI/переводов: удаление Lifetime и trial-текстов (en/ru/ar).
5. AdMob: плагин, реальный `BannerAd`, UMP + ATT.
6. Sandbox-проверка на устройствах — когда продукты в сторах готовы.

## Вне скоупа

- Серверная валидация receipt/purchaseToken (можно добавить позже).
- Интро-офферы, промокоды, upgrade/downgrade между планами внутри приложения
  (управление подпиской — через нативные интерфейсы сторов).
- Интерстишелы/rewarded-реклама — только баннер.
