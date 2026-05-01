import React from 'react';
import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-alt border border-border/20", className)}
      {...props}
    />
  )
}

function MaterialCardSkeleton() {
  return (
    <div className="relative glass-card p-4 sm:p-5 overflow-hidden border-border border-b-4 h-[200px] flex flex-col">
      {/* Action Bar area */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-2">
        <Skeleton className="w-7 h-7 rounded-lg" />
        <Skeleton className="w-7 h-7 rounded-lg" />
      </div>

      <div className="flex items-center gap-4 mb-5">
        <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
        <div className="flex-grow pr-8">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      
      <div className="pt-4 mt-auto border-t border-dashed border-border/60">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-8 rounded-sm" />
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
    </div>
  )
}

function MaterialListSkeleton() {
  return (
    <div className="relative glass-card p-4 border-2 border-border/40 flex items-center gap-4 h-[76px]">
      <Skeleton className="w-6 h-6 rounded-md flex-shrink-0" />
      <div className="flex items-center gap-6 flex-grow">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <div className="hidden md:block w-48 shrink-0">
          <div className="flex items-center gap-3">
             <Skeleton className="flex-grow h-1.5 rounded-full" />
             <Skeleton className="h-4 w-8" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
      </div>
    </div>
  )
}

function ExploreCardSkeleton() {
  return (
    <div className="glass-card p-6 flex flex-col justify-between h-[200px]">
      <div>
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-6 w-20 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/3 mb-6" />
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
        <div className="flex gap-4">
           <Skeleton className="h-4 w-12" />
           <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-8 w-24 sm:w-32 rounded-lg" />
      </div>
    </div>
  )
}

export { Skeleton, MaterialCardSkeleton, MaterialListSkeleton, ExploreCardSkeleton }

