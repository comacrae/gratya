import type { PropsWithChildren } from "react";
import { SafeAreaView, Edge } from "react-native-safe-area-context";

export function Screen({
  children,
  edges,
}: PropsWithChildren<{ edges?: Edge[] }>) {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
