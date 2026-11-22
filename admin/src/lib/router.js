import { useEffect, useState } from 'react';

// Hash routes keep deep links working with the plain static server:
// #/  #/c/<collection>  #/c/<collection>/<id|yeni>  #/mesajlar  #/bilgiler  #/sifre
function parse() {
  return (location.hash.replace(/^#\/?/, '') || '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);
}

export function useRoute() {
  const [parts, setParts] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setParts(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parts;
}

export function navigate(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

/** /admin/<slug> -> slug ('' on /admin/) */
export function slugFromPath() {
  const m = location.pathname.match(/^\/admin\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : '';
}
