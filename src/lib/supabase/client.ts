import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "./env";

/** ブラウザ（Client Component）で使う Supabase クライアント。 */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabasePublishableKey());
}
