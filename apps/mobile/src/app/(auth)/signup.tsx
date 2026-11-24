import { supabase } from "@/lib/supabase";
import { Text, Button, TextInput } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { EmailPasswordSignUpSchema } from "@gratya/shared";
import type { EmailPasswordSignUp } from "@gratya/shared";
export default function Signup() {
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EmailPasswordSignUp>({
    resolver: zodResolver(EmailPasswordSignUpSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  const signup = async (values: EmailPasswordSignUp) => {
    const {
      error,
      data: { user, session },
    } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { display_name: values.displayName } },
    });
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    setNeedsConfirmation(user !== null && session === null);
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
      <Text>Display Name</Text>

      <Controller
        control={control}
        name="displayName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            autoCapitalize="words"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
          />
        )}
      />

      <Button
        title="Sign Up"
        onPress={() => handleSubmit(signup)()}
        disabled={isSubmitting}
      />
      {errors.email && <Text>{errors.email.message}</Text>}
      {errors.password && <Text>{errors.password.message}</Text>}
      {errors.displayName && <Text>{errors.displayName.message}</Text>}
      {errors.root && <Text>{errors.root.message}</Text>}
      {needsConfirmation && (
        <Text> Check your email to confirm your account</Text>
      )}
    </Screen>
  );
}
