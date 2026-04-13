import Link from "next/link";
import { getCollectionCards } from "@/lib/queries";
import { QuantitySelector } from "@/components/collection/QuantitySelector";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const cards = await getCollectionCards();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Collection</h1>
        <span className="text-sm text-gray-600">
          {cards.length} unique cards &middot; {cards.reduce((sum, c) => sum + (c.quantityEn ?? 0) + (c.quantityFr ?? 0), 0)} total
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          No cards in your collection yet. Browse <Link href="/sets" className="text-blue-600 hover:underline">sets</Link> to start adding cards.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium text-gray-700">Card</th>
                <th className="px-3 py-2 font-medium text-gray-700">Name</th>
                <th className="px-3 py-2 font-medium text-gray-700">Type</th>
                <th className="px-3 py-2 font-medium text-gray-700">Rarity</th>
                <th className="px-3 py-2 font-medium text-gray-700">Condition</th>
                <th className="px-3 py-2 font-medium text-gray-700">Qty</th>
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
                  <td className="px-3 py-2 text-xs text-gray-700">{card.rarity}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{card.condition ?? "-"}</td>
                  <td className="px-3 py-2">
                    <QuantitySelector cardId={card.id} quantityEn={card.quantityEn ?? 0} quantityFr={card.quantityFr ?? 0} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
