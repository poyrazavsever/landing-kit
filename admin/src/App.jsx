import { useCallback, useEffect, useState } from 'react';
import { Home as HomeIcon, Inbox, LogOut, Store } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { api, fetchPublicSite, setCsrf, siteApi } from '@/lib/api';
import { applyTheme } from '@/lib/theme';
import { slugFromPath, useRoute } from '@/lib/router';
import { cn } from '@/lib/utils';
import { AppContext, useApp } from '@/lib/app-context';
import Login from '@/screens/Login';
import ChangePassword from '@/screens/ChangePassword';
import SitePicker from '@/screens/SitePicker';
import Home from '@/screens/Home';
import Collection from '@/screens/Collection';
import ItemForm from '@/screens/ItemForm';
import Messages from '@/screens/Messages';
import SiteInfo from '@/screens/SiteInfo';
import { ErrorState, SiteLogo } from '@/components/common';

const SLUG = slugFromPath();

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status">
      <div className="size-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <span className="sr-only">Yükleniyor</span>
    </div>
  );
}

function Shell({ children, hideNav }) {
  const { site, user, logout } = useApp();
  const route = useRoute();
  const tab = route[0] === 'mesajlar' ? 'mesajlar' : route[0] === 'bilgiler' ? 'bilgiler' : 'home';
  const tabs = [
    { key: 'home', href: '#/', label: 'Ana sayfa', icon: HomeIcon },
    {
      key: 'mesajlar',
      href: '#/mesajlar',
      label: 'Mesajlar',
      icon: Inbox,
      count: site?.unreadMessages,
    },
    { key: 'bilgiler', href: '#/bilgiler', label: 'Bilgiler', icon: Store },
  ];
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-xl items-center gap-3 px-4">
          <a
            href={user?.role === 'superadmin' && !site ? '/admin/' : '#/'}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg"
          >
            <SiteLogo site={site} className="size-10 shrink-0" />
            <span className="truncate font-heading text-lg font-bold">
              {site?.name || 'Yönetim Paneli'}
            </span>
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Çıkış yap"
            title="Çıkış yap"
          >
            <LogOut />
          </Button>
        </div>
      </header>
      <main id="main" className={cn('mx-auto max-w-xl px-4 pt-5', hideNav ? 'pb-32' : 'pb-28')}>
        {children}
      </main>
      {site && !hideNav && (
        <nav
          aria-label="Ana menü"
          className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        >
          <ul className="mx-auto grid max-w-xl grid-cols-3">
            {tabs.map(({ key, href, label, icon: Icon, count }) => (
              <li key={key}>
                <a
                  href={href}
                  aria-current={tab === key ? 'page' : undefined}
                  className={cn(
                    'relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground',
                    tab === key && 'text-accent-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-8 w-14 place-items-center rounded-full transition-colors',
                      tab === key && 'bg-accent',
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {label}
                  {count > 0 && (
                    <span className="absolute top-1.5 left-1/2 ml-3 min-w-5 rounded-full bg-brand-2 px-1.5 text-center text-[11px] leading-5 text-brand-2-foreground">
                      {count}
                      <span className="sr-only"> okunmamış</span>
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const [status, setStatus] = useState('loading'); // loading | login | ready | error
  const [user, setUser] = useState(null);
  const [sites, setSites] = useState([]);
  const [site, setSite] = useState(null);
  const [publicSite, setPublicSite] = useState(null);
  const [error, setError] = useState(null);

  const refreshSite = useCallback(async () => {
    const data = await siteApi(SLUG, 'GET', '');
    setSite(data);
    applyTheme(data.theme, data.name);
    return data;
  }, []);

  const boot = useCallback(async () => {
    try {
      const me = await api('GET', '/admin/api/me');
      setCsrf(me.csrfToken);
      setUser(me.user);
      setSites(me.sites);
      if (!SLUG) {
        if (me.user.role !== 'superadmin' && me.sites[0])
          return location.replace(`/admin/${me.sites[0].slug}`);
        applyTheme({}, 'landing-kit');
        return setStatus('ready');
      }
      if (!me.user.mustChangePassword) await refreshSite();
      setStatus('ready');
    } catch (err) {
      if (err.status === 401) return setStatus('login');
      if (err.status === 403 && err.code === 'forbidden') {
        const me = await api('GET', '/admin/api/me').catch(() => null);
        if (me?.sites?.[0]) return location.replace(`/admin/${me.sites[0].slug}`);
      }
      setError(err.message);
      setStatus('error');
    }
  }, [refreshSite]);

  useEffect(() => {
    (async () => {
      if (SLUG) {
        const pub = await fetchPublicSite(SLUG);
        if (pub) {
          setPublicSite(pub);
          applyTheme(pub.theme, pub.name);
        }
      }
      boot();
    })();
  }, [boot]);

  const logout = useCallback(async () => {
    await api('POST', '/admin/api/logout').catch(() => {});
    setCsrf(null);
    setUser(null);
    setSite(null);
    setStatus('login');
  }, []);

  const ctx = {
    slug: SLUG,
    user,
    setUser,
    site,
    setSite,
    refreshSite,
    sites,
    publicSite,
    logout,
    boot,
  };

  let screen;
  if (status === 'loading') screen = <Splash />;
  else if (status === 'error')
    screen = (
      <div className="mx-auto max-w-xl p-4 pt-16">
        <ErrorState message={error} onRetry={() => location.reload()} />
      </div>
    );
  else if (status === 'login') screen = <Login />;
  else if (user?.mustChangePassword)
    screen = (
      <Shell hideNav>
        <ChangePassword forced />
      </Shell>
    );
  else if (!SLUG)
    screen = (
      <Shell hideNav>
        <SitePicker />
      </Shell>
    );
  else if (!site) screen = <Splash />;
  else {
    const [section, a, b] = route;
    if (section === 'c' && a && b)
      screen = (
        <Shell hideNav>
          <ItemForm collectionKey={a} id={b} />
        </Shell>
      );
    else if (section === 'c' && a)
      screen = (
        <Shell>
          <Collection collectionKey={a} />
        </Shell>
      );
    else if (section === 'mesajlar')
      screen = (
        <Shell>
          <Messages />
        </Shell>
      );
    else if (section === 'bilgiler')
      screen = (
        <Shell hideNav>
          <SiteInfo />
        </Shell>
      );
    else if (section === 'sifre')
      screen = (
        <Shell hideNav>
          <ChangePassword />
        </Shell>
      );
    else
      screen = (
        <Shell>
          <Home />
        </Shell>
      );
  }

  return (
    <AppContext.Provider value={ctx}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:p-3"
      >
        İçeriğe geç
      </a>
      {screen}
      <Toaster />
    </AppContext.Provider>
  );
}
