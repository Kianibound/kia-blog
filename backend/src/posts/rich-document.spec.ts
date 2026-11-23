import { describe, expect, it } from '@jest/globals';
import { parseRichDocument } from './rich-document';

// The real browser editor emits headings without attrs; the document the
// user actually sent failed with 400 before this fix.
describe('parseRichDocument heading level', () => {
  it('defaults a missing heading level to 2', () => {
    const { document, plainText } = parseRichDocument({
      type: 'doc',
      content: [
        {
          type: 'heading',
          content: [{ type: 'text', text: 'این تست دیباگ است' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'hardBreak' },
            {
              type: 'text',
              marks: [{ type: 'bold' }],
              text: 'این تست برای تست دیباگ مقاله است',
            },
          ],
        },
      ],
    });
    const content = document.content as Array<Record<string, unknown>>;
    const heading = content[0] as Record<string, unknown>;
    const attrs = heading.attrs as Record<string, unknown>;
    expect(attrs.level).toBe(2);
    expect(plainText).toContain('این تست دیباگ است');
    expect(plainText).toContain('این تست برای تست دیباگ مقاله است');
  });

  it('still rejects an out-of-range heading level', () => {
    expect(() =>
      parseRichDocument({
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 5 },
            content: [{ type: 'text', text: 'عنوان' }],
          },
        ],
      }),
    ).toThrow('Invalid contentDocument.');
  });
});
