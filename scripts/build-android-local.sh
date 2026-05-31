#!/bin/bash

# Скрипт для локальной сборки Android с правильными переменными окружения
# Использование: ./scripts/build-android-local.sh [development|preview|production] [apk|aab]

set -e  # Выйти при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Получить окружение из аргумента (по умолчанию preview, так как это профиль для сборки APK)
ENV=${1:-preview}
BUILD_TYPE=${2:-apk}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Локальная сборка Android (Currency Converter)${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Окружение: ${GREEN}${ENV}${NC}"
echo -e "Тип сборки: ${GREEN}${BUILD_TYPE}${NC}"
echo ""

# Проверить наличие файла окружения. Если для preview нет файла, предложим скопировать из development
if [ ! -f ".env.${ENV}" ]; then
    if [ "$ENV" = "preview" ] && [ -f ".env.development" ]; then
        echo -e "${YELLOW}Предупреждение: .env.preview не найден. Создаю на основе .env.development...${NC}"
        cp .env.development .env.preview
        # Заменим значение EXPO_PUBLIC_APP_ENV на preview
        sed -i '' 's/EXPO_PUBLIC_APP_ENV=development/EXPO_PUBLIC_APP_ENV=preview/g' .env.preview 2>/dev/null || sed -i 's/EXPO_PUBLIC_APP_ENV=development/EXPO_PUBLIC_APP_ENV=preview/g' .env.preview
    else
        echo -e "${RED}Ошибка: Файл .env.${ENV} не найден!${NC}"
        exit 1
    fi
fi

# Шаг 1: Копировать правильный .env файл
echo -e "${YELLOW}[1/5] Копирование .env.${ENV} → .env${NC}"
cp ".env.${ENV}" .env
echo -e "${GREEN}✓ Файл .env обновлен${NC}"

# Показать какие ключи используются
echo -e "\n${BLUE}Проверка переменных окружения:${NC}"
API_URL=$(grep EXPO_PUBLIC_API_URL .env | cut -d'=' -f2)
APP_SERVICE_KEY=$(grep EXPO_PUBLIC_APP_SERVICE_KEY .env | cut -d'=' -f2)
EAS_ID=$(grep EAS_PROJECT_ID .env | cut -d'=' -f2)

echo "  API Base URL: $API_URL"
if [ -n "$APP_SERVICE_KEY" ]; then
    echo "  App Service Key: ${APP_SERVICE_KEY:0:10}..."
else
    echo -e "  App Service Key: ${YELLOW}НЕ ЗАДАН (EXPO_PUBLIC_APP_SERVICE_KEY)${NC}"
fi
if [ -n "$EAS_ID" ]; then
    echo "  EAS Project ID: $EAS_ID"
fi

# Шаг 2: Очистить все кэши
echo -e "\n${YELLOW}[2/5] Очистка кэшей${NC}"
rm -rf node_modules/.cache
rm -rf .expo
echo -e "${GREEN}✓ Кэши очищены${NC}"

# Шаг 3: Пересоздать папку android с правильными переменными (prebuild)
echo -e "\n${YELLOW}[3/5] Пересоздание нативных папок (prebuild)${NC}"

# ВАЖНО: Временно скрыть .env.development (если собираем не development) чтобы Expo использовал только .env
ENV_DEV_BACKUP=""
if [ "$ENV" != "development" ] && [ -f ".env.development" ]; then
    echo -e "${BLUE}Временно скрываю .env.development...${NC}"
    mv .env.development .env.development.bak
    ENV_DEV_BACKUP=".env.development.bak"
fi

# Запуск prebuild
STRICT_ENV_VALIDATION=1 EXPO_PUBLIC_APP_ENV=${ENV} pnpm run prebuild

# Восстановить .env.development
if [ -n "$ENV_DEV_BACKUP" ]; then
    mv .env.development.bak .env.development
    echo -e "${BLUE}✓ .env.development восстановлен${NC}"
fi

echo -e "${GREEN}✓ Нативные папки пересозданы${NC}"

# Шаг 4: Сборка с помощью Gradle
cd android

if [ "$BUILD_TYPE" = "apk" ]; then
    if [ "$ENV" = "development" ]; then
        echo -e "\n${YELLOW}[4/5] Сборка Debug APK${NC}"
        ./gradlew assembleDebug
        cd ..
        OUTPUT_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
    else
        echo -e "\n${YELLOW}[4/5] Сборка Release APK ($ENV)${NC}"
        ./gradlew assembleRelease
        cd ..
        OUTPUT_PATH="android/app/build/outputs/apk/release/app-release.apk"
    fi
else
    echo -e "\n${YELLOW}[4/5] Сборка Android App Bundle ($ENV)${NC}"
    ./gradlew bundleRelease
    cd ..
    OUTPUT_PATH="android/app/build/outputs/bundle/release/app-release.aab"
fi

echo -e "${GREEN}✓ Сборка успешно завершена!${NC}"

# Шаг 5: Проверка файла и установка (для APK)
echo -e "\n${YELLOW}[5/5] Информация о сборке${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Файл: ${GREEN}${OUTPUT_PATH}${NC}"

if [ -f "$OUTPUT_PATH" ]; then
    SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)
    echo -e "Размер: ${GREEN}${SIZE}${NC}"
else
    echo -e "${RED}Файл сборки не найден по пути: $OUTPUT_PATH${NC}"
    exit 1
fi
echo -e "${BLUE}========================================${NC}"

if [ "$BUILD_TYPE" = "apk" ]; then
    # Проверить подключенные устройства через adb
    if adb devices | grep -q -v -e "List of devices" -e "^$"; then
        echo -e "\n${BLUE}Обнаружено подключенное устройство. Установка APK...${NC}"
        adb install -r "$OUTPUT_PATH"
        echo -e "${GREEN}✓ APK успешно установлен на устройство!${NC}"
    else
        echo -e "\n${YELLOW}Устройства ADB не обнаружены. Пропуск установки.${NC}"
    fi
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Готово!${NC}"
echo -e "${GREEN}========================================${NC}"
