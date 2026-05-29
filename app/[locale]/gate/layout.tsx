import type { Metadata } from 'next';

// /gate is the password screen — never index it.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: 'ALAB Property',
};

export default function GateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
