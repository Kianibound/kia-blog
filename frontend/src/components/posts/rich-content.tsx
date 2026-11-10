import { Fragment, type ReactNode } from "react";
import { messages } from "@/i18n/messages/fa";
import {
  buildRichBlocks,
  type ContentMedia,
  type InlineRun,
  type RichBlock,
  type RichDocument,
} from "@/lib/posts-contract";

function renderRuns(runs: InlineRun[]): ReactNode[] {
  return runs.map((run, index) => {
    if (run.kind === "break") return <br key={index} />;
    let node: ReactNode = run.text;
    if (run.code)
      node = (
        <code dir="ltr" className="rounded bg-secondary px-1 py-1 text-sm">
          {node}
        </code>
      );
    if (run.italic) node = <em>{node}</em>;
    if (run.bold) node = <strong>{node}</strong>;
    if (run.href)
      node = (
        <a
          href={run.href}
          target={run.target === "_blank" ? "_blank" : undefined}
          rel={run.target === "_blank" ? "noopener noreferrer" : undefined}
          className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {node}
        </a>
      );
    return <Fragment key={index}>{node}</Fragment>;
  });
}

const headingClass = {
  2: "text-2xl font-semibold leading-tight",
  3: "text-xl font-semibold leading-tight",
  4: "text-lg font-semibold leading-tight",
} as const;

function renderBlock(block: RichBlock, index: number): ReactNode {
  if (block.kind === "paragraph")
    return (
      <p key={index} dir={block.dir}>
        {renderRuns(block.runs)}
      </p>
    );

  if (block.kind === "heading") {
    const Tag = (`h${block.level}`) as "h2" | "h3" | "h4";
    return (
      <Tag key={index} dir={block.dir} className={headingClass[block.level]}>
        {renderRuns(block.runs)}
      </Tag>
    );
  }

  if (block.kind === "blockquote")
    return (
      <blockquote
        key={index}
        dir={block.dir}
        className="space-y-2 border-s-2 border-border ps-4 text-muted-foreground"
      >
        {block.blocks.map(renderBlock)}
      </blockquote>
    );

  if (block.kind === "list") {
    const items = block.items.map((item, itemIndex) => (
      <li key={itemIndex} className="space-y-2">
        {item.map(renderBlock)}
      </li>
    ));
    const listClass = block.ordered ? "list-decimal space-y-2 ps-6" : "list-disc space-y-2 ps-6";
    return block.ordered ? (
      <ol key={index} dir={block.dir} start={block.start} type={block.listType} className={listClass}>
        {items}
      </ol>
    ) : (
      <ul key={index} dir={block.dir} className={listClass}>
        {items}
      </ul>
    );
  }

  if (block.kind === "codeBlock")
    return (
      <pre
        key={index}
        dir={block.dir ?? "ltr"}
        tabIndex={0}
        aria-label={messages.article.codeBlock}
        className="overflow-x-auto rounded-field bg-secondary p-4 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <code>{block.text}</code>
      </pre>
    );

  if (block.kind === "image") {
    if (!block.media)
      return (
        <figure
          key={index}
          className="space-y-1 rounded-surface border border-dashed border-border p-6 text-center text-sm"
        >
          <p className="font-medium">{block.alt}</p>
          <p className="text-muted-foreground">{messages.article.imageUnavailable}</p>
        </figure>
      );
    return (
      <figure key={index} className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.media.url}
          alt={block.alt}
          width={block.media.width ?? undefined}
          height={block.media.height ?? undefined}
          loading="lazy"
          className="h-auto w-full rounded-surface border border-border object-cover"
          style={
            block.media.width && block.media.height
              ? { aspectRatio: `${block.media.width} / ${block.media.height}` }
              : undefined
          }
        />
        {block.title && (
          <figcaption className="text-sm text-muted-foreground">{block.title}</figcaption>
        )}
      </figure>
    );
  }

  return null;
}

/** Server-rendered canonical rich content. No client-supplied URLs or raw HTML. */
export function RichContent({
  document,
  media,
}: {
  document: RichDocument;
  media: ContentMedia[];
}) {
  return (
    <div dir={document.dir} className="space-y-4">
      {buildRichBlocks(document, media).map(renderBlock)}
    </div>
  );
}
