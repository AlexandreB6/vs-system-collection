import { notFound } from "next/navigation";
import Link from "next/link";
import { getSetByCode, getCardsBySet } from "@/lib/queries";
import { QuantitySelector } from "@/components/collection/QuantitySelector";
import { SetProgress } from "@/components/sets/SetProgress";

export const dynamic = "force-dynamic";

function rarityColor(rarity: string | null) {
  switch (rarity) {
    case "Common": return "text-gray-600";
    case "Uncommon": return "text-green-700";
    case "Rare": return "text-amber-700 font-semibold";
    default: return "text-gray-600";
  }
}

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ setCode: string }>;
}) {
  const { setCode } = await params;
  const set = await getSetByCode(setCode);
  if (!set) notFound();

  const cards = await getCardsBySet(set.id);
  const ownedCount = cards.filter(c => (c.quantityEn + c.quantityFr) > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sets" className="text-sm text-blue-600 hover:underline">&larr; All Sets</Link>
        <h1 className="text-2xl font-bold mt-1">{set.name}</h1>
        <div className="text-sm text-gray-600">{set.code} &middot; {set.releaseDate} &middot; {set.setType}</div>
        <div className="mt-2 max-w-xs">
          <SetProgress owned={ownedCount} total={cards.length} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium text-gray-700">Card</th>
              <th className="px-3 py-2 font-medium text-gray-700">Name</th>
              <th className="px-3 py-2 font-medium text-gray-700">Type</th>
              <th className="px-3 py-2 font-medium text-gray-700">Cost</th>
              <th className="px-3 py-2 font-medium text-gray-700">ATK/DEF</th>
              <th className="px-3 py-2 font-medium text-gray-700">Team</th>
              <th className="px-3 py-2 font-medium text-gray-700">Rarity</th>
              <th className="px-3 py-2 font-medium text-gray-700">Owned</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cards.map((card) => (
              <tr
                key={card.id}
                className={`hover:bg-gray-50 ${(card.quantityEn + card.quantityFr) > 0 ? "bg-green-50/50" : ""}`}
              >
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
                  {card.version && (
                    <div className="text-xs text-gray-600">{card.version}</div>
                  )}
                  <div className="text-xs text-gray-600 font-mono">{card.cardNumber}</div>
                </td>
                <td className="px-3 py-2 text-gray-700">{card.cardType}</td>
                <td className="px-3 py-2 text-gray-700">{card.cost ?? "-"}</td>
                <td className="px-3 py-2 text-gray-700">
                  {card.attack != null ? `${card.attack}/${card.defense}` : "-"}
                </td>
                <td className="px-3 py-2 text-gray-600 text-xs">{card.team ?? "-"}</td>
                <td className={`px-3 py-2 text-xs ${rarityColor(card.rarity)}`}>{card.rarity}</td>
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
