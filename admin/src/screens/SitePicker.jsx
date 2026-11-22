import { ChevronRight, Store } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/common';
import { useApp } from '@/lib/app-context';

export default function SitePicker() {
  const { sites } = useApp();
  return (
    <>
      <PageHeader title="Siteler" description="Yönetmek istediğiniz işletmeyi seçin." />
      {sites.length ? (
        <ul className="flex flex-col gap-3">
          {sites.map((s) => (
            <li key={s.slug}>
              <a
                href={`/admin/${s.slug}`}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs transition-colors hover:bg-accent"
              >
                <span className="grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Store className="size-5" aria-hidden="true" />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-sm text-muted-foreground">/admin/{s.slug}</span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Store}
          title="Henüz site yok"
          description='Sunucuda "npm run site:create" komutuyla ilk müşterinizi ekleyin.'
        />
      )}
    </>
  );
}
