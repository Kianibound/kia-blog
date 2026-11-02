"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { editorMessages as copy } from "@/i18n/messages/editor.fa";
import type { RichEditorProps } from "./types";
import "./rich-editor.css";

function safeLink(value: string) {
  try {
    const url = new URL(value);
    return /^https?:\/\//i.test(value) && ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

const extensions = [StarterKit.configure({
  heading: { levels: [2, 3, 4] }, blockquote: false, horizontalRule: false, strike: false, underline: false, code: false, trailingNode: false,
  link: { openOnClick: false, autolink: false, linkOnPaste: false, isAllowedUri: (url, context) => context.defaultValidate(url) && safeLink(url) },
})];

/** Tiptap stays internal; initialDocument is consumed once per mounted document. */
export function RichEditor({ id, label, initialDocument, editable, error, onChange }: RichEditorProps) {
  const toolbar = useRef<HTMLDivElement>(null);
  const [linkSelection, setLinkSelection] = useState<{ from: number; to: number } | null>(null);
  const [activeTool, setActiveTool] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("");
  const [linkError, setLinkError] = useState("");
  const editor = useEditor({
    extensions, content: initialDocument, immediatelyRender: false, shouldRerenderOnTransaction: false, textDirection: "rtl", editable,
    editorProps: { attributes: { id, role: "textbox", "aria-label": label, "aria-multiline": "true" } },
    onUpdate: ({ editor }) => onChange({ document: editor.getJSON(), plainText: editor.getText({ blockSeparator: "\n" }) }),
  });
  const state = useEditorState({ editor, selector: ({ editor }) => editor ? {
    bold: editor.isActive("bold"), italic: editor.isActive("italic"), paragraph: editor.isActive("paragraph"),
    heading: [2, 3, 4].find(level => editor.isActive("heading", { level })), bullet: editor.isActive("bulletList"), ordered: editor.isActive("orderedList"),
    code: editor.isActive("codeBlock"), link: editor.isActive("link"), rtl: editor.isActive({ dir: "rtl" }), ltr: editor.isActive({ dir: "ltr" }),
    undo: editor.can().undo(), redo: editor.can().redo(),
  } : null });

  useEffect(() => { editor?.setEditable(editable, false); }, [editor, editable]);
  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute("aria-invalid", String(Boolean(error)));
    editor.view.dom.setAttribute("aria-readonly", String(!editable));
    editor.view.dom.setAttribute("aria-describedby", `${id}-help${error ? ` ${id}-error` : ""}`);
  }, [editor, error, editable, id]);

  function openLink() {
    if (!editor) return;
    if (editor.state.selection.empty && !editor.isActive("link")) { setLinkError(copy.selectLink); return; }
    setLinkSelection({ from: editor.state.selection.from, to: editor.state.selection.to });
    setHref(editor.getAttributes("link").href ?? "");
    setLinkError("");
    setLinkOpen(true);
  }

  function applyLink(remove = false) {
    if (!editor || !editable || !linkSelection) return;
    if (!remove && !safeLink(href.trim())) { setLinkError(copy.invalidLink); return; }
    const chain = editor.chain().focus().setTextSelection(linkSelection).extendMarkRange("link");
    if (remove) chain.unsetLink().run(); else chain.setLink({ href: href.trim() }).run();
    setLinkOpen(false);
    setLinkError("");
  }

  const tools = [
    { label: copy.paragraph, pressed: state?.paragraph, run: () => editor?.chain().focus().setParagraph().run() },
    ...([2, 3, 4] as const).map(level => ({ label: copy[`heading${level}`], pressed: state?.heading === level, run: () => editor?.chain().focus().toggleHeading({ level }).run() })),
    { label: copy.bold, pressed: state?.bold, run: () => editor?.chain().focus().toggleBold().run() },
    { label: copy.italic, pressed: state?.italic, run: () => editor?.chain().focus().toggleItalic().run() },
    { label: copy.bullet, pressed: state?.bullet, run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: copy.ordered, pressed: state?.ordered, run: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: copy.link, pressed: state?.link, run: openLink },
    { label: copy.code, pressed: state?.code, run: () => editor?.chain().focus().toggleCodeBlock().setTextDirection("ltr").run() },
    { label: copy.rtl, pressed: state?.rtl && !state.code, disabled: state?.code, run: () => editor?.chain().focus().setTextDirection("rtl").run() },
    { label: copy.ltr, pressed: state?.ltr || state?.code, disabled: state?.code, run: () => editor?.chain().focus().setTextDirection("ltr").run() },
    { label: copy.undo, disabled: !state?.undo, run: () => editor?.chain().focus().undo().run() },
    { label: copy.redo, disabled: !state?.redo, run: () => editor?.chain().focus().redo().run() },
  ];
  const tabTool = tools[activeTool]?.disabled ? tools.findIndex(tool => !tool.disabled) : activeTool;

  function toolbarKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") { event.preventDefault(); editor?.commands.focus(); return; }
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(toolbar.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const enabled = buttons.map((button, index) => ({ button, index })).filter(item => !item.button.disabled);
    const current = enabled.findIndex(item => item.button === document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (current + (event.key === "ArrowLeft" ? 1 : -1) + enabled.length) % enabled.length;
    if (enabled[next]) { setActiveTool(enabled[next].index); enabled[next].button.focus(); }
  }

  return <div className="min-h-96 space-y-4" onKeyDown={event => {
    if (event.nativeEvent.isComposing) return;
    if (event.altKey && event.key === "F10") { event.preventDefault(); toolbar.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus(); }
  }}>
    <p id={`${id}-help`} className="text-sm text-muted-foreground">{copy.help}</p>
    <div ref={toolbar} role="toolbar" aria-label={copy.toolbar} aria-orientation="horizontal" className="flex flex-wrap gap-2" onKeyDown={toolbarKey}>
      {tools.map((tool, index) => <Button key={tool.label} size="lg" variant="outline" tabIndex={index === tabTool ? 0 : -1} aria-pressed={tool.pressed} disabled={!editor || !editable || tool.disabled} onFocus={() => setActiveTool(index)} onMouseDown={event => event.preventDefault()} onClick={tool.run} className="motion-reduce:transition-none aria-pressed:bg-accent">{tool.label}</Button>)}
    </div>
    {linkOpen && <div role="group" aria-label={copy.link} className="space-y-4 rounded-field border border-border p-4" onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); setLinkOpen(false); editor?.commands.focus(); }
      if (event.key === "Enter" && event.target instanceof HTMLInputElement && !event.nativeEvent.isComposing) { event.preventDefault(); applyLink(); }
    }}>
      <Field label={copy.url} htmlFor={`${id}-url`}><Input autoFocus id={`${id}-url`} dir="ltr" value={href} onChange={event => setHref(event.target.value)} aria-invalid={Boolean(linkError)} aria-describedby={linkError ? `${id}-link-error` : undefined} className="min-h-12" /></Field>
      <div className="flex flex-wrap gap-2"><Button size="lg" onClick={() => applyLink()}>{copy.apply}</Button><Button size="lg" variant="outline" onClick={() => applyLink(true)}>{copy.remove}</Button><Button size="lg" variant="outline" onClick={() => { setLinkOpen(false); editor?.commands.focus(); }}>{copy.cancel}</Button></div>
    </div>}
    {linkError && <p id={`${id}-link-error`} role="alert" className="text-sm text-destructive">{linkError}</p>}
    {!editor && <div role="status" className="min-h-64 space-y-4"><p>{copy.loading}</p><Skeleton className="h-64 w-full motion-reduce:animate-none" /></div>}
    <EditorContent editor={editor} className="rich-editor" />
    {error && <p id={`${id}-error`} className="text-sm text-destructive">{error}</p>}
  </div>;
}
