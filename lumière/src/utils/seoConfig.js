export const SITE_URL = 'https://deladysbeautyworld.com';

export function getCanonicalUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}