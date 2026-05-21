'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

/**
 * Регистрирует просмотр объекта.
 * Один объект на сессию = один просмотр (защита от накруток F5).
 * fire-and-forget: ошибка отправки не должна влиять на пользователя.
 */
export function ViewTracker({ slug }: { slug: string }) {
  const locale = useLocale();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    fetch('/api/properties/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, locale }),
      keepalive: true, // запрос не отменится если юзер сразу ушёл
    }).catch(() => {
      // молча — это аналитика, не критично
    });
  }, [slug, locale]);

  return null;
}
