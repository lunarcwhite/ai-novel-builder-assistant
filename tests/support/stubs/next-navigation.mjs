// Test stub for next/navigation.
// Only redirect()/notFound() are touched by code under test (auth guards).
// redirect() mirrors the real behavior of throwing a NEXT_REDIRECT digest.
export function redirect(url) {
  const err = new Error(`NEXT_REDIRECT: ${url}`);
  err.digest = `NEXT_REDIRECT;${url}`;
  throw err;
}

export function notFound() {
  const err = new Error("NEXT_NOT_FOUND");
  err.digest = "NEXT_NOT_FOUND";
  throw err;
}
