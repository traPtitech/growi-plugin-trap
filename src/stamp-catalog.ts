export const traqOrigin = 'https://q.trap.jp';
export const traqStampNames = new Set<string>();

export const addTraqStampStylesheet = (): HTMLLinkElement => {
  const existing = document.querySelector<HTMLLinkElement>('#traq-stamp-stylesheet');
  if (existing != null) return existing;
  const link = document.createElement('link');
  link.id = 'traq-stamp-stylesheet';
  link.rel = 'stylesheet';
  link.href = `${traqOrigin}/api/1.0/public/emoji.css`;
  document.head.append(link);
  return link;
};

export const loadTraqStampNames = async (signal: AbortSignal): Promise<void> => {
  try {
    const response = await fetch(`${traqOrigin}/api/1.0/public/emoji.json`, {
      mode: 'cors',
      signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
    });
    if (!response.ok) return;
    const value: unknown = await response.json();
    if (value == null || typeof value !== 'object' || Array.isArray(value)) return;
    const groups = Object.values(value);
    if (!groups.every((group) => Array.isArray(group) && group.every((name) => typeof name === 'string'))) return;
    for (const name of groups.flat()) {
      if (typeof name === 'string' && /^[a-zA-Z0-9+_-]{1,32}$/.test(name)) {
        traqStampNames.add(name);
      }
    }
  } catch {
    // Keep ordinary GROWI emoji rendering available when traQ is unreachable.
  }
};
