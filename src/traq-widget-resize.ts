const widgetOrigin = 'https://q.trap.jp';
const maximumHeight = 10000;

const getResizeMessage = (data: unknown): { href: string; height: number } | undefined => {
  if (!Array.isArray(data) || data.length < 2) return undefined;
  const [href, value] = data;
  if (typeof href !== 'string' || typeof value !== 'number') return undefined;
  if (!Number.isFinite(value) || value <= 0 || value > maximumHeight) return undefined;
  try {
    if (new URL(href).origin !== widgetOrigin) return undefined;
  } catch {
    return undefined;
  }
  return { href, height: Math.ceil(value) };
};

export const activateTraqWidgetResize = (): (() => void) => {
  const onMessage = (event: MessageEvent): void => {
    if (event.origin !== widgetOrigin) return;
    const message = getResizeMessage(event.data);
    if (message == null) return;

    for (const iframe of document.querySelectorAll<HTMLIFrameElement>('iframe[src]')) {
      try {
        if (iframe.src !== message.href || iframe.contentWindow !== event.source) continue;
        iframe.style.height = `${message.height}px`;
        iframe.height = String(message.height);
      } catch {
        continue;
      }
    }
  };

  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
};
