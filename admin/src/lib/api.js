// Thin client for the admin API (src/routes/admin.js). The CSRF token comes from
// /login and /me and is sent back on every write.
let csrfToken = null;

export function setCsrf(token) {
  csrfToken = token;
}

export class ApiError extends Error {
  constructor(status, data) {
    super(data.message || 'Bir hata oluştu.');
    this.status = status;
    this.code = data.error;
    this.errors = data.errors || {};
  }
}

export async function api(method, url, body) {
  const opts = { method, headers: { Accept: 'application/json' }, credentials: 'same-origin' };
  if (csrfToken) opts.headers['X-CSRF-Token'] = csrfToken;
  if (body instanceof FormData) opts.body = body;
  else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new ApiError(0, {
      message: 'Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.',
    });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const siteApi = (slug, method, path, body) =>
  api(method, `/admin/api/sites/${encodeURIComponent(slug)}${path}`, body);

/** Public site info: used to brand the login screen before anyone logs in. */
export async function fetchPublicSite(slug) {
  try {
    const res = await fetch(`/api/sites/${encodeURIComponent(slug)}`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** Shrinks big phone photos before upload (keeps uploads fast on mobile data). */
export async function shrinkImage(file, maxSide = 1600) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || !window.createImageBitmap) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}
