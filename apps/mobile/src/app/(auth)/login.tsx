import { supabase } from "@/lib/supabase";
import { Text, Button, TextInput } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { EmailPasswordSignInSchema } from "@gratya/shared";
import type { EmailPasswordSignIn } from "@gratya/shared";
import { Link } from "expo-router";
export default function Login() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EmailPasswordSignIn>({
    resolver: zodResolver(EmailPasswordSignInSchema),
    defaultValues: { email: "", password: "" },
  });

  const login = async (values: EmailPasswordSignIn) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) setError("root", { message: error.message });
  };
  return (
    <Screen>
      <Text>Email</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            autoCapitalize="none"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
          />
        )}
      />
      <Text>Password</Text>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            secureTextEntry
            autoCapitalize="none"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
          />
        )}
      />

      <Button
        title="Sign In"
        onPress={() => handleSubmit(login)()}
        disabled={isSubmitting}
      />
      <Link href="/(auth)/signup">Sign Up</Link>
      {errors.email && <Text>{errors.email.message}</Text>}
      {errors.password && <Text>{errors.password.message}</Text>}
      {errors.root && <Text>{errors.root.message}</Text>}
    </Screen>
  );
}
