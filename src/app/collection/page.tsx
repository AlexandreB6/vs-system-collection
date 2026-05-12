import Link from "next/link";
import { getCollectionCards } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Card = Awaited<ReturnType<typeof getCollectionCards>>[number];

export default async function CollectionPage() {
  const cards = await getCollectionCards();

  const totalQty = cards.reduce(
    (s, c) =>
      s + (c.quantityEn ?? 0) + (c.quantityFr ?? 0) + (c.quantityEnFoil ?? 0) + (c.quantityFrFoil ?? 0),
    0,
  );

  const groups = new Map<string, { name: string; code: string; cards: Card[] }>();
  for (const card of cards) {
    const key = card.setCode ?? "UNKNOWN";
    if (!groups.has(key)) {
      groups.set(key, {
        name: card.setName ?? "Unknown set",
        code: card.setCode ?? "UNKNOWN",
        cards: [],
      });
    }
    groups.get(key)!.cards.push(card);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Collection</h1>
        <span className="text-sm text-gray-600">
          {cards.length} unique cards &middot; {totalQty} total
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          No cards in your collection yet. Browse{" "}
          <Link href="/sets" className="text-blue-600 hover:underline">
            sets
          </Link>{" "}
          to start adding cards.
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groups.values()).map((group) => {
            const groupQty = group.cards.reduce(
              (s, c) => s + c.quantityEn + c.quantityFr + c.quantityEnFoil + c.quantityFrFoil,
              0,
            );
            return (
              <section key={group.code}>
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-lg font-semibold">
                    <Link href={`/sets/${group.code}`} className="hover:underline">
                      {group.name}
                    </Link>
                    <span className="ml-2 text-xs text-gray-500 font-mono">{group.code}</span>
                  </h2>
                  <span className="text-xs text-gray-600">
                    {group.cards.length} unique &middot; {groupQty} total
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {group.cards.map((card) => (
                    <CollectionCard key={card.id} card={card} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ card }: { card: Card }) {
  return (
    <Link
      href={`/cards/${card.id}`}
      className="group block rounded-lg border border-gray-300 bg-white p-2 shadow-sm transition-shadow duration-200 hover:shadow-xl"
    >
      <div className="relative aspect-[5/7] overflow-hidden rounded-md bg-gray-100">
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            no image
          </div>
        )}
      </div>
      <div className="mt-2 text-sm font-medium leading-tight text-gray-900 line-clamp-1">
        {card.name}
      </div>
      <div className="text-xs text-gray-500 font-mono">{card.cardNumber}</div>
      <QtyPills
        en={card.quantityEn ?? 0}
        fr={card.quantityFr ?? 0}
        enFoil={card.quantityEnFoil ?? 0}
        frFoil={card.quantityFrFoil ?? 0}
      />
    </Link>
  );
}

function QtyPills({
  en,
  fr,
  enFoil,
  frFoil,
}: {
  en: number;
  fr: number;
  enFoil: number;
  frFoil: number;
}) {
  const items: { key: string; lang: string; foil: boolean; qty: number }[] = [];
  if (en > 0) items.push({ key: "en", lang: "EN", foil: false, qty: en });
  if (enFoil > 0) items.push({ key: "enFoil", lang: "EN", foil: true, qty: enFoil });
  if (fr > 0) items.push({ key: "fr", lang: "FR", foil: false, qty: fr });
  if (frFoil > 0) items.push({ key: "frFoil", lang: "FR", foil: true, qty: frFoil });
  if (items.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-nowrap gap-1 overflow-hidden">
      {items.map((it) => (
        <span
          key={it.key}
          className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold text-white"
        >
          {it.lang}
          {it.foil && <span className="text-amber-400">★</span>}
          <span className="text-gray-300">×{it.qty}</span>
        </span>
      ))}
    </div>
  );
}
