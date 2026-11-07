import { BadRequestException } from '@nestjs/common';
import {
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { Prisma } from '../generated/prisma/client';

export const RICH_DOCUMENT_LIMITS = {
  bytes: 65_536,
  depth: 16,
  nodes: 2_000,
} as const;
const blocks = new Set([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
]);
const inline = new Set(['text', 'hardBreak']);
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));
function ensure(condition: unknown): asserts condition {
  if (!condition) throw new BadRequestException('Invalid contentDocument.');
}
function keys(value: Record<string, unknown>, allowed: string[]) {
  ensure(Object.keys(value).every((key) => allowed.includes(key)));
}
function unicode(value: string) {
  // PostgreSQL JSONB cannot store NUL or unpaired UTF-16 surrogates.
  ensure(!value.includes('\u0000'));
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(++i);
      ensure(next >= 0xdc00 && next <= 0xdfff);
    } else ensure(unit < 0xdc00 || unit > 0xdfff);
  }
}

/** Validate before cloning; never parse legacy content or render HTML here. */
export function parseRichDocument(value: unknown): {
  document: Prisma.InputJsonObject;
  plainText: string;
} {
  let count = 0;
  let stringBytes = 0;
  const string = (
    input: unknown,
    max: number = RICH_DOCUMENT_LIMITS.bytes,
  ): input is string => {
    if (typeof input !== 'string' || input.length > max) return false;
    unicode(input);
    stringBytes += Buffer.byteLength(input, 'utf8');
    ensure(stringBytes <= RICH_DOCUMENT_LIMITS.bytes);
    return true;
  };
  const marks = (input: unknown, codeBlock: boolean) => {
    if (input === undefined) return;
    ensure(Array.isArray(input) && (!codeBlock || input.length === 0));
    const names = new Set<string>();
    for (const mark of input) {
      ensure(++count <= RICH_DOCUMENT_LIMITS.nodes && record(mark));
      keys(mark, ['type', 'attrs']);
      ensure(
        typeof mark.type === 'string' &&
          ['bold', 'italic', 'code', 'link'].includes(mark.type) &&
          !names.has(mark.type),
      );
      names.add(mark.type);
      if (mark.type !== 'link') {
        ensure(mark.attrs === undefined);
        continue;
      }
      ensure(record(mark.attrs));
      const attrs = mark.attrs;
      keys(attrs, ['href', 'target', 'rel', 'class', 'title']);
      ensure(
        string(attrs.href, 2048) &&
          // Reject URL control characters explicitly, including DEL.
          // eslint-disable-next-line no-control-regex
          /^https?:\/\/[^\s\u0000-\u001f\u007f]+$/i.test(attrs.href),
      );
      let url: URL;
      try {
        url = new URL(attrs.href);
      } catch {
        throw new BadRequestException('Invalid contentDocument.');
      }
      ensure(
        ['https:', 'http:'].includes(url.protocol) &&
          !url.username &&
          !url.password,
      );
      ensure(
        attrs.target === undefined ||
          attrs.target === null ||
          attrs.target === '_blank' ||
          attrs.target === '_self',
      );
      ensure(attrs.class === undefined || attrs.class === null);
      if (attrs.title !== undefined && attrs.title !== null)
        ensure(string(attrs.title, 256));
      if (attrs.rel === null)
        ensure(attrs.target === null || attrs.target === '_self');
      else if (attrs.rel !== undefined) {
        ensure(string(attrs.rel, 64));
        const tokens = attrs.rel.split(' ');
        ensure(
          tokens.every((token) =>
            ['noopener', 'noreferrer', 'nofollow'].includes(token),
          ) &&
            tokens.includes('noopener') &&
            tokens.includes('noreferrer'),
        );
      }
    }
    ensure(!names.has('code') || names.size === 1);
  };
  const visit = (node: unknown, depth: number, parent?: string): string => {
    ensure(
      depth <= RICH_DOCUMENT_LIMITS.depth &&
        ++count <= RICH_DOCUMENT_LIMITS.nodes &&
        record(node),
    );
    const type = node.type;
    ensure(typeof type === 'string');
    if (!parent) ensure(type === 'doc');
    else if (parent === 'paragraph' || parent === 'heading')
      ensure(inline.has(type));
    else if (parent === 'codeBlock') ensure(type === 'text');
    else if (parent === 'bulletList' || parent === 'orderedList')
      ensure(type === 'listItem');
    else ensure(blocks.has(type) && type !== 'listItem');
    if (type === 'text') {
      keys(node, ['type', 'text', 'marks']);
      ensure(string(node.text) && node.text.length > 0);
      marks(node.marks, parent === 'codeBlock');
      return node.text;
    }
    ensure(type === 'doc' || blocks.has(type) || type === 'hardBreak');
    keys(
      node,
      type === 'hardBreak'
        ? ['type', 'attrs', 'marks']
        : ['type', 'attrs', 'content'],
    );
    if (node.attrs !== undefined) {
      ensure(record(node.attrs));
      const attrs = node.attrs;
      keys(attrs, [
        'dir',
        ...(type === 'heading' ? ['level'] : []),
        ...(type === 'orderedList' ? ['start', 'type'] : []),
        ...(type === 'codeBlock' ? ['language'] : []),
      ]);
      ensure(
        attrs.dir === undefined ||
          attrs.dir === null ||
          (typeof attrs.dir === 'string' &&
            ['rtl', 'ltr', 'auto'].includes(attrs.dir)),
      );
      if (type === 'orderedList') {
        ensure(
          attrs.start === undefined ||
            (Number.isSafeInteger(attrs.start) &&
              Number(attrs.start) >= 1 &&
              Number(attrs.start) <= 1_000_000),
        );
        ensure(
          attrs.type === undefined ||
            attrs.type === null ||
            (typeof attrs.type === 'string' &&
              ['1', 'a', 'A', 'i', 'I'].includes(attrs.type)),
        );
      }
      if (
        type === 'codeBlock' &&
        attrs.language !== undefined &&
        attrs.language !== null
      )
        ensure(
          string(attrs.language, 64) &&
            /^[A-Za-z0-9_+.#-]*$/.test(attrs.language),
        );
    }
    if (type === 'heading')
      ensure(
        record(node.attrs) &&
          [2, 3, 4].includes(Number(node.attrs.level)) &&
          typeof node.attrs.level === 'number',
      );
    if (type === 'hardBreak') {
      marks(node.marks, false);
      return '\n';
    }
    ensure(node.content === undefined || Array.isArray(node.content));
    const children = node.content === undefined ? [] : node.content;
    if (
      ['doc', 'bulletList', 'orderedList', 'listItem', 'blockquote'].includes(
        type,
      )
    )
      ensure(children.length > 0);
    if (type === 'listItem')
      ensure(record(children[0]) && children[0].type === 'paragraph');
    const text = children.map((child) => visit(child, depth + 1, type));
    return text.join(
      ['paragraph', 'heading', 'codeBlock'].includes(type) ? '' : '\n',
    );
  };
  const plainText = visit(value, 1);
  const serialized = JSON.stringify(value);
  ensure(Buffer.byteLength(serialized, 'utf8') <= RICH_DOCUMENT_LIMITS.bytes);
  return {
    document: JSON.parse(serialized) as Prisma.InputJsonObject,
    plainText,
  };
}

@ValidatorConstraint({ name: 'canonicalRichDocument', async: false })
export class RichDocumentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if ((args.object as { content?: unknown }).content !== undefined)
      return false;
    try {
      parseRichDocument(value);
      return true;
    } catch {
      return false;
    }
  }
  defaultMessage() {
    return 'contentDocument must be an allowed, bounded Tiptap document and cannot accompany content';
  }
}

export function preparePostContent(input: {
  content?: string;
  contentDocument?: unknown;
}) {
  if (input.contentDocument !== undefined) {
    ensure(input.content === undefined);
    const parsed = parseRichDocument(input.contentDocument);
    return { content: parsed.plainText, contentDocument: parsed.document };
  }
  if (input.content !== undefined) {
    ensure(typeof input.content === 'string' && input.content.length > 0);
    return { content: input.content, contentDocument: Prisma.DbNull };
  }
  return undefined;
}
