import './src/styles.css';

import { legacyMarkdownRemarkPlugin } from './src/legacy-markdown';
import { activateTraqWidgetResize } from './src/traq-widget-resize';
import {
  addTraqStampStylesheet,
  loadTraqStampNames,
  traqOrigin,
  traqStampNames,
} from './src/stamp-catalog';

type RendererOptions = { remarkPlugins?: unknown[] };
type Generator = (...args: unknown[]) => RendererOptions | Promise<RendererOptions>;
type GrowiFacade = {
  markdownRenderer?: {
    optionsGenerators?: Record<string, Generator | undefined>;
  };
};
type PluginActivator = { activate: () => void; deactivate: () => void };

declare global {
  interface Window {
    growiFacade?: GrowiFacade;
    pluginActivators?: Record<string, PluginActivator>;
  }
}

const originals = new Map<string, Generator>();
let abortController: AbortController | undefined;
let removeWidgetResize: (() => void) | undefined;
let stampStylesheet: HTMLLinkElement | undefined;
let catalogPromise: Promise<void> = Promise.resolve();

const withLegacyMarkdown = (options: RendererOptions): RendererOptions => {
  if (Array.isArray(options.remarkPlugins)) {
    options.remarkPlugins.unshift([
      legacyMarkdownRemarkPlugin,
      { origin: traqOrigin, names: traqStampNames },
    ]);
  }
  return options;
};

const activate = (): void => {
  const generators = window.growiFacade?.markdownRenderer?.optionsGenerators;
  if (generators == null) return;

  abortController ??= new AbortController();
  stampStylesheet ??= addTraqStampStylesheet();
  catalogPromise = loadTraqStampNames(abortController.signal);

  for (const name of ['generateViewOptions', 'generatePreviewOptions']) {
    const generator = generators[name];
    if (generator == null || originals.has(name)) continue;
    const wrapped: Generator = async function (this: unknown, ...args) {
      await catalogPromise;
      const options = await generator.apply(this, args);
      return withLegacyMarkdown(options);
    };
    originals.set(name, generator);
    generators[name] = wrapped;
  }

  removeWidgetResize ??= activateTraqWidgetResize();
};

const deactivate = (): void => {
  const generators = window.growiFacade?.markdownRenderer?.optionsGenerators;
  if (generators != null) {
    for (const [name, original] of originals) generators[name] = original;
  }
  originals.clear();
  abortController?.abort();
  abortController = undefined;
  stampStylesheet?.remove();
  stampStylesheet = undefined;
  removeWidgetResize?.();
  removeWidgetResize = undefined;
};

window.pluginActivators ??= {};
window.pluginActivators['growi-plugin-trap'] = { activate, deactivate };
