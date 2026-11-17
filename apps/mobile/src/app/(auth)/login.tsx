import { supabase } from "@/lib/supabase";
import { Text, Button } from "react-native";
export default function Login() {
  return (
    <>
      <Text>Login</Text>
      <Button
        title="Dev sign in"
        onPress={async () => {
          const { error } = await supabase.auth.signInWithPassword({
            email: "test@test.dev",
            password: "test",
          });
          if (error) alert(error.message);
        }}
      />
    </>
  );
}
