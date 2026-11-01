"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardMessages as copy } from "@/i18n/messages/dashboard.fa";
import { cn } from "@/lib/utils";
import type { DashboardDestination } from "./types";

export function DashboardNavigation({ destinations, pending = false }: { destinations: DashboardDestination[]; pending?: boolean }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const triggerId = useId();

  function close() {
    setExpanded(false);
    document.getElementById(triggerId)?.focus();
  }

  useEffect(() => {
    if (!expanded) return;
    const desktop = window.matchMedia("(min-width: 64rem)");
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setExpanded(false);
        document.getElementById(triggerId)?.focus();
      }
    }
    function onResize() { if (desktop.matches) setExpanded(false); }
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onResize);
    };
  }, [expanded, triggerId]);

  const links = destinations.map(({ href, label }) => (
    <li key={href}>
      <Link
        href={href}
        aria-current={pathname === href ? "page" : undefined}
        className={cn(
          "flex min-h-12 items-center rounded-control px-4 py-2 font-medium wrap-anywhere focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
          pathname === href ? "bg-secondary text-secondary-foreground" : "hover:bg-accent hover:text-accent-foreground",
        )}
      >{label}</Link>
    </li>
  ));

  if (pending) {
    return <nav aria-label={copy.navigation} aria-busy="true" className="flex flex-col gap-2"><Skeleton className="h-12 w-full motion-reduce:animate-none" /><Skeleton className="hidden h-12 w-full motion-reduce:animate-none lg:block" /></nav>;
  }
  if (!destinations.length) {
    return <nav aria-label={copy.navigation}><p className="text-sm">{copy.navigationUnavailable}</p></nav>;
  }

  return (
    <nav aria-label={copy.navigation} className="flex flex-col gap-4">
      <Button id={triggerId} variant="outline" size="lg" className="w-full justify-start motion-reduce:transition-none lg:hidden" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(!expanded)}>
        <Menu aria-hidden="true" strokeWidth={2} />{copy.menu}
      </Button>
      <ul className="hidden space-y-2 lg:block">{links}</ul>
      <ul id={panelId} className={cn("space-y-2 lg:hidden", expanded ? "block" : "hidden")} onClick={(event) => { if (event.target instanceof Element && event.target.closest("a")) close(); }}>
        {links}
      </ul>
    </nav>
  );
}
