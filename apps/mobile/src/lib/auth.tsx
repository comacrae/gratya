/**
 * Supabase client needs to know who's logged in but the screens don't.
 * Root layout needs to ask "is there a session?" to choose between login and the tabs
 * Settings tab needs user's email
 * So we make a React Context
 */

import { createContext, use, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type SessionCtx = {
  session: Session | null; // changes each time supabase reports a sign-in, sign-out, or token refresh
  isLoading: boolean; // changes when the first repot arrives (due stored session read) to false and stays false forever
  signOut: () => Promise<void>; // function for screens to call
};

const SessionContext = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  //useEffect to subscribe to supabase auth
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SessionContext value={{ session, isLoading, signOut }}>
      {children}
    </SessionContext>
  );
}

export function useSession() {
  //read the context, throw if null or return
  const ctx = use(SessionContext);
  if (!ctx) throw new Error("useSession must be inside <SessionProvider>");
  return ctx;
}
