import { Text, TextInput, View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 bg-gray-50 p-6">
      <Text className="text-2xl font-bold">新規のお店行きにくい</Text>

      <View
        className="mt-4 h-12 flex-row items-center rounded-xl bg-white border border-gray-300 px-4"
        style={{ elevation: 3 }}
      >
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
