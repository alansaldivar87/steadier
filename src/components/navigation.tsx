'use client';
import {
  Home,
  Wallet,
  CalendarDays,
  Files,
  MessageCircle,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useI18n } from './i18n';
import type { Snapshot } from './client-utils';
export type Section = 'today' | 'money' | 'plan' | 'documents' | 'coach' | 'settings';
export const sectionTitles: Record<Section, string> = {
  today: 'Today',
  money: 'Money',
  plan: 'Plan',
  documents: 'Documents',
  coach: 'Money coach',
  settings: 'Household',
};
const items = [
  ['today', Home],
  ['money', Wallet],
  ['plan', CalendarDays],
  ['documents', Files],
  ['coach', MessageCircle],
  ['settings', Settings],
] as const;
export default function Navigation({
  section,
  navigate,
  s,
}: {
  section: Section;
  navigate: (section: Section) => void;
  s: Snapshot;
}) {
  const { tr } = useI18n();
  const pending = s.data.drafts.filter((d) => d.status === 'pending').length;
  const button = ([key, Icon]: (typeof items)[number]) => (
    <button
      key={key}
      type="button"
      className={section === key ? 'active' : ''}
      aria-current={section === key ? 'page' : undefined}
      onClick={() => navigate(key)}
    >
      <span className="nav-icon">
        <Icon size={20} />
        {key === 'documents' && pending > 0 && (
          <b aria-label={tr('Suggestions to review')}>{pending}</b>
        )}
      </span>
      <span>{tr(sectionTitles[key])}</span>
    </button>
  );
  return (
    <>
      <aside className="app-sidebar">
        <a className="app-wordmark" href="/" aria-label="Steadier">
          <span>s</span>steadier
        </a>
        <div className="workspace-name">
          <small>{tr('MY MONEY, MADE CLEAR')}</small>
          <strong>
            {s.data.settings.name === 'Our household' ? tr('Our household') : s.data.settings.name}
          </strong>
        </div>
        <nav aria-label={tr('Main navigation')}>{items.map(button)}</nav>
        <div className="nav-bottom">
          <ShieldCheck size={18} />
          <p>{tr('Small steps. Real progress.')}</p>
          <div className="nav-member">
            <span>{s.member.name.charAt(0)}</span>
            <div>
              <strong>{s.member.local ? tr('Local workspace') : s.member.name}</strong>
              <small>
                {s.member.local ? tr('Set up shared access in Household') : s.member.email}
              </small>
            </div>
          </div>
          {!s.member.local && (
            <button className="text-button" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut size={16} />
              {tr('Sign out')}
            </button>
          )}
        </div>
      </aside>
      <nav className="mobile-tabs" aria-label={tr('Main navigation')}>
        {items.slice(0, 4).map(button)}
      </nav>
    </>
  );
}
