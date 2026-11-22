import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Field, SiteLogo } from '@/components/common';
import { api, setCsrf } from '@/lib/api';
import { useApp } from '@/lib/app-context';

export default function Login() {
  const { slug, publicSite, boot } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('POST', '/admin/api/login', { email: email.trim(), password });
      setCsrf(data.csrfToken);
      if (data.site && data.site !== slug && data.user.role !== 'superadmin') {
        location.href = `/admin/${data.site}`;
        return;
      }
      await boot();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <SiteLogo site={publicSite} className="mb-5 size-20 rounded-2xl p-1.5 shadow-lg" />
          <h1 className="text-3xl font-bold">{publicSite?.name || 'Yönetim Paneli'}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Sitenizi güncellemek için giriş yapın.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={submit} noValidate className="flex flex-col gap-5">
              <Field label="E-posta adresiniz">
                {(props) => (
                  <Input
                    {...props}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Şifreniz" error={error}>
                {(props) => (
                  <div className="relative">
                    <Input
                      {...props}
                      name="password"
                      type={show ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0.5 right-0.5"
                      aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      onClick={() => setShow((v) => !v)}
                    >
                      {show ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                )}
              </Field>
              <Button type="submit" size="lg" disabled={busy} className="mt-1 w-full">
                {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
                Giriş yap
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
          Şifrenizi mi unuttunuz? Sitenizi kuran kişiye yazın, size yeni bir geçici şifre versin.
        </p>
      </div>
    </main>
  );
}
