"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/messages/fa";
import type { Category } from "@/lib/categories";
import { cn, fa } from "@/lib/utils";

export function CategoryDisclosure({ categories, mobile }: { categories: Category[] | null; mobile: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <Button variant="ghost" size="lg" className="px-4 text-sm motion-reduce:transition-none" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        {messages.public.categories}<ChevronDown aria-hidden="true" />
      </Button>
      <div id={panelId} hidden={!open} className={cn("rounded-control border border-border bg-popover p-4 text-popover-foreground", !mobile && "absolute top-full end-0 z-30 w-64 shadow-overlay")}>
        {categories === null ? <p>{messages.public.categoriesUnavailable}</p> : categories.length === 0 ? <p>{messages.public.categoriesEmpty}</p> : (
          <>
            <ul className="space-y-2">
              {categories.map((category) => <li key={category.id}>{fa(category.name)}</li>)}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">{messages.public.categoriesInfo}</p>
          </>
        )}
      </div>
    </div>
  );
}
