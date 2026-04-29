'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';

interface PropertyMapProps {
  lat: number;
  lng: number;
  label: string;
}

export function PropertyMap({ lat, lng, label }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      mapRef.current = map;

      // CartoDB Positron — clean, minimal, premium look
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Attribution small
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('© <a href="https://carto.com/">CARTO</a>')
        .addTo(map);

      // Zoom bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Custom gold pin marker
      const markerHtml = `
        <div style="position:relative;width:44px;height:56px">
          <div style="
            position:absolute;bottom:0;left:50%;transform:translateX(-50%);
            width:44px;height:44px;
            background:#C9A961;
            border:3px solid #2B1810;
            border-radius:50% 50% 50% 0;
            transform:translateX(-50%) rotate(-45deg);
            box-shadow:0 6px 20px rgba(43,24,16,0.35);
          "></div>
          <div style="
            position:absolute;bottom:6px;left:50%;transform:translateX(-50%);
            width:14px;height:14px;
            background:#2B1810;
            border-radius:50%;
            z-index:1;
          "></div>
        </div>`;

      const icon = L.divIcon({
        className: '',
        html: markerHtml,
        iconSize: [44, 56],
        iconAnchor: [22, 56],
        popupAnchor: [0, -56],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<div style="font-family:inherit;font-size:13px;color:#2B1810;padding:4px 2px">${label}</div>`, {
          closeButton: false,
          className: 'alab-popup',
        });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, label]);

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <style>{`
        .alab-popup .leaflet-popup-content-wrapper {
          background: #FBF8F2;
          border: 1px solid rgba(58,36,24,0.15);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(43,24,16,0.18);
          padding: 0;
        }
        .alab-popup .leaflet-popup-tip {
          background: #FBF8F2;
        }
        .alab-popup .leaflet-popup-content {
          margin: 10px 14px;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(43,24,16,0.12) !important;
        }
        .leaflet-control-zoom a {
          background: #FBF8F2 !important;
          color: #3A2418 !important;
          border: 1px solid rgba(58,36,24,0.15) !important;
          font-size: 16px !important;
          line-height: 28px !important;
          width: 30px !important;
          height: 30px !important;
        }
        .leaflet-control-zoom a:hover {
          background: #EDE3D2 !important;
        }
        .leaflet-control-attribution {
          background: rgba(251,248,242,0.8) !important;
          font-size: 10px !important;
          color: #8C7A6B !important;
        }
        .leaflet-control-attribution a { color: #8C7A6B !important; }
      `}</style>
    </>
  );
}
