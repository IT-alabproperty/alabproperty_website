import { ImageResponse } from 'next/og';

// Site-wide OG image. Per-page routes override this with their own
// generateMetadata.openGraph.images; this file is the default that ships
// in <meta property="og:image"> when nothing more specific is set.
export const runtime = 'edge';
export const alt = 'ALAB Property — Real Estate & Legal Counsel in Thailand';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'linear-gradient(135deg, #2B1810 0%, #3A2418 60%, #5C3A26 100%)',
          color: '#F5EFE6',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 22,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#C9A961',
          }}
        >
          ALAB · Property
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/*
            Satori (the JSX→PNG engine behind ImageResponse) requires every
            <div> with children to have an explicit `display`. Without it,
            Vercel logs "Expected <div> to have explicit display: flex"
            warnings on every OG fetch.
          */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: 92,
              lineHeight: 1.05,
              fontWeight: 400,
              letterSpacing: '-0.02em',
              maxWidth: 980,
            }}
          >
            Real Estate &amp;{' '}
            <span style={{ color: '#C9A961', fontStyle: 'italic' }}>
              Legal Counsel
            </span>{' '}
            in Thailand
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 32,
              fontSize: 28,
              color: '#F5EFE6',
              opacity: 0.78,
              maxWidth: 860,
            }}
          >
            Bangkok · Pattaya — bilingual transactions, in-house legal team.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 20,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#F5EFE6',
            opacity: 0.6,
          }}
        >
          <span>alabproperty.com</span>
          <span>Est. 2018</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
