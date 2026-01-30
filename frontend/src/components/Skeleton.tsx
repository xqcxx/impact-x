export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
  );
}

export function CampaignCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden border-white/5">
      <div className="h-48 bg-white/5" />
      <div className="p-5 space-y-4">
        <div className="h-6 w-3/4 bg-white/5 rounded" />
        <div className="h-4 w-full bg-white/5 rounded" />
        <div className="h-4 w-2/3 bg-white/5 rounded" />
        
        <div className="h-3 w-full bg-white/5 rounded-full mt-2" />
        
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 w-20 bg-white/5 rounded" />
          <div className="h-4 w-16 bg-white/5 rounded" />
        </div>
        
        <div className="flex justify-between pt-4 border-t border-white/5">
          <div className="h-4 w-20 bg-white/5 rounded" />
          <div className="h-4 w-20 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}