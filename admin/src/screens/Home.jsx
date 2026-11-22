import {
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Images,
  Inbox,
  KeyRound,
  LayoutList,
  Megaphone,
  Scissors,
  ShoppingBag,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/app-context';
import { cn } from '@/lib/utils';

const ICONS = {
  menu: UtensilsCrossed,
  services: Scissors,
  products: ShoppingBag,
  campaigns: Megaphone,
  gallery: Images,
  faq: HelpCircle,
};

function Tile({ href, icon: Icon, title, meta, badge, highlight, external }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      className={cn(
        'group flex min-h-20 items-center gap-4 rounded-xl border bg-card p-4 shadow-xs transition-[background-color,box-shadow]',
        'hover:bg-accent/60 hover:shadow-sm',
        highlight && 'border-brand-2 ring-1 ring-brand-2',
      )}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-[17px] font-semibold">
          {title} {badge}
        </span>
        {meta && <span className="truncate text-sm text-muted-foreground">{meta}</span>}
      </span>
      {external ? (
        <ExternalLink className="size-5 text-muted-foreground" aria-hidden="true" />
      ) : (
        <ChevronRight
          className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </a>
  );
}

function siteUrl(site) {
  const domain = (site.domains || []).find((d) => !/localhost|127\.0\.0\.1/.test(d));
  if (!domain) return null;
  return /^https?:\/\//.test(domain) ? domain : `https://${domain}`;
}

export default function Home() {
  const { site, user } = useApp();
  const url = siteUrl(site);
  return (
    <>
      {user.role === 'superadmin' && (
        <a
          href="/admin/"
          className="mb-2 inline-flex h-11 items-center text-[15px] font-semibold text-accent-foreground"
        >
          ← Bütün siteler
        </a>
      )}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold leading-tight">Merhaba!</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
          Ne yapmak istersiniz? Yaptığınız değişiklikler sitede hemen görünür.
        </p>
      </div>

      <section aria-labelledby="sections-title" className="mb-6">
        <h2
          id="sections-title"
          className="mb-3 font-sans text-sm font-semibold tracking-wide text-muted-foreground uppercase"
        >
          Sitenizin bölümleri
        </h2>
        <div className="flex flex-col gap-3">
          {site.collections.map((c) => (
            <Tile
              key={c.key}
              href={`#/c/${c.key}`}
              icon={ICONS[c.key] || LayoutList}
              title={c.label}
              meta={
                c.total ? `${c.active} görünür · ${c.total - c.active} gizli` : 'Henüz kayıt yok'
              }
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="other-title" className="flex flex-col gap-3">
        <h2
          id="other-title"
          className="mb-0 font-sans text-sm font-semibold tracking-wide text-muted-foreground uppercase"
        >
          İşletmeniz
        </h2>
        <Tile
          href="#/mesajlar"
          icon={Inbox}
          title="Mesajlar"
          meta="Siteden gelen iletişim formları"
          highlight={site.unreadMessages > 0}
          badge={site.unreadMessages > 0 && <Badge variant="new">{site.unreadMessages} yeni</Badge>}
        />
        <Tile
          href="#/bilgiler"
          icon={Store}
          title="İşletme bilgileri"
          meta="Telefon, adres, çalışma saatleri"
        />
        <Tile
          href="#/sifre"
          icon={KeyRound}
          title="Şifremi değiştir"
          meta="Giriş şifrenizi yenileyin"
        />
        {url && (
          <Tile
            href={url}
            icon={ExternalLink}
            title="Sitemi aç"
            meta={url.replace(/^https?:\/\//, '')}
            external
          />
        )}
      </section>
    </>
  );
}
