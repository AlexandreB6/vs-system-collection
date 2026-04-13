import { notFound } from "next/navigation";
import Link from "next/link";
import { getCardById, getCollectionQuantities } from "@/lib/queries";
import { QuantitySelector } from "@/components/collection/QuantitySelector";
import { db } from "@/db";
import { sets } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const card = await getCardById(parseInt(cardId));
  if (!card) notFound();

  const quantities = await getCollectionQuantities(card.id);

  let set = null;
  if (card.setId) {
    const [s] = await db.select().from(sets).where(eq(sets.id, card.setId)).limit(1);
    set = s;
  }

  return (
    <div className="space-y-6">
      <div>
        {set && (
          <Link href={`/sets/${set.code}`} className="text-sm text-blue-600 hover:underline">
            &larr; {set.name}
          </Link>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Card image */}
        <div className="flex-shrink-0">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              className="rounded-lg shadow-lg w-[250px] h-[356px] object-cover bg-gray-200"
            />
          ) : (
            <div className="w-[250px] h-[356px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-600">
              No Image
            </div>
          )}
        </div>

        {/* Card info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{card.name}</h1>
            {card.version && <div className="text-gray-600">{card.version}</div>}
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Card Number</span>
                <div className="font-mono">{card.cardNumber}</div>
              </div>
              <div>
                <span className="text-gray-600">Type</span>
                <div>{card.cardType}</div>
              </div>
              {card.cost != null && (
                <div>
                  <span className="text-gray-600">Cost</span>
                  <div className="font-bold text-lg">{card.cost}</div>
                </div>
              )}
              {card.attack != null && (
                <div>
                  <span className="text-gray-600">ATK / DEF</span>
                  <div className="font-bold text-lg">{card.attack} / {card.defense}</div>
                </div>
              )}
              {card.team && (
                <div>
                  <span className="text-gray-600">Team</span>
                  <div>{card.team}</div>
                </div>
              )}
              <div>
                <span className="text-gray-600">Rarity</span>
                <div>{card.rarity}</div>
              </div>
              {(card.flight || card.range) ? (
                <div>
                  <span className="text-gray-600">Abilities</span>
                  <div className="flex gap-2">
                    {card.flight ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">Flight</span> : null}
                    {card.range ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">Range</span> : null}
                  </div>
                </div>
              ) : null}
            </div>

            {card.rulesText && (
              <div className="border-t pt-3">
                <div className="text-gray-600 text-xs mb-1">Card Text</div>
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: card.rulesText }}
                />
              </div>
            )}

            {card.flavorText && (
              <div className="border-t pt-3">
                <div className="text-gray-600 text-xs mb-1">Flavor Text</div>
                <div className="text-sm italic text-gray-600">{card.flavorText}</div>
              </div>
            )}

            {card.illustrator && (
              <div className="border-t pt-3 text-xs text-gray-600">
                Illustrator: {card.illustrator}
              </div>
            )}
          </div>

          {/* Collection */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium mb-2">Collection</div>
            <QuantitySelector cardId={card.id} quantityEn={quantities.en} quantityFr={quantities.fr} />
          </div>
        </div>
      </div>
    </div>
  );
}
