# DEVELOP.md

Полезные команды для разработки, сборки, тестирования и дебага. Пополняется по мере необходимости.

## Android: сброс данных приложения (dev debug build)

Команда для самостоятельного сброса (нужен подключённый по USB телефон и `adb` в PATH):

```bash
adb shell pm clear com.cimmetria.currencyconverter.development
```

Это полностью очищает данные приложения (лимит попыток, разрешение камеры, выбранные валюты — всё сбросится к дефолту). После неё приложение нужно снова открыть на телефоне (или командой):

```bash
adb shell monkey -p com.cimmetria.currencyconverter.development -c android.intent.category.LAUNCHER 1
```

Если после переподключения телефона по USB видеозаписи/Metro не грузится с ошибкой "неверный хост" — значит слетел проброс портов, восстанавливается так:

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8088 tcp:8088
```
