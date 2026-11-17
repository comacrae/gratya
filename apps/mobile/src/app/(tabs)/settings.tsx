import { useSession } from "@/lib/auth";
import { Button, Text } from "react-native";

export default function Settings() {
  const { session, signOut } = useSession();
  return (
    <>
      <Text>{session?.user.email}</Text>
      <Button title="Log Out" onPress={signOut} />
    </>
  );
}
