import * as React from "react";
import { cn } from "../../lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-line bg-surface p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("mb-2 text-lg font-semibold", className)} {...props} />;
}

export function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="font-serif text-4xl font-bold leading-none">{value}</div>
      <div className="mt-2 text-sm text-muted">{label}</div>
    </div>
  );
}
