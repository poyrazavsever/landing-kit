import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Field, PageHeader, PhotoPicker, StickyActions } from '@/components/common';
import { siteApi } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { FONT_CHOICES } from '@/lib/theme';
import { navigate } from '@/lib/router';
import { cn, DAYS } from '@/lib/utils';

function initialHours(site) {
  const hours =
    site.opening_hours?.length === 7
      ? site.opening_hours
      : DAYS.map(() => ({ open: '09:00', close: '19:00', closed: false }));
  return hours.map((d) => ({ open: d.open, close: d.close, closed: Boolean(d.closed) }));
}

export default function SiteInfo() {
  const { slug, site, user, refreshSite } = useApp();
  const isSuper = user.role === 'superadmin';
  const [form, setForm] = useState({
    name: site.name || '',
    phone: site.phone || '',
    whatsapp: site.whatsapp || '',
    contact_email: site.contact_email || '',
    address: site.address || '',
    hours_note: site.hours_note || '',
    domains: (site.domains || []).join('\n'),
    collections: site.collections.map((c) => c.key).join(', '),
    color_primary: site.theme.primary || '#2f54eb',
    color_secondary: site.theme.secondary || '#c6f432',
    font_family: site.theme.font || '',
    logo_path: site.theme.logo || '',
    telegram_chat_id: site.telegram_chat_id || '',
  });
  const [hours, setHours] = useState(() => initialHours(site));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const bind = (key) => ({
    name: key,
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });
  const setDay = (i, patch) =>
    setHours((list) => list.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    const body = {
      name: form.name,
      phone: form.phone,
      whatsapp: form.whatsapp,
      contact_email: form.contact_email,
      address: form.address,
      hours_note: form.hours_note,
      opening_hours: hours,
    };
    if (isSuper) {
      Object.assign(body, {
        domains: form.domains.split(/\s+/).filter(Boolean),
        collections: form.collections.split(/[\s,]+/).filter(Boolean),
        color_primary: form.color_primary,
        color_secondary: form.color_secondary,
        font_family: form.font_family,
        logo_path: form.logo_path,
        telegram_chat_id: form.telegram_chat_id,
      });
    }
    try {
      await siteApi(slug, 'PATCH', '', body);
      await refreshSite();
      toast.success('Bilgiler kaydedildi.');
      navigate('#/');
    } catch (err) {
      if (err.status === 400) {
        setErrors(err.errors);
        toast.error('Lütfen işaretli alanları düzeltin.');
      } else toast.error(err.message);
      setBusy(false);
    }
  }

  const hoursError = Object.entries(errors).find(([k]) => k.startsWith('opening_hours'))?.[1];

  return (
    <>
      <PageHeader
        back="#/"
        backLabel="Ana sayfa"
        title="İşletme bilgileri"
        description="Sitenizde görünen iletişim bilgileri ve çalışma saatleri."
      />
      <form id="site-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>İletişim</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field label="İşletme adı" error={errors.name}>
              {(p) => <Input {...p} {...bind('name')} />}
            </Field>
            <Field label="Telefon" hint="Örn: 0555 123 45 67" error={errors.phone}>
              {(p) => <Input {...p} {...bind('phone')} type="tel" inputMode="tel" />}
            </Field>
            <Field label="WhatsApp numarası" error={errors.whatsapp}>
              {(p) => <Input {...p} {...bind('whatsapp')} type="tel" inputMode="tel" />}
            </Field>
            <Field label="Mesajların geleceği e-posta" error={errors.contact_email}>
              {(p) => <Input {...p} {...bind('contact_email')} type="email" inputMode="email" />}
            </Field>
            <Field label="Adres" error={errors.address}>
              {(p) => <Textarea {...p} {...bind('address')} rows={3} className="min-h-20" />}
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Çalışma saatleri</CardTitle>
            <CardDescription>Kapalı olduğunuz günlerde anahtarı kapatın.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {hoursError && <p className="text-sm font-medium text-destructive">{hoursError}</p>}
            {hours.map((d, i) => (
              <div
                key={DAYS[i]}
                className={cn(
                  'grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-lg border p-3',
                  d.closed && 'bg-muted/50',
                )}
                data-testid="hours-row"
              >
                <span className="font-semibold">{DAYS[i]}</span>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {d.closed ? 'Kapalı' : 'Açık'}
                  <Switch
                    checked={!d.closed}
                    onCheckedChange={(open) => setDay(i, { closed: !open })}
                    aria-label={`${DAYS[i]} açık`}
                  />
                </label>
                {!d.closed && (
                  <div className="col-span-2 grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={d.open}
                      onChange={(e) => setDay(i, { open: e.target.value })}
                      aria-label={`${DAYS[i]} açılış`}
                      className="h-11"
                    />
                    <Input
                      type="time"
                      value={d.close}
                      onChange={(e) => setDay(i, { close: e.target.value })}
                      aria-label={`${DAYS[i]} kapanış`}
                      className="h-11"
                    />
                  </div>
                )}
              </div>
            ))}
            <Field
              label="Not (isteğe bağlı)"
              hint="Örn: Bayramın ilk günü kapalıyız."
              error={errors.hours_note}
              className="mt-3"
            >
              {(p) => <Input {...p} {...bind('hours_note')} />}
            </Field>
          </CardContent>
        </Card>

        {isSuper && (
          <Card>
            <CardHeader>
              <CardTitle>Tema ve teknik ayarlar</CardTitle>
              <CardDescription>Bu bölümü sadece siz (yönetici) görürsünüz.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <PhotoPicker
                label="Logo"
                aspect="aspect-[3/1]"
                value={form.logo_path}
                onChange={(path) => setForm((f) => ({ ...f, logo_path: path }))}
                upload={(data) => siteApi(slug, 'POST', '/uploads', data)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ana renk" error={errors.color_primary}>
                  {(p) => (
                    <Input {...p} {...bind('color_primary')} type="color" className="h-12 p-1.5" />
                  )}
                </Field>
                <Field label="İkinci renk" error={errors.color_secondary}>
                  {(p) => (
                    <Input
                      {...p}
                      {...bind('color_secondary')}
                      type="color"
                      className="h-12 p-1.5"
                    />
                  )}
                </Field>
              </div>
              <Field
                label="Başlık yazı tipi"
                hint={`Panelde gömülü olanlar: ${FONT_CHOICES.join(', ')}`}
                error={errors.font_family}
              >
                {(p) => <Input {...p} {...bind('font_family')} list="font-choices" />}
              </Field>
              <datalist id="font-choices">
                {FONT_CHOICES.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
              <Field
                label="İzinli alan adları (her satıra bir tane)"
                hint="Örn: eniyietler.com veya http://localhost:5500"
                error={errors.domains}
              >
                {(p) => <Textarea {...p} {...bind('domains')} rows={3} className="min-h-20" />}
              </Field>
              <Field
                label="Bölümler (virgülle)"
                hint="Örn: menu, campaigns, gallery"
                error={errors.collections}
              >
                {(p) => <Input {...p} {...bind('collections')} />}
              </Field>
              <Field label="Telegram chat id (isteğe bağlı)" error={errors.telegram_chat_id}>
                {(p) => <Input {...p} {...bind('telegram_chat_id')} inputMode="numeric" />}
              </Field>
            </CardContent>
          </Card>
        )}

        <StickyActions>
          <Button type="submit" form="site-form" size="lg" className="flex-1" disabled={busy}>
            {busy ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            Kaydet
          </Button>
        </StickyActions>
      </form>
    </>
  );
}
