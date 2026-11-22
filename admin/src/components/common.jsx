import { useId, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { shrinkImage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DEFAULT_LOGO } from '@/lib/theme';

export function SiteLogo({ site, className }) {
  return (
    <img
      src={site?.theme?.logo || DEFAULT_LOGO}
      alt=""
      className={cn('rounded-xl bg-white object-contain ring-1 ring-black/5', className)}
    />
  );
}

export function PageHeader({ title, description, back, backLabel = 'Geri', action }) {
  return (
    <div className="mb-5 flex flex-col gap-1">
      {back && (
        <a
          href={back}
          className="-ml-2 mb-1 inline-flex h-11 w-fit items-center gap-1.5 rounded-lg px-2 text-[15px] font-semibold text-accent-foreground hover:bg-accent"
        >
          <ArrowLeft className="size-[18px]" aria-hidden="true" />
          {backLabel}
        </a>
      )}
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
        {action}
      </div>
      {description && (
        <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/** Label + control + hint + error, wired with aria attributes. */
export function Field({ label, hint, error, children, className }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center">
      {Icon && (
        <div className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Icon className="size-7" aria-hidden="true" />
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-xs text-[15px] text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
    >
      <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
      <p className="text-[15px] font-medium">{message || 'Bir şeyler ters gitti.'}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tekrar dene
        </Button>
      )}
    </div>
  );
}

export function LoadingList({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Yükleniyor">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <Skeleton className="size-16 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Button that asks for confirmation first (bottom sheet on phones). */
export function ConfirmButton({
  title,
  description,
  confirmLabel = 'Sil',
  onConfirm,
  children,
  ...buttonProps
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button {...buttonProps}>{children}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Camera / gallery picker with preview. upload(file) must resolve to { path }. */
export function PhotoPicker({
  value,
  onChange,
  upload,
  label = 'Fotoğraf',
  aspect = 'aspect-[4/3]',
}) {
  const camera = useRef(null);
  const gallery = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handle(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const small = await shrinkImage(file);
      const data = new FormData();
      data.append('image', small, small.name || 'foto.jpg');
      const res = await upload(data);
      onChange(res.path);
      toast.success('Fotoğraf yüklendi. Kaydetmeyi unutmayın.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold">{label}</span>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-dashed bg-muted',
          aspect,
        )}
      >
        {value ? (
          <img
            src={value}
            alt="Seçilen fotoğraf"
            className="size-full object-cover"
            data-testid="photo-preview"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImagePlus className="size-9" aria-hidden="true" />
            <span className="text-sm">Henüz fotoğraf yok</span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-card/70" role="status">
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Fotoğraf yükleniyor</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => camera.current.click()}
        >
          <Camera aria-hidden="true" /> Fotoğraf çek
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => gallery.current.click()}
        >
          <ImagePlus aria-hidden="true" /> Galeriden seç
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            className="col-span-2 text-destructive"
            onClick={() => onChange('')}
          >
            <Trash2 aria-hidden="true" /> Fotoğrafı kaldır
          </Button>
        )}
      </div>
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handle}
      />
      <input
        ref={gallery}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handle}
        data-testid="gallery-input"
      />
    </div>
  );
}

/** Fixed bottom bar for the main action of a form screen (thumb reach on phones). */
export function StickyActions({ children }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto flex max-w-xl gap-2">{children}</div>
    </div>
  );
}
