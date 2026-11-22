import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Field, PageHeader } from '@/components/common';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { navigate } from '@/lib/router';

export default function ChangePassword({ forced = false }) {
  const { user, setUser, boot } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await api('POST', '/admin/api/password', { current, next });
      toast.success('Şifreniz değişti.');
      setUser({ ...user, mustChangePassword: false });
      if (forced) await boot();
      navigate('#/');
    } catch (err) {
      setErrors(err.status === 400 ? err.errors : { next: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        back={forced ? undefined : '#/'}
        backLabel="Ana sayfa"
        title={forced ? 'Kendi şifrenizi belirleyin' : 'Şifremi değiştir'}
        description={
          forced
            ? 'Bu ilk girişiniz. Size verilen geçici şifreyi, sadece sizin bildiğiniz bir şifreyle değiştirelim.'
            : 'Giriş şifrenizi yenileyin.'
        }
      />
      <Card>
        <CardContent>
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <Field
              label={forced ? 'Size verilen geçici şifre' : 'Şu anki şifreniz'}
              error={errors.current}
            >
              {(props) => (
                <Input
                  {...props}
                  name="current"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              )}
            </Field>
            <Field
              label="Yeni şifreniz"
              hint="En az 8 karakter. Kolay hatırlayacağınız ama başkasının tahmin edemeyeceği bir şey seçin."
              error={errors.next}
            >
              {(props) => (
                <Input
                  {...props}
                  name="next"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                />
              )}
            </Field>
            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {busy ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound aria-hidden="true" />
              )}
              Şifremi kaydet
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
