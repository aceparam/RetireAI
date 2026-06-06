"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/format";

const axisProps = {
  tick: { fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

function inrTick(v: number) {
  if (Math.abs(v) >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (Math.abs(v) >= 1e5) return `${(v / 1e5).toFixed(0)}L`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return `${v}`;
}

function TooltipContent({ active, payload, label, labelKey }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-foreground">
        {labelKey ? `${labelKey} ${label}` : label}
      </p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
            {p.name}
          </span>
          <span className="font-medium text-foreground">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function GrowthAreaChart({
  data,
  height = 300,
}: {
  data: { age: number; corpus: number; contributions: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gCorpus" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id="gContrib" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="age" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={inrTick} width={44} />
        <Tooltip content={<TooltipContent labelKey="Age" />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="contributions" name="Invested" stroke="#22c55e" fill="url(#gContrib)" strokeWidth={2} />
        <Area type="monotone" dataKey="corpus" name="Corpus" stroke="#6366f1" fill="url(#gCorpus)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DrawdownChart({
  data,
  height = 280,
}: {
  data: { age: number; corpus: number; withdrawal: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gDraw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="age" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={inrTick} width={44} />
        <Tooltip content={<TooltipContent labelKey="Age" />} />
        <Area type="monotone" dataKey="corpus" name="Remaining Corpus" stroke="#0ea5e9" fill="url(#gDraw)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AllocationPieChart({
  data,
  height = 280,
}: {
  data: { label: string; value: number; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip content={<TooltipContent />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ComparisonBarChart({
  data,
  bars,
  height = 300,
}: {
  data: any[];
  bars: { key: string; name: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={inrTick} width={44} />
        <Tooltip content={<TooltipContent />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonteCarloFanChart({
  data,
  height = 320,
}: {
  data: { age: number; p10: number; p25: number; p50: number; p75: number; p90: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="band90" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="age" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={inrTick} width={44} />
        <Tooltip content={<TooltipContent labelKey="Age" />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="p90" name="90th pct" stroke="#a5b4fc" fill="url(#band90)" strokeWidth={1} />
        <Area type="monotone" dataKey="p75" name="75th pct" stroke="#818cf8" fill="none" strokeWidth={1} />
        <Area type="monotone" dataKey="p50" name="Median" stroke="#6366f1" fill="none" strokeWidth={2.5} />
        <Area type="monotone" dataKey="p25" name="25th pct" stroke="#f59e0b" fill="none" strokeWidth={1} />
        <Area type="monotone" dataKey="p10" name="10th pct" stroke="#ef4444" fill="none" strokeWidth={1} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HistogramChart({
  data,
  median,
  height = 260,
}: {
  data: { bucket: string; count: number; from: number }[];
  median?: number;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bucket" {...axisProps} interval={3} />
        <YAxis {...axisProps} width={32} />
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }}
          contentStyle={{ borderRadius: 12, fontSize: 12 }}
          formatter={(v: any) => [`${v} runs`, "Frequency"]}
          labelFormatter={(l) => `Corpus ≈ ₹${l}`}
        />
        <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
        {median !== undefined && <ReferenceLine x={undefined} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MultiLineChart({
  data,
  lines,
  height = 300,
  xKey = "age",
  xLabel = "Age",
}: {
  data: any[];
  lines: { key: string; name: string; color: string }[];
  height?: number;
  xKey?: string;
  xLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} tickFormatter={inrTick} width={44} />
        <Tooltip content={<TooltipContent labelKey={xLabel} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ScoreGauge({ score, size = 180 }: { score: number; size?: number }) {
  const radius = size / 2 - 16;
  const circumference = Math.PI * radius; // semicircle
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circumference * pct;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
      <path
        d={`M 16 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 16} ${size / 2}`}
        fill="none"
        stroke="hsl(var(--secondary))"
        strokeWidth={14}
        strokeLinecap="round"
      />
      <path
        d={`M 16 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 16} ${size / 2}`}
        fill="none"
        stroke={color}
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" className="fill-foreground" style={{ fontSize: 30, fontWeight: 700 }}>
        {Math.round(score)}
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 12 }}>
        out of 100
      </text>
    </svg>
  );
}
