"use client";

import { updateCardQuantity, type QuantityKind } from "@/lib/actions";
import { useState, useTransition } from "react";

interface Props {
  cardId: number;
  quantityEn: number;
  quantityFr: number;
  quantityEnFoil: number;
  quantityFrFoil: number;
  compact?: boolean;
}

function Row({
  label,
  foil,
  qty,
  onChange,
  isPending,
}: {
  label: string;
  foil?: boolean;
  qty: number;
  onChange: (delta: number) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`text-xs font-medium w-10 ${
          foil ? "text-amber-600 font-semibold" : "text-gray-700"
        }`}
      >
        {label}
        {foil && <span className="ml-0.5">★</span>}
      </span>
      <button
        onClick={() => onChange(-1)}
        disabled={qty === 0 || isPending}
        className="w-6 h-6 rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-30 text-xs font-bold leading-none"
      >
        -
      </button>
      <span
        className={`w-6 text-gray-600 text-center text-sm font-mono ${isPending ? "opacity-50" : ""}`}
      >
        {qty}
      </span>
      <button
        onClick={() => onChange(1)}
        disabled={isPending}
        className="w-6 h-6 rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-30 text-xs font-bold leading-none"
      >
        +
      </button>
    </div>
  );
}

export function QuantitySelector({
  cardId,
  quantityEn: initEn,
  quantityFr: initFr,
  quantityEnFoil: initEnFoil,
  quantityFrFoil: initFrFoil,
  compact,
}: Props) {
  const [en, setEn] = useState(initEn);
  const [fr, setFr] = useState(initFr);
  const [enFoil, setEnFoil] = useState(initEnFoil);
  const [frFoil, setFrFoil] = useState(initFrFoil);
  const [isPending, startTransition] = useTransition();

  function update(
    kind: QuantityKind,
    current: number,
    setter: (v: number) => void,
    delta: number,
  ) {
    const newQty = Math.max(0, current + delta);
    setter(newQty);
    startTransition(async () => {
      await updateCardQuantity(cardId, kind, newQty);
    });
  }

  const total = en + fr + enFoil + frFoil;

  return (
    <div className={compact ? "flex flex-col gap-0.5" : "space-y-1"}>
      <Row label="EN" qty={en} isPending={isPending}
        onChange={(d) => update("en", en, setEn, d)} />
      <Row label="EN" foil qty={enFoil} isPending={isPending}
        onChange={(d) => update("en_foil", enFoil, setEnFoil, d)} />
      <Row label="FR" qty={fr} isPending={isPending}
        onChange={(d) => update("fr", fr, setFr, d)} />
      <Row label="FR" foil qty={frFoil} isPending={isPending}
        onChange={(d) => update("fr_foil", frFoil, setFrFoil, d)} />
      {!compact && total > 0 && (
        <div className="text-xs text-gray-600 font-medium pl-11">
          Total: {total}
        </div>
      )}
    </div>
  );
}
