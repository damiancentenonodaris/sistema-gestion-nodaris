import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
  if (!url.startsWith("http")) {
    url = `https://${url}`;
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy";
  return createBrowserClient(url, key);
}

