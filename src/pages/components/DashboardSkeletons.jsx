import React from "react";

export function SkeletonKpiRow() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[170px] animate-pulse rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="mt-4 h-10 w-28 rounded bg-slate-100" />
          <div className="mt-3 h-4 w-40 rounded bg-slate-100" />
          <div className="mt-6 h-2 w-full rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChartsGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <SkeletonCard className="xl:col-span-7" />
      <SkeletonCard className="xl:col-span-5" />
      <SkeletonCard className="xl:col-span-4" />
      <SkeletonCard className="xl:col-span-8" />
      <SkeletonCard className="xl:col-span-12" />
    </div>
  );
}

export function SkeletonFocus() {
  return (
    <div className="mt-3 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6 }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3"
        >
          <div className="w-full animate-pulse">
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function SkeletonCard({ className }) {
  return (
    <div
      className={`h-[280px] animate-pulse rounded-xl border border-slate-200 bg-white p-4 ${className || ""}`}
    >
      <div className="h-3 w-40 rounded bg-slate-100" />
      <div className="mt-2 h-3 w-56 rounded bg-slate-100" />
      <div className="mt-6 h-44 w-full rounded-xl bg-slate-100" />
    </div>
  );
}
