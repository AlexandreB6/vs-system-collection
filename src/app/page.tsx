import Link from "next/link";
import { getAllSets, getCollectionStats } from "@/lib/queries";
import { SetProgress } from "@/components/sets/SetProgress";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, allSets] = await Promise.all([
    getCollectionStats(),
    getAllSets(),
  ]);

  const completionPct = stats.totalCards > 0
    ? Math.round((stats.ownedCards / stats.totalCards) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-600">Unique Cards Owned</div>
          <div className="text-3xl font-bold mt-1">
            {stats.ownedCards} <span className="text-base text-gray-600">/ {stats.totalCards}</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${completionPct}%` }} />
          </div>
          <div className="text-xs text-gray-600 mt-1">{completionPct}% complete</div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-600">Total Cards (with duplicates)</div>
          <div className="text-3xl font-bold mt-1">{stats.totalQuantity}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-600">Sets</div>
          <div className="text-3xl font-bold mt-1">{allSets.length}</div>
          <div className="text-xs text-gray-600 mt-1">
            {allSets.filter(s => s.ownedCount > 0).length} started
          </div>
        </div>
      </div>

      {/* Sets overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Sets Completion</h2>
        <div className="bg-white rounded-lg shadow divide-y">
          {allSets.map((set) => (
            <Link
              key={set.id}
              href={`/sets/${set.code}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900">{set.name}</div>
                <div className="text-xs text-gray-600">{set.code} &middot; {set.totalCards} cards</div>
              </div>
              <div className="w-48 ml-4">
                <SetProgress owned={set.ownedCount} total={set.totalCards ?? 0} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
