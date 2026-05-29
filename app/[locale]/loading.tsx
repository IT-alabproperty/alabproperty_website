import { RouteLoading } from '@/components/route-loading';

// Next.js auto-uses this as the Suspense fallback for any route under [locale].
// The loader itself stays invisible for the first second (CSS animation-delay),
// so quick navigations show no flicker — only genuinely slow loads do.
export default function Loading() {
  return <RouteLoading />;
}
