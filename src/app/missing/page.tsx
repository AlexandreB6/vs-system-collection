import Link from "next/link";
import { getAllSets, getMissingCards } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MissingPage({
  searchParams,
}: {
  searchParams: Promise<{ setId?: string }>;
}) {
  const sp = await searchParams;
  const allSets = await getAllSets();
  const selectedSetId = sp.setId ? parseInt(sp.setId) : null;
  const selectedSet = selectedSetId ? allSets.find(s => s.id === selectedSetId) : null;

  const missingCards = selectedSetId ? await getMissingCards(selectedSetId) : [];

  // Group by rarity
  const byRarity: Record<string, typeof missingCards> = {};
  for (const card of missingCards) {
    const r = card.rarity ?? "Unknown";
    if (!byRarity[r]) byRarity[r] = [];
    byRarity[r].push(card);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Missing Cards</h1>

      {/* Set selector */}
      <form className="bg-white rounded-lg shadow p-4 flex gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Select a Set</label>
          <select name="setId" defaultValue={sp.setId ?? ""} className="border rounded px-3 py-1.5 text-sm w-64">
            <option value="">-- Choose a set --</option>
            {allSets.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({(s.totalCards ?? 0) - s.ownedCount} missing)</option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-gray-900 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800">
          Show Missing
        </button>
      </form>

      {selectedSet && (
        <div className="text-sm text-gray-700">
          {missingCards.length} cards missing from <strong>{selectedSet.name}</strong> (out of {selectedSet.totalCards})
        </div>
      )}

      {/* Missing cards grouped by rarity */}
      {Object.entries(byRarity).map(([rarity, cards]) => (
        <div key={rarity}>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            {rarity} ({cards.length})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-700">Card</th>
                  <th className="px-3 py-2 font-medium text-gray-700">Name</th>
                  <th className="px-3 py-2 font-medium text-gray-700">Type</th>
                  <th className="px-3 py-2 font-medium text-gray-700">Cost</th>
                  <th className="px-3 py-2 font-medium text-gray-700">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-3 py-1">
                      <Link href={`/cards/${card.id}`}>
                        {card.imageUrl ? (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="w-10 h-14 object-cover rounded bg-gray-100"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-gray-200 rounded" />
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/cards/${card.id}`} className="text-blue-600 hover:underline font-medium">
                        {card.name}
                      </Link>
                      {card.version && <div className="text-xs text-gray-600">{card.version}</div>}
                      <div className="text-xs text-gray-600 font-mono">{card.cardNumber}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{card.cardType}</td>
                    <td className="px-3 py-2 text-gray-700">{card.cost ?? "-"}</td>
                    <td className="px-3 py-2 text-gray-700 text-xs">{card.team ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {selectedSetId && missingCards.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center text-green-700">
          This set is complete! You own every card.
        </div>
      )}
    </div>
  );
}
