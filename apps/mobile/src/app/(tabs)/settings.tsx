import { useSession } from "@/lib/auth";
import { Button, Text, TextInput } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { MeSchema, UpdateMeSchema } from "@gratya/shared";
import type { Me, UpdateMe } from "@gratya/shared";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

export default function Settings() {
  const { signOut } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [isLoading, setLoading] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<UpdateMe>({
    resolver: zodResolver(UpdateMeSchema),
    defaultValues: {
      displayName: "",
    },
  });
  // load the user's current settings

  useEffect(() => {
    api
      .get("/api/me", MeSchema)
      .then((res) => {
        setMe(res);
        reset({ displayName: res.displayName || "" });
      })
      .catch((error) =>
        setError(
          "root",
          error instanceof Error
            ? { message: error.message }
            : { message: String(error) },
        ),
      )
      .finally(() => setLoading(false));
  }, [me?.id, reset, setError]);

  const updateName = async (values: UpdateMe) => {
    try {
      const data = await api.patch("/api/me", MeSchema, values);
      setMe({ ...data });
    } catch (error) {
      setError(
        "root",
        error instanceof Error
          ? { message: error.message }
          : { message: String(error) },
      );
    }
  };

  return (
    <Screen>
      {isLoading && <Text>Loading</Text>}
      <Text>Email:{me?.email}</Text>
      <Text>Display Name:{me?.displayName || "fallback"}</Text>
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
        title="Update Name"
        onPress={() => handleSubmit(updateName)()}
        disabled={isSubmitting}
      />
      {errors.displayName && <Text>{errors.displayName.message}</Text>}
      <Button title="Log Out" onPress={signOut} />
      {errors.root && <Text>{errors.root?.message}</Text>}
    </Screen>
  );
}
