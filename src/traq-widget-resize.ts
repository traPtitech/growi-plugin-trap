const widgetOrigin = 'https://q.trap.jp';
const maximumHeight = 10000;

const getHeight = (data: unknown): number | undefined => {
  const value = typeof data === 'number'
    ? data
    : typeof data === 'object' && data != null && 'height' in data
      ? (data as { height: unknown }).height
      : undefined;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= maximumHeight
    ? Math.ceil(value)
    : undefined;
};

export const activateTraqWidgetResize = (): (() => void) => {
  const onMessage = (event: MessageEvent): void => {
    if (event.origin !== widgetOrigin) return;
    const height = getHeight(event.data);
    if (height == null) return;

    for (const iframe of document.querySelectorAll<HTMLIFrameElement>('iframe[src]')) {
      try {
        if (new URL(iframe.src).origin !== widgetOrigin || iframe.contentWindow !== event.source) continue;
        iframe.style.height = `${height}px`;
        iframe.height = String(height);
      } catch {
        continue;
      }
    }
  };

  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
};
