'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatMoney, translator, type Locale } from '@/lib/i18n';
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({
  locale: 'es',
  setLocale: () => {},
});
export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, update] = useState(initialLocale);
  const router = useRouter();
  useEffect(() => {
    update(initialLocale);
  }, [initialLocale]);
  const value = useMemo(
    () => ({
      locale,
      setLocale(next: Locale) {
        document.cookie = `steadier-locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        document.documentElement.lang = next;
        update(next);
        router.refresh();
      },
    }),
    [locale, router],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useI18n() {
  const { locale, setLocale } = useContext(LocaleContext);
  return useMemo(
    () => ({
      locale,
      setLocale,
      tr: translator(locale),
      money: (value: number) => formatMoney(value, locale),
      dateLabel: (value: string) => formatDate(value, locale),
    }),
    [locale, setLocale],
  );
}
export function LanguageSwitcher() {
  const { locale, setLocale, tr } = useI18n();
  return (
    <label className="language-switcher">
      <span>{tr('Language')}</span>
      <select
        aria-label={tr('Language on this device')}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        <option value="es" lang="es">
          Español
        </option>
        <option value="en" lang="en">
          English
        </option>
      </select>
    </label>
  );
}
