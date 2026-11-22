import { Toaster as Sonner } from 'sonner';

function Toaster(props) {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      offset={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
      toastOptions={{ classNames: { toast: 'font-sans !text-[15px] !rounded-xl' } }}
      style={{
        '--normal-bg': 'var(--card)',
        '--normal-text': 'var(--foreground)',
        '--normal-border': 'var(--border)',
      }}
      {...props}
    />
  );
}

export { Toaster };
