import { useEffect, useMemo, useRef, useState } from "react";
import type { MealKey } from "../utils/meals";
import { mealLabels, mealShares6 } from "../utils/meals";
import type { FoodItem } from "../utils/food";
import { totals, uid } from "../utils/food";

import { defaultFoodDb, calcFromPer100, normalize } from "../utils/foodDb";
import type { FoodDbItem } from "../utils/foodDb";
import { loadFoodDb, saveFoodDb } from "../utils/storage";

import BarcodeScanner from "./BarcodeScanner";

type MacroTarget = { proteinG: number; carbsG: number; fatG: number; calories: number };

type Props = {
  target: MacroTarget;
  log: Record<MealKey, FoodItem[]>;
  onChange: (next: Record<MealKey, FoodItem[]>) => void;
};

function clampNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function clamp01to100(v: number) {
  return Math.min(100, Math.max(0, v));
}
function percent(consumed: number, target: number) {
  return target <= 0 ? 0 : Math.round((consumed / target) * 100);
}

export default function FoodLogPanel({ target, log, onChange }: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [meal, setMeal] = useState<MealKey>("breakfast");
  const [grams, setGrams] = useState("");

  const addFoodRef = useRef<HTMLDivElement | null>(null);
  const [activeMeal, setActiveMeal] = useState<MealKey | null>(null);

  // Scanner
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Barcode flow modal state
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [barcodeKnownItemId, setBarcodeKnownItemId] = useState<string>(""); // ha ismert termék

  // ----------- Food DB (default + saved MERGE) -----------
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [query, setQuery] = useState("");

  const [foodDb, setFoodDb] = useState<FoodDbItem[]>(() => {
    const saved = loadFoodDb() ?? [];
    const map = new Map<string, FoodDbItem>();
    for (const x of defaultFoodDb) map.set(x.id, x);
    for (const x of saved) map.set(x.id, x);
    return Array.from(map.values());
  });

  // Consumed dropdown
  const [openConsumed, setOpenConsumed] = useState(false);

  // Manual add to DB (also used for barcode-new save)
  const [newFoodName, setNewFoodName] = useState("");
  const [newP, setNewP] = useState("");
  const [newC, setNewC] = useState("");
  const [newF, setNewF] = useState("");

  // grams for barcode modal (separate, so it doesn't mess with Add food panel)
  const [barcodeGrams, setBarcodeGrams] = useState("");

  useEffect(() => {
    saveFoodDb(foodDb);
  }, [foodDb]);

  const filteredFoods = useMemo(() => {
    const q = normalize(query);
    const list = q ? foodDb.filter((x) => normalize(x.name).includes(q)) : foodDb;
    return list
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 500);
  }, [query, foodDb]);

  const selectedFood = useMemo(() => {
    return foodDb.find((x) => x.id === selectedFoodId) ?? null;
  }, [foodDb, selectedFoodId]);

  // barcode known item
  const barcodeKnownItem = useMemo(() => {
    return foodDb.find((x) => x.id === barcodeKnownItemId) ?? null;
  }, [foodDb, barcodeKnownItemId]);

  // ----------- Targets per meal -----------
  const perMealTargets = useMemo(() => {
    const map: Record<MealKey, MacroTarget> = {
      breakfast: { proteinG: 0, carbsG: 0, fatG: 0, calories: 0 },
      snack1: { proteinG: 0, carbsG: 0, fatG: 0, calories: 0 },
      lunch: { proteinG: 0, carbsG: 0, fatG: 0, calories: 0 },
      snack2: { proteinG: 0, carbsG: 0, fatG: 0, calories: 0 },
      dinner: { proteinG: 0, carbsG: 0, fatG: 0, calories: 0 },
      supper: { proteinG: 0, carbsG: 0, fatG: 0, calories: 0 },
    };

    for (const s of mealShares6) {
      map[s.key] = {
        proteinG: Math.round(target.proteinG * s.share),
        carbsG: Math.round(target.carbsG * s.share),
        fatG: Math.round(target.fatG * s.share),
        calories: Math.round(target.calories * s.share),
      };
    }
    return map;
  }, [target]);

  const dayTotals = useMemo(() => {
    const all = Object.values(log).flat();
    return totals(all);
  }, [log]);

  const remaining = useMemo(() => {
    return {
      calories: Math.max(0, target.calories - dayTotals.calories),
      proteinG: Math.max(0, target.proteinG - dayTotals.protein),
      carbsG: Math.max(0, target.carbsG - dayTotals.carbs),
      fatG: Math.max(0, target.fatG - dayTotals.fat),
    };
  }, [target, dayTotals]);

  // ----------- Daily progress -----------
  const dailyKcalPct = percent(dayTotals.calories, target.calories);
  const dailyKcalBar = clamp01to100(dailyKcalPct);
  const dailyOver = dayTotals.calories - target.calories;
  const dailyLabel = dailyOver > 0 ? `Over +${dailyOver} kcal` : `Remaining ${Math.max(0, -dailyOver)} kcal`;

  const dailyFillClass =
    dailyKcalPct <= 80 ? "dayProgressFill fillOk" : dailyKcalPct <= 110 ? "dayProgressFill fillWarn" : "dayProgressFill fillBad";

  // ----------- Actions -----------
  function addFoodToMeal(item: FoodItem, mealKey: MealKey) {
    const next = { ...log, [mealKey]: [...(log[mealKey] ?? []), item] };
    onChange(next);
  }

  function onBarcodeDetected(code: string) {
    // leállítjuk a scannert
    setIsScannerOpen(false);

    setScannedCode(code);

    const found = foodDb.find((x) => x.barcode === code) ?? null;

    if (found) {
      // ismert termék
      setBarcodeKnownItemId(found.id);
      setBarcodeGrams("");
      setBarcodeModalOpen(true);
      return;
    }

    // új termék
    setBarcodeKnownItemId("");
    setBarcodeGrams("");
    setNewFoodName("");
    setNewP("");
    setNewC("");
    setNewF("");
    setBarcodeModalOpen(true);
  }

  function closeBarcodeModal() {
    setBarcodeModalOpen(false);
    setScannedCode("");
    setBarcodeKnownItemId("");
    setBarcodeGrams("");
  }

  function addKnownBarcodeToDay() {
    if (!barcodeKnownItem) return;
    const g = barcodeGrams.trim() ? clampNum(barcodeGrams) : 0;
    if (g <= 0) return;

    const m = calcFromPer100(barcodeKnownItem.per100, g);

    const item: FoodItem = {
      id: uid(),
      name: barcodeKnownItem.name,
      grams: g,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
    };

    addFoodToMeal(item, meal);
    closeBarcodeModal();
  }

  function saveNewBarcodeProductToDb(andAddToDay: boolean) {
    const nm = newFoodName.trim();
    if (!nm) return;

    const p = clampNum(newP);
    const c = clampNum(newC);
    const f = clampNum(newF);
    if (p <= 0 && c <= 0 && f <= 0) return;

    const newItem: FoodDbItem = {
      id: uid(),
      name: nm,
      per100: { protein: p, carbs: c, fat: f },
      barcode: scannedCode || undefined,
    };

    setFoodDb((prev) => {
      // név alapján duplikáció csere
      const key = normalize(nm);
      const filtered = prev.filter((x) => normalize(x.name) !== key);
      return [newItem, ...filtered];
    });

    // rögtön be is rakjuk a napi kajába, ha kéred
    if (andAddToDay) {
      const g = barcodeGrams.trim() ? clampNum(barcodeGrams) : 0;
      if (g > 0) {
        const m = calcFromPer100(newItem.per100, g);
        addFoodToMeal(
          {
            id: uid(),
            name: newItem.name,
            grams: g,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
          },
          meal
        );
      }
    }

    closeBarcodeModal();
  }

  function addFood() {
    if (!selectedFood) return;
    const g = grams.trim() ? clampNum(grams) : 0;
    if (g <= 0) return;

    const m = calcFromPer100(selectedFood.per100, g);

    const item: FoodItem = {
      id: uid(),
      name: selectedFood.name,
      grams: g,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
    };

    addFoodToMeal(item, meal);

    setGrams("");
    setQuery("");
    setSelectedFoodId("");
  }

  function jumpToMeal(m: MealKey) {
    setActiveMeal(m);
    setMeal(m);
    setIsAddOpen(true);

    setTimeout(() => {
      addFoodRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  function addNewFoodToDbManual() {
    const nm = newFoodName.trim();
    if (!nm) return;

    const p = clampNum(newP);
    const c = clampNum(newC);
    const f = clampNum(newF);
    if (p <= 0 && c <= 0 && f <= 0) return;

    const item: FoodDbItem = {
      id: uid(),
      name: nm,
      per100: { protein: p, carbs: c, fat: f },
    };

    setFoodDb((prev) => {
      const key = normalize(nm);
      const filtered = prev.filter((x) => normalize(x.name) !== key);
      return [item, ...filtered];
    });

    setQuery(nm);
    setSelectedFoodId(item.id);

    setNewFoodName("");
    setNewP("");
    setNewC("");
    setNewF("");
  }

  function removeFood(mealKey: MealKey, id: string) {
    const next = { ...log, [mealKey]: (log[mealKey] ?? []).filter((x) => x.id !== id) };
    onChange(next);
  }

  const hasAnyItems = Object.keys(mealLabels).some((k) => (log[k as MealKey] ?? []).length > 0);

  return (
    <div className="foodLogPanel">
      {/* ✅ Sticky scanner panel (csak ha aktív) */}
      <BarcodeScanner
        isActive={isScannerOpen}
        onDetected={onBarcodeDetected}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* ✅ Sticky barcode modal flow (ismert/új) */}
      {barcodeModalOpen && (
        <div className="scanInline scanModal" role="dialog" aria-modal="true">
          <div className="scanTop">
            <strong>Barcode: {scannedCode}</strong>
            <button className="btnGhost" type="button" onClick={closeBarcodeModal}>
              Close
            </button>
          </div>

          {barcodeKnownItem ? (
            <>
              <div className="note" style={{ marginTop: 6 }}>
                Felismert termék: <strong>{barcodeKnownItem.name}</strong>
              </div>

              <div className="grid2" style={{ marginTop: 10 }}>
                <label>
                  Meal
                  <select value={meal} onChange={(e) => setMeal(e.target.value as MealKey)}>
                    {Object.keys(mealLabels).map((k) => (
                      <option key={k} value={k}>
                        {mealLabels[k as MealKey]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Grams
                  <input
                    value={barcodeGrams}
                    onChange={(e) => setBarcodeGrams(e.target.value)}
                    placeholder="e.g. 150"
                    inputMode="numeric"
                  />
                </label>
              </div>

              {barcodeGrams.trim() && clampNum(barcodeGrams) > 0 && (
                <div className="miniCard" style={{ marginTop: 10 }}>
                  {(() => {
                    const g = clampNum(barcodeGrams);
                    const m = calcFromPer100(barcodeKnownItem.per100, g);
                    return (
                      <>
                        <div className="miniTitle">Preview</div>
                        <div className="miniValue">
                          {barcodeKnownItem.name} ({g}g) — {m.calories} kcal
                        </div>
                        <div className="muted">
                          🥩 {m.protein}g · 🍚 {m.carbs}g · 🧈 {m.fat}g
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="actionsRow" style={{ marginTop: 10 }}>
                <button className="btnPrimary" type="button" onClick={addKnownBarcodeToDay}>
                  Add to day
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="note" style={{ marginTop: 6 }}>
                Új termék. Add meg a tápértéket /100g, majd mentsük el.
              </div>

              <div className="grid2" style={{ marginTop: 10 }}>
                <label>
                  Meal (optional add)
                  <select value={meal} onChange={(e) => setMeal(e.target.value as MealKey)}>
                    {Object.keys(mealLabels).map((k) => (
                      <option key={k} value={k}>
                        {mealLabels[k as MealKey]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Grams (ha rögtön hozzáadod)
                  <input
                    value={barcodeGrams}
                    onChange={(e) => setBarcodeGrams(e.target.value)}
                    placeholder="e.g. 150"
                    inputMode="numeric"
                  />
                </label>

                <label>
                  Food name
                  <input value={newFoodName} onChange={(e) => setNewFoodName(e.target.value)} placeholder="e.g. Protein pudding" />
                </label>

                <div />

                <label>
                  Protein / 100g
                  <input value={newP} onChange={(e) => setNewP(e.target.value)} inputMode="numeric" />
                </label>

                <label>
                  Carbs / 100g
                  <input value={newC} onChange={(e) => setNewC(e.target.value)} inputMode="numeric" />
                </label>

                <label>
                  Fat / 100g
                  <input value={newF} onChange={(e) => setNewF(e.target.value)} inputMode="numeric" />
                </label>
              </div>

              <div className="actionsRow" style={{ marginTop: 10 }}>
                <button className="btnGhost" type="button" onClick={() => saveNewBarcodeProductToDb(false)}>
                  Save to DB
                </button>

                <button
                  className="btnPrimary"
                  type="button"
                  onClick={() => saveNewBarcodeProductToDb(true)}
                  disabled={!barcodeGrams.trim() || clampNum(barcodeGrams) <= 0}
                >
                  Save + Add to day
                </button>
              </div>

              <div className="note" style={{ marginTop: 8 }}>
                Tipp: a címkéről írd be a /100g értékeket. Ha egyszer elmented, legközelebb már csak grammot kér.
              </div>
            </>
          )}
        </div>
      )}

      {/* Header */}
      <div className="foodHeader">
        <div>
          <h2 style={{ margin: 0 }}>Food log</h2>
          <div className="note">Select food + grams. Macros are calculated automatically.</div>
        </div>

        <button
          className="btnGhost"
          type="button"
          onClick={() => {
            setIsScannerOpen(true);
            // legyen “kéznél”
            addFoodRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          📷 Scan barcode
        </button>

        <button className="btnPrimary" type="button" onClick={() => setIsAddOpen((v) => !v)}>
          {isAddOpen ? "Close" : "➕ Add food"}
        </button>
      </div>

      {/* Daily summary */}
      <div className="foodSummary">
        <div className="miniCard">
          <div className="miniTitle">Target</div>
          <div className="miniValue">{target.calories} kcal</div>
          <div className="muted">
            🥩 {target.proteinG}g · 🍚 {target.carbsG}g · 🧈 {target.fatG}g
          </div>
        </div>

        <div className="miniCard miniCardCollapsible">
          <button
            type="button"
            className="miniCardHeaderBtn"
            aria-expanded={openConsumed}
            onClick={() => setOpenConsumed((v) => !v)}
          >
            <div>
              <div className="miniTitle">Consumed</div>
              <div className="miniValue">{dayTotals.calories} kcal</div>
              <div className="muted">
                🥩 {dayTotals.protein}g · 🍚 {dayTotals.carbs}g · 🧈 {dayTotals.fat}g
              </div>
            </div>
            <span className="chev">{openConsumed ? "▲" : "▼"}</span>
          </button>

          <div className={`miniCollapse ${openConsumed ? "open" : ""}`}>
            <div className="miniCollapseInner">
              <div className="miniListTitle">Items today</div>

              {!hasAnyItems ? (
                <div className="note">No foods yet.</div>
              ) : (
                <div className="consumedList">
                  {Object.keys(mealLabels).map((k) => {
                    const mk = k as MealKey;
                    const items = log[mk] ?? [];
                    if (items.length === 0) return null;

                    return (
                      <div key={mk} className="consumedGroup">
                        <div className="consumedGroupTitle">{mealLabels[mk]}</div>

                        {items.map((x) => (
                          <div key={x.id} className="consumedRow">
                            <div className="consumedLeft">
                              <div className="consumedName">
                                {x.name}
                                {typeof x.grams === "number" ? ` (${x.grams}g)` : ""}
                              </div>
                              <div className="consumedMacros">
                                🥩 {x.protein}g · 🍚 {x.carbs}g · 🧈 {x.fat}g ·{" "}
                                {Math.round(x.protein * 4 + x.carbs * 4 + x.fat * 9)} kcal
                              </div>
                            </div>

                            <button
                              className="iconBtn"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFood(mk, x.id);
                              }}
                              aria-label="Remove"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="miniCard">
          <div className="miniTitle">Remaining</div>
          <div className="miniValue">{remaining.calories} kcal</div>
          <div className="muted" style={{ marginTop: 8 }}>
            🥩 {remaining.proteinG}g · 🍚 {remaining.carbsG}g · 🧈 {remaining.fatG}g
          </div>
        </div>
      </div>

      {/* Daily progress */}
      <div className="dayProgress">
        <div className="dayProgressTop">
          <span>
            {dayTotals.calories} / {target.calories} kcal ({dailyKcalPct}%)
          </span>
          <span>{dailyLabel}</span>
        </div>
        <div className="dayProgressWrap">
          <div className={dailyFillClass} style={{ width: `${dailyKcalBar}%` }} />
        </div>
      </div>

      {/* Add food panel */}
      {isAddOpen && (
        <div ref={addFoodRef} className="panel" style={{ marginTop: 12 }}>
          <h2>Add food</h2>

          <div className="grid2">
            <label>
              Meal
              <select value={meal} onChange={(e) => setMeal(e.target.value as MealKey)}>
                {Object.keys(mealLabels).map((k) => (
                  <option key={k} value={k}>
                    {mealLabels[k as MealKey]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Search food
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="type e.g. chicken, rice..." />
            </label>

            <label>
              Select food
              <select value={selectedFoodId} onChange={(e) => setSelectedFoodId(e.target.value)}>
                <option value="">— choose —</option>
                {filteredFoods.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Grams
              <input value={grams} onChange={(e) => setGrams(e.target.value)} placeholder="e.g. 150" inputMode="numeric" />
            </label>

            <div className="actionsRow" style={{ marginTop: 10 }}>
              <button className="btnPrimary" type="button" onClick={addFood} disabled={!selectedFood}>
                Add
              </button>
            </div>

            <div className="divider" />

            <h2 style={{ marginTop: 0 }}>Add new food to database (per 100g)</h2>

            <div className="grid2">
              <label>
                Food name
                <input
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  placeholder="e.g. My brand protein bar"
                />
              </label>

              <div />

              <label>
                Protein / 100g
                <input value={newP} onChange={(e) => setNewP(e.target.value)} inputMode="numeric" />
              </label>

              <label>
                Carbs / 100g
                <input value={newC} onChange={(e) => setNewC(e.target.value)} inputMode="numeric" />
              </label>

              <label>
                Fat / 100g
                <input value={newF} onChange={(e) => setNewF(e.target.value)} inputMode="numeric" />
              </label>
            </div>

            <div className="actionsRow" style={{ marginTop: 10 }}>
              <button className="btnGhost" type="button" onClick={addNewFoodToDbManual}>
                Save to database
              </button>
            </div>

            <div className="note" style={{ marginTop: 6 }}>
              Tip: add per-100g values from the nutrition label. Then select grams above.
            </div>
          </div>

          {selectedFood && grams.trim() && clampNum(grams) > 0 && (
            <div className="miniCard" style={{ marginTop: 12 }}>
              {(() => {
                const g = clampNum(grams);
                const m = calcFromPer100(selectedFood.per100, g);
                return (
                  <>
                    <div className="miniTitle">Preview</div>
                    <div className="miniValue">
                      {selectedFood.name} ({g}g) — {m.calories} kcal
                    </div>
                    <div className="muted">
                      🥩 {m.protein}g · 🍚 {m.carbs}g · 🧈 {m.fat}g
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Meals */}
      {Object.keys(mealLabels).map((k) => {
        const key = k as MealKey;
        const items = log[key] ?? [];
        const t = totals(items);
        const goalForMeal = perMealTargets[key];

        const kcalPct = percent(t.calories, goalForMeal.calories);
        const kcalBar = clamp01to100(kcalPct);

        const barClass =
          kcalPct <= 80 ? "progressBar progressOk" : kcalPct <= 110 ? "progressBar progressWarn" : "progressBar progressBad";

        const proteinPct = clamp01to100(percent(t.protein, goalForMeal.proteinG));
        const carbsPct = clamp01to100(percent(t.carbs, goalForMeal.carbsG));
        const fatPct = clamp01to100(percent(t.fat, goalForMeal.fatG));

        return (
          <div
            key={key}
            className={`mealCard ${isAddOpen && activeMeal === key ? "isActive" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => jumpToMeal(key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") jumpToMeal(key);
            }}
          >
            <div className="mealTop">
              <div className="mealName">{mealLabels[key]}</div>
              <div className="mealMeta">
                Target {goalForMeal.calories} kcal · Consumed {t.calories} kcal
              </div>
            </div>

            <div className="progressWrap">
              <div className={barClass} style={{ width: `${kcalBar}%` }} />
            </div>

            <div className="note" style={{ marginTop: 6 }}>
              {t.calories}/{goalForMeal.calories} kcal ({kcalPct}%)
            </div>

            <div className="miniBars">
              <div className="miniBarRow">
                <div className="miniLabel">Protein</div>
                <div className="miniWrap">
                  <div className="miniFill fillProtein" style={{ width: `${proteinPct}%` }} />
                </div>
                <div className="miniPct">{proteinPct}%</div>
              </div>

              <div className="miniBarRow">
                <div className="miniLabel">Carbs</div>
                <div className="miniWrap">
                  <div className="miniFill fillCarbs" style={{ width: `${carbsPct}%` }} />
                </div>
                <div className="miniPct">{carbsPct}%</div>
              </div>

              <div className="miniBarRow">
                <div className="miniLabel">Fat</div>
                <div className="miniWrap">
                  <div className="miniFill fillFat" style={{ width: `${fatPct}%` }} />
                </div>
                <div className="miniPct">{fatPct}%</div>
              </div>
            </div>

            <div className="mealMeta" style={{ marginTop: 8 }}>
              Target: 🥩 {goalForMeal.proteinG}g · 🍚 {goalForMeal.carbsG}g · 🧈 {goalForMeal.fatG}g
              <br />
              Consumed: 🥩 {t.protein}g · 🍚 {t.carbs}g · 🧈 {t.fat}g
            </div>

            {items.length === 0 ? (
              <div className="note" style={{ marginTop: 10 }}>
                No foods yet.
              </div>
            ) : (
              <ul className="foodList">
                {items.map((x) => (
                  <li key={x.id} className="foodRow">
                    <div className="foodLeft">
                      <div className="foodName">
                        {x.name}
                        {typeof x.grams === "number" ? ` (${x.grams}g)` : ""}
                      </div>
                      <div className="foodMacros">
                        🥩 {x.protein}g · 🍚 {x.carbs}g · 🧈 {x.fat}g
                      </div>
                    </div>

                    <button
                      className="iconBtn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFood(key, x.id);
                      }}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
