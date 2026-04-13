"use client";

import { updateCardQuantity } from "@/lib/actions";
import { useState, useTransition } from "react";

interface Props {
  cardId: number;
  quantityEn: number;
  quantityFr: number;
  compact?: boolean;
}

function LangRow({
  label,
  qty,
  onChange,
  isPending,
}: {
  label: string;
  qty: number;
  onChange: (delta: number) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-gray-700 w-6">{label}</span>
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
  compact,
}: Props) {
  const [en, setEn] = useState(initEn);
  const [fr, setFr] = useState(initFr);
  const [isPending, startTransition] = useTransition();

  function handleEn(delta: number) {
    const newQty = Math.max(0, en + delta);
    setEn(newQty);
    startTransition(async () => {
      await updateCardQuantity(cardId, "en", newQty);
    });
  }

  function handleFr(delta: number) {
    const newQty = Math.max(0, fr + delta);
    setFr(newQty);
    startTransition(async () => {
      await updateCardQuantity(cardId, "fr", newQty);
    });
  }

  const total = en + fr;

  if (compact) {
    return (
      <div className="flex flex-col gap-0.5">
        <LangRow
          label="EN"
          qty={en}
          onChange={handleEn}
          isPending={isPending}
        />
        <LangRow
          label="FR"
          qty={fr}
          onChange={handleFr}
          isPending={isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <LangRow label="EN" qty={en} onChange={handleEn} isPending={isPending} />
      <LangRow label="FR" qty={fr} onChange={handleFr} isPending={isPending} />
      {total > 0 && (
        <div className="text-xs text-gray-600 font-medium pl-7">
          Total: {total}
        </div>
      )}
    </div>
  );
}
