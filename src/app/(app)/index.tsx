import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-bg p-6">
      <Text className="text-2xl font-bold text-ink">Currency Converter</Text>
      <Text className="mt-2 text-ink-mute">Coming soon</Text>

      {__DEV__ && (
        <Pressable
          onPress={() => router.push("/style-guide")}
          className="absolute bottom-10 rounded-full bg-accent px-6 py-3 active:opacity-80"
        >
          <Text className="text-sm font-bold text-accent-ink">
            Open Style Guide
          </Text>
        </Pressable>
      )}
    </View>
  );
}
