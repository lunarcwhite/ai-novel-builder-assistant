// Test stub for next/headers.
// Only cookies() is touched by code under test, and only after the
// isSupabaseConfigured guard — which is false in tests — so this never runs.
export async function cookies() {
  return {
    getAll: () => [],
    set: () => {},
  };
}

export function headers() {
  return new Headers();
}
