"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { messages } from "@/i18n/messages/fa";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const destinations = [
  { href: "/", label: messages.public.home },
  { href: "/about", label: messages.public.about },
];

export function SiteNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const linksId = useId();
  const triggerId = useId();
  const links = destinations.map(({ href, label }) => (
    <li key={href}>
      <Link
        href={href}
        aria-current={pathname === href ? "page" : undefined}
        className={cn(
          "inline-flex min-h-12 items-center rounded-control px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
          pathname === href
            ? "bg-secondary text-secondary-foreground"
            : "text-foreground hover:bg-accent",
        )}
      >
        {label}
      </Link>
    </li>
  ));

  function closeMenu() {
    setExpanded(false);
    document.getElementById(triggerId)?.focus();
  }

  useEffect(() => {
    if (!expanded) return;
    const desktop = window.matchMedia("(min-width: 48rem)");
    function handleDesktopChange() {
      if (desktop.matches) setExpanded(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpanded(false);
        document.getElementById(triggerId)?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", handleDesktopChange);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", handleDesktopChange);
    };
  }, [expanded, triggerId]);

  return (
    <nav
      aria-label={messages.public.navigation}
      className="flex flex-wrap items-center justify-between gap-x-6 md:grid md:grid-cols-3"
      onClick={(event) => {
        if (expanded && event.target instanceof Element && event.target.closest("a")) closeMenu();
      }}
    >
      <div className="md:justify-self-start">{children}</div>
      <ul className="hidden items-center gap-2 md:flex md:justify-self-center">{links}</ul>
      <div className="flex items-center gap-2 md:justify-self-end">
        <ThemeToggle />
        <Button
          id={triggerId}
          variant="outline"
          size="lg"
          className="motion-reduce:transition-none md:hidden"
          aria-expanded={expanded}
          aria-controls={linksId}
          onClick={() => setExpanded(!expanded)}
        >
          {messages.public.menu}
        </Button>
      </div>
      <ul
        id={linksId}
        className={cn(
          "basis-full flex-col gap-2 border-t border-border py-4",
          expanded ? "flex" : "hidden",
          "md:hidden",
        )}
      >
        {links}
      </ul>
    </nav>
  );
}
