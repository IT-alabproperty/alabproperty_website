# SEO guide — ALAB Property

> Краткая шпаргалка как держать SEO в порядке самому, не дёргая разработчика.

## Что уже сделано (база)

- **`lib/seo.ts`** — единственная точка где формируются `<title>`, `<meta description>`, Open Graph, Twitter cards и canonical URL'ы. Все страницы используют `buildMetadata()` из этого файла.
- **`app/layout.tsx`** — Organization + RealEstateAgent JSON-LD (LocalBusiness Bangkok), общий title-template.
- **`app/properties/[slug]/page.tsx`** — RealEstateListing JSON-LD + BreadcrumbList. ISR 1 час.
- **`app/blog/[slug]/page.tsx`** — BlogPosting JSON-LD + BreadcrumbList. ISR 24 часа.
- **`app/sitemap.ts`** — динамический sitemap.xml из Supabase. Обновляется каждый час.
- **`app/robots.ts`** — robots.txt со ссылкой на sitemap.
- **`app/opengraph-image.tsx`** — генератор дефолтной OG картинки 1200×630.
- **`next.config.mjs`** — security headers + image optimization (AVIF/WebP).

## Когда добавляешь новый объект (через админку)

Эти поля **критичны** для SEO:

1. **`name.ru` и `name.en`** — попадают в `<title>` страницы. Делай уникальные, описательные. Плохо: «Condo 105». Хорошо: «Condo с видом на реку в Sukhumvit, 105 м²».
2. **`description.ru` и `description.en`** — первые 320 символов идут в `<meta description>` и в JSON-LD. Пиши осмысленно — это то что видно в Google. Не копи-пасть один и тот же текст между объектами.
3. **`cover_image`** — обязательно. Это OG картинка которую видят в превью при шере в соц-сетях и в Google Discover.
4. **`address`, `bedrooms`, `bathrooms`, `area_sqm`, `price_thb`** — попадают в RealEstateListing schema. Google использует это в rich results (цена + параметры прямо в выдаче).
5. **`coordinates`** — если есть, страница попадёт в Google Maps результаты.
6. **`slug`** — должен быть человекочитаемым (`sukhumvit-river-condo`, не `condo-105`). Меняй только до публикации — после смены slug Google переиндексирует страницу заново.

## Когда добавляешь новую статью в блог

1. **`title.ru/en`** — уникальный, описательный (60–70 символов идеально).
2. **`excerpt.ru/en`** — короткое описание (150–160 символов). Идёт в meta description.
3. **`cover_image`** — обязательно (для OG превью).
4. **`published_at`** — обязательно (попадает в `datePublished` для BlogPosting schema).
5. **Контент** — пиши заголовки h2/h3 через структурные блоки. Не одна стена текста.

## Когда добавляешь новую страницу (например, `/services`)

Минимальный чек-лист в `app/services/page.tsx`:

```tsx
import { buildMetadata } from '@/lib/seo';

export const revalidate = 86400; // обновлять раз в сутки

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  return buildMetadata({
    locale,
    title: t('pages.services.title'),
    description: t('pages.services.description'),
    path: '/services',
  });
}
```

Затем:
1. Добавь переводы `SEO.pages.services.title` и `.description` в `lib/i18n/messages/ru.json` и `en.json`.
2. Добавь URL в `app/sitemap.ts` (массив `staticRoutes`).
3. Убедись что в JSX есть **один `<h1>`** на странице.

## Quick wins которые ты можешь сделать без кода

1. **Google Search Console** — зарегистрируй `alabproperty.com` и подгружай свежий `sitemap.xml` после каждого деплоя. Там же видно по каким запросам приходит трафик и какие страницы Google «считает дублями».
2. **Yandex.Webmaster** — то же самое для Yandex. RU-аудитория идёт оттуда.
3. **Уникальный контент** — Google понижает страницы с одинаковыми описаниями. Каждый объект должен иметь свой текст 50+ слов.
4. **Внутренние ссылки** — из блога ссылайся на конкретные объекты, из объекта на тематические статьи. Это даёт «вес» страницам.
5. **Обновляй цены и статус** — старые/проданные объекты с устаревшей датой Google понижает. Меняй `status: sold` или удаляй из выдачи через админку.

## Проверка после правок

После каждого деплоя стоит проверить:

```bash
# Sitemap доступен и валиден
curl -s https://alabproperty.com/sitemap.xml | head -30

# Robots.txt отдаёт правильное правило
curl -s https://alabproperty.com/robots.txt

# Конкретная страница — есть ли в HTML title, description, OG, JSON-LD
curl -s https://alabproperty.com/properties/{slug} | \
  grep -E '<title>|description|og:|application/ld\+json' | head -20
```

Или используй [Rich Results Test](https://search.google.com/test/rich-results) от Google — вставь URL, увидишь как Google «читает» структурированные данные.

## Что осталось вне базы (для разработчика)

Эти изменения требуют кодинга — обращайся:

- **Префиксный i18n routing** (`/en/properties` вместо cookie-based) — для явных `hreflang` и предотвращения duplicate content для Google.
- **SEO-поля в Supabase** (`seo_title`, `seo_description` для override стандартных) — чтобы маркетолог мог tuneить metadata из админки независимо от основных полей.
- **`<h1>` явно в DOM** на главной — сейчас он есть как `<h1>` тег внутри hero, но проверять стоит regression-тестами.
- **Performance budget** (Core Web Vitals LCP / CLS / INP в CI) — Google ранжирует и по этому.
