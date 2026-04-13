import Link from "next/link";
import { getAllSets } from "@/lib/queries";
import { SetProgress } from "@/components/sets/SetProgress";

export const dynamic = "force-dynamic";

export default async function SetsPage() {
  const allSets = await getAllSets();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Sets</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allSets.map((set) => (
          <Link
            key={set.id}
            href={`/sets/${set.code}`}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 block"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="font-semibold text-sm text-gray-900">{set.name}</h2>
                <span className="text-xs text-gray-600">{set.code}</span>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {set.setType}
              </span>
            </div>
            {set.releaseDate && (
              <div className="text-xs text-gray-600 mb-2">{set.releaseDate}</div>
            )}
            <SetProgress owned={set.ownedCount} total={set.totalCards ?? 0} />
          </Link>
        ))}
      </div>
    </div>
  );
}
