import { decodeString } from 'micromark-util-decode-string';

type Position = { start?: { offset?: number }; end?: { offset?: number } };
type Node = {
  type: string;
  value?: string;
  children?: Node[];
  data?: Record<string, unknown>;
  position?: Position;
  attributes?: Record<string, string>;
};
type Parent = Node & { children: Node[] };
type Text = Node & { value: string };
export type TraqStampConfig = { origin: string; names: Set<string> };

interface Stamp extends Node {
  type: 'traqStamp';
  value: string;
}

const STAMP_OR_ESCAPE =
  /\\[\s\S]|&(?:#[xX][\da-fA-F]+|#\d+|[a-zA-Z][\da-zA-Z]*);|:((?:[a-zA-Z0-9+_-]{1,32}|@[a-zA-Z0-9_-]+)[\w+.-]*)([:;]|\\[:;]|&(?:colon|semi|#0*5[89]|#[xX]0*3[aAbB]);)/g;

const text = (value: string): Text => ({ type: 'text', value });

const createStamp = (raw: string, name: string, origin: string): Stamp => ({
  type: 'traqStamp',
  value: raw,
  data: {
    hName: 'i',
    hProperties: {
      className: [
        'emoji',
        raw.endsWith(';') ? 'traq-stamp-size-24' : 'traq-stamp-size-em',
        ...(name.startsWith('@')
          ? []
          : [`e_${name.replaceAll('+', '_-plus-_')}`]),
      ],
      title: raw,
      ...(name.startsWith('@')
        ? {
            style: `background-image: url(${origin}/api/v3/public/icon/${name.slice(1)})`,
          }
        : {}),
    },
    hChildren: [{ type: 'text', value: raw }],
  },
});

const getRawText = (node: Node, source: string): string | undefined => {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;
  if (start == null || end == null) return undefined;
  const raw = source.slice(start, end);
  if (node.type !== 'text') return raw;
  const value = (node as Text).value;
  const lines = raw.split('\n');
  const values = value.split('\n');
  if (lines.length !== values.length) return undefined;
  const normalized = lines.map((line, index) => {
    for (const variant of [line, line.replace(/[ \t]+(\r?)$/, '$1')]) {
      const prefixLength = decodeString(variant).length - values[index].length;
      const candidate = variant.slice(Math.max(0, prefixLength));
      if (decodeString(candidate) === values[index]) return candidate;
    }
    return undefined;
  });
  return normalized.every((line) => line != null)
    ? normalized.join('\n')
    : undefined;
};

const isCandidate = (node: Node, source: string): boolean => {
  if (node.type === 'text') return getRawText(node, source) != null;
  if (
    node.type !== 'textDirective' ||
    node.children == null ||
    node.attributes == null
  ) {
    return false;
  }
  return (
    node.children.length === 0 &&
    Object.keys(node.attributes).length === 0 &&
    getRawText(node, source) != null
  );
};

const replaceStamps = (
  run: Node[],
  source: string,
  config: TraqStampConfig,
): Node[] => {
  const nodes: Node[] = [];
  let length = 0;
  const parts = run.map((node) => {
    const raw = getRawText(node, source) ?? '';
    const start = length;
    length += raw.length;
    return { node, raw, start, end: length };
  });
  const raw = parts.map((part) => part.raw).join('');
  const appendGap = (start: number, end: number): void => {
    let cursor = start;
    for (const part of parts) {
      if (
        part.node.type !== 'textDirective' ||
        part.start < start ||
        part.end > end
      ) {
        continue;
      }
      if (cursor < part.start) nodes.push(text(decodeString(raw.slice(cursor, part.start))));
      nodes.push(part.node);
      cursor = part.end;
    }
    if (cursor < end) nodes.push(text(decodeString(raw.slice(cursor, end))));
  };
  let offset = 0;
  for (const match of raw.matchAll(STAMP_OR_ESCAPE)) {
    const name = match[1];
    if (name == null) continue;
    const isUser = /^@[a-zA-Z0-9_-]+$/.test(name);
    appendGap(offset, match.index);
    nodes.push(
      (match[2] === ':' || match[2] === ';') &&
        (isUser || config.names.has(name))
        ? createStamp(match[0], name, config.origin)
        : text(decodeString(match[0])),
    );
    offset = match.index + match[0].length;
  }
  appendGap(offset, raw.length);
  return nodes;
};

const transform = (node: Node, source: string, config: TraqStampConfig): void => {
  if (node.children == null) return;
  const parent = node as Parent;
  const children: Node[] = [];
  for (let index = 0; index < parent.children.length; ) {
    const child = parent.children[index];
    if (!isCandidate(child, source)) {
      transform(child, source, config);
      children.push(child);
      index++;
      continue;
    }
    const run = [child];
    while (index + run.length < parent.children.length) {
      const next = parent.children[index + run.length];
      if (
        !isCandidate(next, source) ||
        run.at(-1)?.position?.end?.offset !== next.position?.start?.offset
      ) {
        break;
      }
      run.push(next);
    }
    children.push(...replaceStamps(run, source, config));
    index += run.length;
  }
  parent.children = children;
};

export const traqStampRemarkPlugin = (config: TraqStampConfig) => {
  return (tree: Node, file: { toString: () => string }): void => {
    transform(tree, file.toString(), config);
  };
};
