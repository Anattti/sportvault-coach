import { Skeleton } from '@/components/ui/skeleton';

export default function ClientDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
