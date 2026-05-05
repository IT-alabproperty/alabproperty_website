import { getLocale } from 'next-intl/server';

export default async function ContactsPage() {
  const locale = await getLocale();
  const isRu = locale === 'ru';

  return (
    <main className="min-h-screen pt-36 pb-24 px-6 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[760px]">
        <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-gold-deep">
          {isRu ? 'Контакты' : 'Contact'}
        </p>
        <h1 className="font-serif text-[clamp(36px,6vw,64px)] font-light leading-[1.05] text-teak">
          {isRu ? 'Свяжитесь с нами' : 'Get in touch'}
        </h1>
        <div className="mt-12 space-y-4 text-[15px] text-teak/70">
          <p>Bangkok, Thailand</p>
          <p>
            <a href="mailto:info@alabproperty.com" className="text-gold-deep hover:underline">
              info@alabproperty.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
