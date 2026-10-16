import * as React from "react";
import { cn } from "../../lib/cn";

export function Chip({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("inline-block rounded-full bg-soft px-3 py-0.5 text-xs text-muted", className)} {...props} />
  );
}
