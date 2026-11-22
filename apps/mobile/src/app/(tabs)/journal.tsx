import { Text, View } from "react-native";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type HealthResponse = {
  ok: boolean;
  app: string;
};

if (process.env.EXPO_PUBLIC_API_URL === undefined)
  throw new Error("EXPO_PUBLIC_API_URL env var undefined");

export default function HealthScreen() {
  const [error, setError] = useState("");
  const [response, setResponse] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .get<HealthResponse>("/api/health")
      .then(async (res) => {
        if (res.ok) {
          setResponse(res);
        }
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
