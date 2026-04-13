export function SetProgress({ owned, total }: { owned: number; total: number }) {
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-16 text-right">
        {owned}/{total} ({pct}%)
      </span>
    </div>
  );
}
