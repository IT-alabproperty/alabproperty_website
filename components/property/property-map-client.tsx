'use client';

import dynamic from 'next/dynamic';

const PropertyMap = dynamic(
  () => import('./property-map').then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-cream-warm rounded-lg" />,
  }
);

export function PropertyMapClient({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  return <PropertyMap lat={lat} lng={lng} label={label} />;
}
