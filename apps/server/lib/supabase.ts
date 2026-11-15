import { ENV_VARS } from "@/util/env";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  ENV_VARS.SUPABASE_URL,
  ENV_VARS.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
