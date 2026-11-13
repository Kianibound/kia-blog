// Official VibeFarsi registry: https://vibefarsi.ir/r/components/dialog.json
// Adapted to a centered native modal for inert background, focus containment and restoration.
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  role?: "dialog" | "alertdialog";
  dismissible?: boolean;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, footer, role = "dialog", dismissible = true, className }: DialogProps) {
  const panel = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    const dialog = panel.current;
    if (!dialog || !open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  return <dialog ref={panel} role={role} tabIndex={-1} aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-describedby={description ? descId : undefined}
    onKeyDown={event => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const dialog = event.currentTarget;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')).filter(control => control.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
    }}
    onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}
    onClick={event => {
      if (role !== "dialog" || !dismissible || event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onOpenChange(false);
    }}
    className={cn("fixed inset-0 m-auto h-fit max-h-dvh w-11/12 max-w-md overflow-y-auto overscroll-contain rounded-surface border-line border-border bg-popover p-6 text-popover-foreground shadow-overlay focus:outline-none backdrop:bg-foreground/60 backdrop:backdrop-blur-sm", className)}>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        {title && <h2 id={titleId} className="text-xl leading-tight font-semibold">{title}</h2>}
        {description && <p id={descId}>{description}</p>}
      </div>
      {role === "dialog" && <button type="button" aria-label="بستن" disabled={!dismissible} onClick={() => onOpenChange(false)} className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-control text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"><X className="size-4" strokeWidth={2} /></button>}
    </div>
    {children && <div className="mt-4">{children}</div>}
    {footer && <div className="mt-6 flex flex-wrap items-center justify-end gap-4">{footer}</div>}
  </dialog>;
}
