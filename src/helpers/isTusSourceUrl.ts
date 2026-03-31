/**
 * Returns true for temporary upload source URLs used during import (TUS-style flow),
 * hosted on the Sardius uploads CDN (`uploads-*.sardius.media`, including alpha).
 */
const UPLOADS_SOURCE_HOST_RE = /^uploads-.+\.sardius\.media$/i;

export default function isTusSourceUrl(url: string): boolean {
  try {
    return UPLOADS_SOURCE_HOST_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
}
