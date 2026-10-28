"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
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

  return (
    <Button
      variant="outline"
      size="lg"
      className="px-4 text-sm motion-reduce:transition-none"
      disabled={!mounted}
      aria-pressed={light}
      onClick={() => setTheme(light ? "dark" : "light")}
    >
      {messages.public.lightMode}
    </Button>
  );
}
