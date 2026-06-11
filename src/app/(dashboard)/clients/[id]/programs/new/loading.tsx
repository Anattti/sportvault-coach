import { Skeleton } from '@/components/ui/skeleton';

export default function ClientProgramNewLoading() {
  return (
    <div className="flex h-full flex-col space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3 md:pb-4">
        <div className="flex min-w-0 items-center gap-2 md:gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="flex flex-1 items-start gap-4">
        <Skeleton className="hidden h-[70vh] w-[360px] rounded-xl lg:block" />
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
