import { Text, View } from "react-native";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Health } from "@gratya/shared";
import { HealthSchema } from "@gratya/shared";

if (process.env.EXPO_PUBLIC_API_URL === undefined)
  throw new Error("EXPO_PUBLIC_API_URL env var undefined");

export default function HealthScreen() {
  const [error, setError] = useState("");
  const [response, setResponse] = useState<Health | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .get("/api/health", HealthSchema)
      .then(async (res) => {
        setResponse(res);
      })
      .catch((error: unknown) =>
        setError(error instanceof Error ? error.message : String(error)),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <View>
      <Text>{loading ? "Loading..." : JSON.stringify(response)}</Text>
      {error.length > 0 && <Text>{error}</Text>}
    </View>
  );
}
