// Intentionally empty — the LoadingScreen splash lives in layout.tsx
// and only shows once per session. Using it here as a page-level Suspense
// fallback caused the main page content to be replaced with a blank
// screen on every client-side navigation.
export default function Loading() {
  return null;
}
