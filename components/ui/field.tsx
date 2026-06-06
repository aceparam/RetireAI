"use client";

import * as React from "react";
import { Input, Label } from "./input";
import { Slider } from "./slider";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";

/** Numeric field with a label, optional rupee preview, and inline slider. */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  prefix,
  slider = false,
  format = "plain",
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  prefix?: string;
  slider?: boolean;
  format?: "plain" | "inr";
  hint?: string;
}) {
  const [text, setText] = React.useState(String(value));
  React.useEffect(() => {
    setText(String(value));
  }, [value]);

  const commit = (raw: string) => {
    setText(raw);
    const n = parseFloat(raw.replace(/[^0-9.-]/g, ""));
    if (!isNaN(n)) onChange(n);
    else if (raw === "" || raw === "-") onChange(0);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {format === "inr" && <span className="text-xs font-medium text-primary">{formatINR(value)}</span>}
      </div>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          inputMode="numeric"
          value={text}
          onChange={(e) => commit(e.target.value)}
          className={cn(prefix && "pl-7", suffix && "pr-10")}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {slider && min !== undefined && max !== undefined && (
        <Slider value={value} min={min} max={max} step={step} onChange={onChange} className="mt-2" />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
