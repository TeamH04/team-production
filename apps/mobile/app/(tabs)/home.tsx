import { Text, TextInput, View } from "react-native";

export default function Home() {
  return (
    <View className="p-6 gap-4 bg-gray-50 min-h-screen">
      <Text className="">新規のお店行きにくい</Text>

      {/* ラッパーに枠線を当てるのが安定（RN / Web 共通） */}
      <View className="h-12 flex-row items-center rounded-xl bg-white border-2 border-black px-4 shadow">
        <TextInput
          className="flex-1 text-base"
          placeholder="お店を検索..."
          placeholderTextColor="#9CA3AF"
          underlineColorAndroid="transparent"
        />
      </View>
    </View>
  );
}
