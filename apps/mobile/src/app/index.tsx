import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native";
import { APP_NAME } from "@gratya/shared";

export default function HomeScreen() {
  return (
    <SafeAreaView>
      <Text>{APP_NAME}</Text>
    </SafeAreaView>
  );
}
