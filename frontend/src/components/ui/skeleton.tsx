// Official VibeFarsi registry: https://vibefarsi.ir/r/components/skeleton.json
import { cn } from "@/lib/utils";

export function Skeleton({ className, shimmer, ...props }: React.HTMLAttributes<HTMLDivElement> & { shimmer?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-secondary",
        shimmer
          ? "relative overflow-hidden before:absolute before:inset-0 before:animate-shine before:bg-gradient-to-l before:from-transparent before:via-foreground/10 before:to-transparent"
          : "animate-pulse-soft",
        className,
      )}
      {...props}
    />
  );
}
