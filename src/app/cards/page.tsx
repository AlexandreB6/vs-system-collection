import Link from "next/link";
import { searchCards, getAllSets, getDistinctCardTypes, getDistinctRarities } from "@/lib/queries";
import { QuantitySelector } from "@/components/collection/QuantitySelector";

export const dynamic = "force-dynamic";

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; setId?: string; type?: string; rarity?: string }>;
}) {
  const sp = await searchParams;
  const query = sp.q ?? "";
  const setId = sp.setId ? parseInt(sp.setId) : undefined;
  const cardType = sp.type ?? undefined;
  const rarity = sp.rarity ?? undefined;

  const [cards, allSets, types, rarities] = await Promise.all([
    searchCards(query, { setId, cardType, rarity }),
    getAllSets(),
    getDistinctCardTypes(),
    getDistinctRarities(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Browse Cards</h1>

      {/* Filters */}
      <form className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Card name or text..."
            className="border rounded px-3 py-1.5 text-sm w-56"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Set</label>
          <select name="setId" defaultValue={sp.setId ?? ""} className="border rounded px-2 py-1.5 text-sm">
            <option value="">All Sets</option>
            {allSets.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Type</label>
          <select name="type" defaultValue={sp.type ?? ""} className="border rounded px-2 py-1.5 text-sm">
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Rarity</label>
          <select name="rarity" defaultValue={sp.rarity ?? ""} className="border rounded px-2 py-1.5 text-sm">
            <option value="">All Rarities</option>
            {rarities.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-gray-900 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800">
          Search
        </button>
      </form>

      {/* Results */}
      <div className="text-sm text-gray-600">{cards.length} results {cards.length === 100 && "(limited to 100)"}</div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium text-gray-700">Card</th>
              <th className="px-3 py-2 font-medium text-gray-700">Name</th>
              <th className="px-3 py-2 font-medium text-gray-700">Type</th>
              <th className="px-3 py-2 font-medium text-gray-700">Cost</th>
              <th className="px-3 py-2 font-medium text-gray-700">ATK/DEF</th>
              <th className="px-3 py-2 font-medium text-gray-700">Rarity</th>
              <th className="px-3 py-2 font-medium text-gray-700">Owned</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cards.map((card) => (
              <tr key={card.id} className={`hover:bg-gray-50 ${(card.quantityEn + card.quantityFr) > 0 ? "bg-green-50/50" : ""}`}>
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
                <td className="px-3 py-2 text-gray-700">
                  {card.attack != null ? `${card.attack}/${card.defense}` : "-"}
                </td>
                <td className="px-3 py-2 text-xs text-gray-700">{card.rarity}</td>
                <td className="px-3 py-2">
                  <QuantitySelector cardId={card.id} quantityEn={card.quantityEn} quantityFr={card.quantityFr} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
