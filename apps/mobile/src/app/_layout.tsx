import { SplashScreen, Stack } from "expo-router";
import { SessionProvider, useSession } from "@/lib/auth";

SplashScreen.preventAutoHideAsync(); // hold the splash screen up until told otherwise

function SplashController() {
  /**
   * read isLoading and if false, hide the splash screen.
   * Draws nothing, but only components can call hooks, and a component
   * re-runs every time the value it reads changes
   */
  const { isLoading } = useSession();
  if (!isLoading) SplashScreen.hide();
  return null;
}

function RootNavigator() {
  /**
   * read session and return a stack that returns to login if not logged in
   */
  const { session } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session} redirectTo="/login">
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!session} redirectTo="/journal">
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  return (
    <SessionProvider>
      <SplashController />
      <RootNavigator />
    </SessionProvider>
  );
}
