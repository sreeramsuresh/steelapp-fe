// Cross-environment UUID v4 generator with fallbacks
// Uses crypto.randomUUID when available, then crypto.getRandomValues, then Math.random

export function uuid() {
  const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
  const c = g.crypto || (g.msCrypto /* IE11 */);

  if (c && typeof c.randomUUID === 'function') {
    try { 
      return c.randomUUID(); 
    } catch {
      // Ignore - fall through to next UUID generation method
    }
  }

  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    // Per RFC 4122 v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8,10).join(''),
      hex.slice(10,16).join('')
    ].join('-');
  }

  // Last-resort non-crypto fallback
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-';
    else if (i === 14) s += '4';
    else {
      const r = (Math.random() * 16) | 0;
      s += (i === 19 ? (r & 0x3) | 0x8 : r).toString(16);
    }
  }
  return s;
}

