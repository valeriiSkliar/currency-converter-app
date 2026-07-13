# IAP и AdMob: настройка владельцем

## IAP — App Store Connect

1. В **Agreements, Tax, and Banking** принять **Paid Apps agreement**.
2. В приложении открыть **Subscriptions** и создать subscription group `PRO`.
3. Добавить auto-renewable subscriptions:
   - `pro_monthly` — 1 месяц, $4.99;
   - `pro_yearly` — 1 год, $19.99.
4. Не создавать trial или introductory offers.
5. Добавить sandbox tester и проверить покупку и restore в новом dev build.

Официальная документация: [Apple subscriptions](https://developer.apple.com/app-store/subscriptions/).

## IAP — Google Play Console

1. Настроить payments profile.
2. Открыть **Monetize with Play → Products → Subscriptions**.
3. Создать subscriptions `pro_monthly` и `pro_yearly`.
4. Для каждой создать и активировать один auto-renewing base plan: Monthly / Yearly с ценами $4.99 / $19.99.
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

Официальная документация: [создание interstitial](https://support.google.com/admob/answer/7311435), [поиск App ID и Ad unit ID](https://support.google.com/admob/answer/7356431).
