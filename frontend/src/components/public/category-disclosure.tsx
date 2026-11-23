"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/messages/fa";
import type { Category } from "@/lib/categories";
import { categoryHref } from "@/lib/discovery";
import { cn, fa } from "@/lib/utils";

export function CategoryDisclosure({ categories, mobile }: { categories: Category[] | null; mobile: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);

  return (
    <div ref={panelRef} className="relative">
      <Button variant="ghost" size="lg" className="px-4 text-sm motion-reduce:transition-none" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        {messages.public.categories}<ChevronDown aria-hidden="true" />
      </Button>
      <div id={panelId} hidden={!open} className={cn("rounded-control border border-border bg-popover p-4 text-popover-foreground", !mobile && "absolute top-full end-0 z-30 w-64 shadow-overlay")}>
        {categories === null ? <p>{messages.public.categoriesUnavailable}</p> : categories.length === 0 ? <p>{messages.public.categoriesEmpty}</p> : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={categoryHref(category.slug)}
                  className="flex min-h-12 items-center rounded-control px-3 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {fa(category.name)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
