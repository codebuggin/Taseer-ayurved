export default function DeliveryBadge() {
  return (
    <div className="w-full bg-amber-50 border-y border-amber-200 py-4 px-6 relative z-20">
      <div className="max-w-7xl mx-auto text-center font-mono text-[13px] text-emerald-700 flex flex-wrap justify-center items-center gap-x-2 gap-y-1">
        <span>🚚 We deliver to all 28 states</span>
        <span className="hidden sm:inline-block">·</span>
        <span>Plain unmarked packaging</span>
        <span className="hidden sm:inline-block">·</span>
        <span>Cash on delivery available</span>
      </div>
    </div>
  );
}
