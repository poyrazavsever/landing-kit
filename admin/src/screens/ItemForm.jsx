import { useEffect, useState } from 'react';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ConfirmButton,
  ErrorState,
  Field,
  PageHeader,
  PhotoPicker,
  StickyActions,
} from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { siteApi } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { navigate } from '@/lib/router';

const EMPTY = { title: '', description: '', price: '', image: '', active: true };

export default function ItemForm({ collectionKey, id }) {
  const { slug, site, refreshSite } = useApp();
  const isNew = id === 'yeni';
  const col = site.collections.find((c) => c.key === collectionKey) || { label: collectionKey };
  const [item, setItem] = useState(isNew ? EMPTY : null);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    siteApi(slug, 'GET', `/items?collection=${encodeURIComponent(collectionKey)}`)
      .then((data) => {
        const found = data.items.find((i) => String(i.id) === String(id));
        if (!found) throw new Error('Kayıt bulunamadı.');
        setItem({
          ...found,
          description: found.description || '',
          image: found.image || '',
          price: found.price === null ? '' : String(found.price).replace('.', ','),
        });
      })
      .catch((err) => setLoadError(err.message));
  }, [slug, collectionKey, id, isNew]);

  const set = (key) => (value) => setItem((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    const body = {
      title: item.title,
      description: item.description,
      price: item.price,
      image: item.image,
      active: item.active,
    };
    try {
      if (isNew) await siteApi(slug, 'POST', '/items', { ...body, collection: collectionKey });
      else await siteApi(slug, 'PATCH', `/items/${id}`, body);
      toast.success(isNew ? 'Eklendi. Sitede görünüyor.' : 'Kaydedildi.');
      refreshSite();
      navigate(`#/c/${collectionKey}`);
    } catch (err) {
      if (err.status === 400) {
        setErrors(err.errors);
        toast.error('Lütfen işaretli alanları düzeltin.');
      } else toast.error(err.message);
      setBusy(false);
    }
  }

  async function remove() {
    try {
      await siteApi(slug, 'DELETE', `/items/${id}`);
      toast.success('Silindi.');
      refreshSite();
      navigate(`#/c/${collectionKey}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <PageHeader
        back={`#/c/${collectionKey}`}
        backLabel={col.label}
        title={isNew ? 'Yeni ekle' : 'Düzenle'}
      />
      {loadError ? (
        <ErrorState message={loadError} onRetry={() => location.reload()} />
      ) : !item ? (
        <div className="flex flex-col gap-4" role="status" aria-label="Yükleniyor">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <form id="item-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-5">
              <PhotoPicker
                value={item.image}
                onChange={set('image')}
                upload={(data) => siteApi(slug, 'POST', '/uploads', data)}
              />
              <Field
                label="Başlık"
                hint={
                  collectionKey === 'campaigns'
                    ? 'Örn: Hafta içi öğle menüsü 349 TL'
                    : 'Örn: Dana Antrikot'
                }
                error={errors.title}
              >
                {(props) => (
                  <Input
                    {...props}
                    name="title"
                    required
                    maxLength={120}
                    value={item.title}
                    onChange={(e) => set('title')(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Açıklama (isteğe bağlı)" error={errors.description}>
                {(props) => (
                  <Textarea
                    {...props}
                    name="description"
                    maxLength={1000}
                    rows={3}
                    value={item.description}
                    onChange={(e) => set('description')(e.target.value)}
                  />
                )}
              </Field>
              <Field
                label="Fiyat (isteğe bağlı)"
                hint="Sadece rakam: 150 ya da 149,90"
                error={errors.price}
              >
                {(props) => (
                  <div className="relative">
                    <Input
                      {...props}
                      name="price"
                      inputMode="decimal"
                      placeholder="Örn: 150"
                      className="pr-10 tabular-nums"
                      value={item.price}
                      onChange={(e) => set('price')(e.target.value)}
                    />
                    <span
                      className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-semibold text-muted-foreground"
                      aria-hidden="true"
                    >
                      ₺
                    </span>
                  </div>
                )}
              </Field>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/60 p-4">
                <Label htmlFor="active" className="flex-col items-start gap-1">
                  Sitede göster
                  <span className="text-sm font-normal text-muted-foreground">
                    Kapalıysa kayıt saklanır ama sitede görünmez.
                  </span>
                </Label>
                <Switch
                  id="active"
                  name="active"
                  checked={item.active}
                  onCheckedChange={set('active')}
                />
              </div>
            </CardContent>
          </Card>
          {!isNew && (
            <ConfirmButton
              variant="ghost"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              title={`"${item.title}" silinsin mi?`}
              description='Bu işlem geri alınamaz. Sadece bir süre saklamak istiyorsanız "Sitede göster" anahtarını kapatın.'
              confirmLabel="Evet, sil"
              onConfirm={remove}
            >
              <Trash2 aria-hidden="true" /> Bu kaydı sil
            </ConfirmButton>
          )}
          <StickyActions>
            <Button type="submit" form="item-form" size="lg" className="flex-1" disabled={busy}>
              {busy ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
              {isNew ? 'Ekle' : 'Kaydet'}
            </Button>
          </StickyActions>
        </form>
      )}
    </>
  );
}
