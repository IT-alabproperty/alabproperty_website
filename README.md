# ALAB Property
  
Premium real estate platform for Bangkok with full legal support. Bilingual (Russian / English) with multi-currency pricing.
  
## Stack
 
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v3.4** (custom theme: teak / cream / gold)
- **next-intl** for i18n (cookie-based locale, no URL segments yet)
- **Lucide React** for icons
-  

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
alab-property/
├── app/
│   ├── layout.tsx                  # fonts + providers + nav/footer
│   ├── page.tsx                    # homepage (hero + sections)
│   ├── globals.css                 # palette, textures, nav states
│   ├── properties/
│   │   ├── page.tsx                # catalog (placeholder)
│   │   └── [slug]/page.tsx         # property detail (placeholder)
│   └── legal/
│       ├── page.tsx                # article list (placeholder)
│       └── [slug]/page.tsx         # article detail (placeholder)
├── components/
│   ├── nav.tsx                     # sticky nav with dark/light states
│   ├── footer.tsx
│   ├── hero-slideshow.tsx          # hero with auto-advancing ken burns slides
│   ├── search-bar.tsx              # filter bar (type/district/area/budget)
│   ├── property-card.tsx           # listing card
│   ├── currency-context.tsx        # global currency state
│   ├── currency-switcher.tsx       # ฿ $ € ₽
│   ├── language-switcher.tsx       # RU / EN
│   ├── scroll-reveal.tsx           # IntersectionObserver-based reveal
│   └── sections/                   # homepage sections
└── lib/
    ├── types.ts                    # all TypeScript types
    ├── mock-properties.ts          # 6 sample properties + filter helpers
    ├── mock-articles.ts            # 6 sample legal articles
    ├── currency.ts                 # FX rates and price formatter
    └── i18n/
        ├── config.ts               # locales list, default locale
        ├── request.ts              # next-intl request config (reads cookie)
        └── messages/
            ├── ru.json
            └── en.json

```

## Key Design Decisions

### Currency
- All prices stored in THB. Displayed prices are converted on the fly via `lib/currency.ts`.
- User selection persists in `localStorage` under `alab.currency`.
- Smart default: RU users see RUB, EN users see USD on first visit.
- Replace static `exchangeRates` with an FX API (e.g. exchangerate.host) and a daily-cached server fetch when going to production.

### i18n
- Cookie-based locale (no URL segments). Stored as `NEXT_LOCALE` cookie.
- All localized property/article fields use `LocalizedText { ru, en }` shape.
- For SEO, you may want to migrate to URL-segmented locales (`/ru/properties` and `/en/properties`) once the catalog is built. The `next-intl` library supports both modes.

### Mock Data
- `lib/mock-properties.ts` exports `mockProperties` plus helpers: `getPropertyBySlug`, `getFeaturedProperties`, `filterProperties`.
- When the database is ready, swap these helpers for DB queries. The function signatures should stay identical so the components don't change.
- `lib/mock-articles.ts` does the same for the Legal section.

### Styling
- Tailwind handles 95% of the styling. Brand-specific things (nav scroll state transitions, ken burns animation, scroll-reveal, textures) live in `globals.css` because they need data-attribute selectors that don't translate cleanly to Tailwind variants.
- Custom palette is defined in `tailwind.config.ts` AND duplicated as CSS variables in `globals.css` (so plain CSS rules can use them too).

## Adding Real Data Later

When you wire up a backend / CRM:

1. Replace `mockProperties` and the helper functions in `lib/mock-properties.ts` with DB queries (Prisma, Drizzle, or REST/GraphQL fetches).
2. The `Property` type in `lib/types.ts` is your contract — keep DB schema aligned with it.
3. The "Get a Proposal" buttons currently do nothing — wire them to a `POST /api/leads` route that pushes to the CRM.
4. Replace `localStorage`-based currency with a server cookie if you want SSR price formatting.

## Notes on Production Readiness

- All Unsplash image URLs are placeholders; replace with self-hosted assets or a CDN before launch.
- Add proper SEO metadata per page (especially for property detail pages).
- Set up `loading.tsx` and `error.tsx` boundaries for the catalog pages.
- Add a real form for "Get a Proposal" with validation (e.g. react-hook-form + zod).
- Run a Lighthouse audit and check Cyrillic rendering across the chosen fonts.
# alab-property
# alabproperty_website
