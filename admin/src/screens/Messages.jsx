import { useEffect, useState } from 'react';
import { Check, Inbox, Mail, MessageCircle, Phone, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ConfirmButton,
  EmptyState,
  ErrorState,
  LoadingList,
  PageHeader,
} from '@/components/common';
import { siteApi } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { cn, formatDate } from '@/lib/utils';

const digits = (v) => String(v || '').replace(/[^\d+]/g, '');
const whatsapp = (v) => {
  let d = digits(v).replace(/^\+/, '');
  if (d.startsWith('0')) d = `90${d.slice(1)}`;
  else if (d.length === 10) d = `90${d}`;
  return `https://wa.me/${d}`;
};

export default function Messages() {
  const { slug, refreshSite } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let alive = true;
    siteApi(slug, 'GET', '/messages')
      .then((result) => alive && (setData(result), setError(null)))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [slug, reloadKey]);

  async function setRead(message, read) {
    try {
      await siteApi(slug, 'PATCH', `/messages/${message.id}`, { read });
      load();
      refreshSite();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(message) {
    try {
      await siteApi(slug, 'DELETE', `/messages/${message.id}`);
      toast.success('Mesaj silindi.');
      load();
      refreshSite();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Mesajlar"
        description={
          data
            ? data.unread
              ? `${data.unread} okunmamış mesajınız var.`
              : 'Bütün mesajlar okundu.'
            : 'Sitenizdeki formdan gelen mesajlar.'
        }
      />
      {error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null);
            load();
          }}
        />
      ) : !data ? (
        <LoadingList rows={3} />
      ) : data.messages.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Henüz mesaj yok"
          description="Sitenizdeki formu dolduran müşterilerin mesajları burada görünür."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.messages.map((m) => (
            <li
              key={m.id}
              data-testid="message"
              className={cn(
                'relative overflow-hidden rounded-xl border bg-card p-4 pl-5 shadow-xs',
                !m.read && 'border-brand-2/70',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-y-0 left-0 w-1.5',
                  m.read ? 'bg-border' : 'bg-brand-2',
                )}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="flex items-center gap-2 font-sans text-[17px] font-semibold tracking-normal">
                  {m.name}
                  {!m.read && <Badge variant="new">Yeni</Badge>}
                </h2>
                <time dateTime={m.created_at} className="text-sm text-muted-foreground">
                  {formatDate(m.created_at)}
                </time>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                {m.message}
              </p>
              {(m.phone || m.email) && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {[m.phone, m.email].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {m.phone && (
                  <Button asChild size="sm">
                    <a href={`tel:${digits(m.phone)}`}>
                      <Phone aria-hidden="true" /> Ara
                    </a>
                  </Button>
                )}
                {m.phone && (
                  <Button asChild size="sm" variant="outline">
                    <a href={whatsapp(m.phone)} target="_blank" rel="noopener">
                      <MessageCircle aria-hidden="true" /> WhatsApp
                    </a>
                  </Button>
                )}
                {m.email && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`mailto:${m.email}`}>
                      <Mail aria-hidden="true" /> E-posta
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setRead(m, !m.read)}>
                  {m.read ? <RotateCcw aria-hidden="true" /> : <Check aria-hidden="true" />}
                  {m.read ? 'Okunmadı yap' : 'Okundu'}
                </Button>
                <ConfirmButton
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`${m.name} kişisinin mesajını sil`}
                  title="Mesaj silinsin mi?"
                  description={`${m.name} kişisinin mesajı kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
                  confirmLabel="Evet, sil"
                  onConfirm={() => remove(m)}
                >
                  <Trash2 aria-hidden="true" /> Sil
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data?.messages.length > 0 && (
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Mesajlar müşterilerinizin kişisel bilgilerini içerir. Sadece dönüş yapmak için kullanın;
          işiniz bitince silebilirsiniz.
        </p>
      )}
    </>
  );
}
