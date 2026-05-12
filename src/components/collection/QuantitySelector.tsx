"use client";

import { updateCardQuantity, type QuantityKind } from "@/lib/actions";
import { useEffect, useRef, useState } from "react";

interface Props {
  cardId: number;
  quantityEn: number;
  quantityFr: number;
  quantityEnFoil: number;
  quantityFrFoil: number;
  compact?: boolean;
}

const DEBOUNCE_MS = 400;

function Row({
  label,
  foil,
  qty,
  onChange,
  saving,
}: {
  label: string;
  foil?: boolean;
  qty: number;
  onChange: (delta: number) => void;
  saving: boolean;
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
        disabled={qty === 0}
        className="w-6 h-6 rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-30 text-xs font-bold leading-none"
      >
        -
      </button>
      <span
        className={`w-6 text-center text-sm font-mono ${
          saving ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {qty}
      </span>
      <button
        onClick={() => onChange(1)}
        className="w-6 h-6 rounded bg-gray-700 text-white hover:bg-gray-600 text-xs font-bold leading-none"
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
  // One pending qty per kind — we only ever flush the latest value.
  const [savingKinds, setSavingKinds] = useState<Set<QuantityKind>>(new Set());

  // Refs so the unmount cleanup sees the latest pending writes.
  const timers = useRef(new Map<QuantityKind, ReturnType<typeof setTimeout>>());
  const pending = useRef(new Map<QuantityKind, number>());

  function markSaving(kind: QuantityKind, on: boolean) {
    setSavingKinds((prev) => {
      const next = new Set(prev);
      if (on) next.add(kind);
      else next.delete(kind);
      return next;
    });
  }

  function scheduleUpdate(kind: QuantityKind, newQty: number) {
    pending.current.set(kind, newQty);
    markSaving(kind, true);

    const existing = timers.current.get(kind);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      const finalQty = pending.current.get(kind);
      pending.current.delete(kind);
      timers.current.delete(kind);
      if (finalQty === undefined) return;
      try {
        await updateCardQuantity(cardId, kind, finalQty);
      } finally {
        markSaving(kind, false);
      }
    }, DEBOUNCE_MS);

    timers.current.set(kind, timer);
  }

  // Flush any pending writes if the component unmounts (e.g. user navigates away).
  useEffect(() => {
    const timersMap = timers.current;
    const pendingMap = pending.current;
    return () => {
      for (const timer of timersMap.values()) clearTimeout(timer);
      timersMap.clear();
      for (const [kind, qty] of pendingMap) {
        // Fire-and-forget: the component is gone, we just don't want to lose the write.
        void updateCardQuantity(cardId, kind, qty);
      }
      pendingMap.clear();
    };
  }, [cardId]);

  function update(
    kind: QuantityKind,
    current: number,
    setter: (v: number) => void,
    delta: number,
  ) {
    const newQty = Math.max(0, current + delta);
    if (newQty === current) return;
    setter(newQty);
    scheduleUpdate(kind, newQty);
  }

  const total = en + fr + enFoil + frFoil;

  return (
    <div className={compact ? "flex flex-col gap-0.5" : "space-y-1"}>
      <Row label="EN" qty={en} saving={savingKinds.has("en")}
        onChange={(d) => update("en", en, setEn, d)} />
      <Row label="EN" foil qty={enFoil} saving={savingKinds.has("en_foil")}
        onChange={(d) => update("en_foil", enFoil, setEnFoil, d)} />
      <Row label="FR" qty={fr} saving={savingKinds.has("fr")}
        onChange={(d) => update("fr", fr, setFr, d)} />
      <Row label="FR" foil qty={frFoil} saving={savingKinds.has("fr_foil")}
        onChange={(d) => update("fr_foil", frFoil, setFrFoil, d)} />
      {!compact && total > 0 && (
        <div className="text-xs text-gray-600 font-medium pl-11">
          Total: {total}
        </div>
      )}
    </div>
  );
}
