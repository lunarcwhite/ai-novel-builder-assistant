// Test stub for @supabase/ssr.
// The loader redirects all @supabase/ssr imports here so repository code
// runs in local-dev in-memory mode (createClient() returns null when
// Supabase env vars are blank, which the test script guarantees).
export function createServerClient() {
  return null;
}

export function createBrowserClient() {
  return null;
}
