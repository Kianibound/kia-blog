"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/messages/fa";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The server cannot know browser preferences. Reserve the same control until hydration.
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const light = mounted && resolvedTheme === "light";
  const label = light ? messages.public.activateDarkMode : messages.public.activateLightMode;

  return (
    <span className="group relative inline-flex">
      <Button
        variant="outline"
        size="lg"
        className="w-12 px-0 motion-reduce:transition-none"
        disabled={!mounted}
        aria-label={label}
        onClick={() => setTheme(light ? "dark" : "light")}
      >
        {light ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
      </Button>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute end-0 top-full z-30 mt-2 w-max rounded-control bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
      >
        {label}
      </span>
    </span>
  );
}
