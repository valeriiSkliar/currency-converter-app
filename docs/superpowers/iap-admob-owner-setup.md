# IAP и AdMob: настройка владельцем

## Данные приложения для консолей

| Поле | Значение |
|---|---|
| Название | Convertoff Currency Converter |
| Версия | 1.0.0 |
| Expo slug | `currency-converter` |
| Платформы | iOS (включая iPad), Android |
| Локализации приложения | English, Russian, Arabic |
| Camera permission | Камера используется только для сканирования цен; микрофон и `RECORD_AUDIO` отключены |

Идентификаторы iOS bundle ID и Android package ID совпадают:

| Среда | iOS bundle ID / Android package ID |
|---|---|
| Development | `com.cimmetria.currencyconverter.development` |
| Preview | `com.cimmetria.currencyconverter.preview` |
| Production | `com.cimmetria.currencyconverter` |

Для публикации использовать только production ID. Development и Preview не добавлять как отдельные store/AdMob apps.

Перед созданием аккаунтов и публикацией проверить, что доступны публичные страницы:

- Privacy policy: `https://currencyconverterapp.com/privacy-policy`;
- Share/site URL: `https://currencyconverterapp.com`.

Сейчас EAS production builds настроены как iOS store build и Android AAB. В `eas.json` ещё нет submit-конфигурации: для отправки понадобятся iOS `ascAppId` и Android service-account key.

## IAP — App Store Connect

1. В **Agreements, Tax, and Banking** принять **Paid Apps agreement**.
2. В приложении открыть **Subscriptions** и создать subscription group `PRO`.
3. Добавить auto-renewable subscription:
   - `pro_yearly` — 1 год, $4.99.
4. Не создавать trial или introductory offers.
5. Добавить sandbox tester и проверить покупку и restore в новом dev build.

Официальная документация: [Apple subscriptions](https://developer.apple.com/app-store/subscriptions/).

## IAP — Google Play Console

1. Настроить payments profile.
2. Открыть **Monetize with Play → Products → Subscriptions**.
3. Создать subscription `pro_yearly`.
4. Создать и активировать один auto-renewing base plan: Yearly с ценой $4.99.
5. Добавить licensed testers или закрытый testing track и выполнить purchase/restore smoke test.

Официальная документация: [Google Play subscriptions](https://support.google.com/googleplay/android-developer/answer/140504).

## AdMob

1. В AdMob добавить отдельные iOS и Android apps с текущими bundle/package IDs приложения.
2. Для каждой app создать Interstitial ad unit.
3. Скопировать App ID и Ad unit ID.
4. В EAS secrets / production environment задать:

```bash
ADMOB_IOS_APP_ID=ca-app-pub-...~...
ADMOB_ANDROID_APP_ID=ca-app-pub-...~...
EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS=ca-app-pub-.../...
EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID=ca-app-pub-.../...
```

5. Собрать новый dev/production build и выполнить smoke test interstitial.

До production IDs приложение использует Google test IDs вне production.

Не сохранять App IDs, Ad unit IDs, store credentials или service-account key в репозитории. Добавлять их в EAS secrets / production environment.

Официальная документация: [создание interstitial](https://support.google.com/admob/answer/7311435), [поиск App ID и Ad unit ID](https://support.google.com/admob/answer/7356431).
