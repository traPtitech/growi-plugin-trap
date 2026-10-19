import './src/styles.css';

import { traqStampRemarkPlugin } from './src/traq-stamps';
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
    optionsGenerators?: {
      generateViewOptions?: Generator;
      customGenerateViewOptions?: Generator;
      generatePreviewOptions?: Generator;
      customGeneratePreviewOptions?: Generator;
    };
  };
};
type PluginActivator = { activate: () => void; deactivate: () => void };

declare global {
  interface Window {
    growiFacade?: GrowiFacade;
    pluginActivators?: Record<string, PluginActivator>;
  }
}

const originals = new Map<string, Generator | undefined>();
let abortController: AbortController | undefined;
let removeWidgetResize: (() => void) | undefined;
let stampStylesheet: HTMLLinkElement | undefined;
let catalogPromise: Promise<void> = Promise.resolve();

const withTraqStamps = (options: RendererOptions): RendererOptions => {
  if (Array.isArray(options.remarkPlugins)) {
    options.remarkPlugins.unshift([
      traqStampRemarkPlugin,
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

  for (const [customName, originalName] of [
    ['customGenerateViewOptions', 'generateViewOptions'],
    ['customGeneratePreviewOptions', 'generatePreviewOptions'],
  ] as const) {
    const generator = generators[originalName];
    if (generator == null || originals.has(customName)) continue;
    const wrapped: Generator = async function (this: unknown, ...args) {
      await catalogPromise;
      const options = await generator.apply(this, args);
      return withTraqStamps(options);
    };
    originals.set(customName, generators[customName]);
    generators[customName] = wrapped;
  }

  removeWidgetResize ??= activateTraqWidgetResize();
};

const deactivate = (): void => {
  const generators = window.growiFacade?.markdownRenderer?.optionsGenerators;
  if (generators != null) {
    for (const [name, original] of originals) {
      if (original == null) delete generators[name as keyof typeof generators];
      else generators[name as keyof typeof generators] = original;
    }
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
