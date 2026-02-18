// src/components/FoodLogPanel.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { MealKey } from "../utils/meals";
import { mealShares6 } from "../utils/meals";
import type { FoodItem } from "../utils/food";
import { totals, uid } from "../utils/food";

import { defaultFoodDb, calcFromPer100, normalize } from "../utils/foodDb";
import type { FoodDbItem } from "../utils/foodDb";
import { loadFoodDb, saveFoodDb } from "../utils/storage";

import BarcodeScanner from "./BarcodeScanner";
import type { Lang, TDic } from "../utils/i18n";

type MacroTarget = { proteinG: number; carbsG: number; fatG: number; calories: number };

type Props = {
  target: MacroTarget;
  log: Record<MealKey, FoodItem[]>;
  onChange: (next: Record<MealKey, FoodItem[]>) => void;
  lang: Lang;
  t: TDic;
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

export default function FoodLogPanel({ target, log, onChange, t, lang }: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [meal, setMeal] = useState<MealKey>("breakfast");
  const [grams, setGrams] = useState("");

  const addFoodRef = useRef<HTMLDivElement | null>(null);
  const [activeMeal, setActiveMeal] = useState<MealKey | null>(null);

  // Scanner
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState<string>("");

  // Food DB
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [query, setQuery] = useState("");

  const [foodDb, setFoodDb] = useState<FoodDbItem[]>(() => {
    const saved = loadFoodDb() ?? [];
    const map = new Map<string, FoodDbItem>();
    for (const x of defaultFoodDb) map.set(x.id, x);
    for (const x of saved) map.set(x.id, x);
    return Array.from(map.values());
  });

  const [openConsumed, setOpenConsumed] = useState(false);

  // Manual add to DB
  const [newFoodName, setNewFoodName] = useState("");
  const [newP, setNewP] = useState("");
  const [newC, setNewC] = useState("");
  const [newF, setNewF] = useState("");

  // ✅ meal labels from i18n
  const mealLabelsI18n = useMemo<Record<MealKey, string>>(
    () => ({
      breakfast: t.meal_breakfast,
      snack1: t.meal_snack1,
      lunch: t.meal_lunch,
      snack2: t.meal_snack2,
      dinner: t.meal_dinner,
      supper: t.meal_supper,
    }),
    [t]
  );

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

  // Targets per meal
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

  // Daily progress
  const dailyKcalPct = percent(dayTotals.calories, target.calories);
  const dailyKcalBar = clamp01to100(dailyKcalPct);
  const dailyOver = dayTotals.calories - target.calories;

  const dailyLabel =
    dailyOver > 0 ? t.fl_over(dailyOver) : t.fl_remaining_kcal(Math.max(0, -dailyOver));

  const dailyFillClass =
    dailyKcalPct <= 80
      ? "dayProgressFill fillOk"
      : dailyKcalPct <= 110
      ? "dayProgressFill fillWarn"
      : "dayProgressFill fillBad";

  function jumpToMeal(m: MealKey) {
    setActiveMeal(m);
    setMeal(m);
    setIsAddOpen(true);

    setTimeout(() => {
      addFoodRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
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

    const next = { ...log, [meal]: [...(log[meal] ?? []), item] };
    onChange(next);

    setGrams("");
    setQuery("");
    setSelectedFoodId("");
  }

  function removeFood(mealKey: MealKey, id: string) {
    const next = { ...log, [mealKey]: (log[mealKey] ?? []).filter((x) => x.id !== id) };
    onChange(next);
  }

  function addNewFoodToDb() {
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
      barcode: pendingBarcode || undefined,
    };

    setFoodDb((prev) => {
      const key = normalize(nm);
      const filtered = prev.filter((x) => normalize(x.name) !== key);
      return [item, ...filtered];
    });

    setQuery(nm);
    setSelectedFoodId(item.id);

    setPendingBarcode("");
    setNewFoodName("");
    setNewP("");
    setNewC("");
    setNewF("");
  }

  function onBarcodeDetected(code: string) {
    setIsScannerOpen(false);

    const found = foodDb.find((x) => x.barcode === code) ?? null;

    if (found) {
      setSelectedFoodId(found.id);
      setQuery(found.name);
      setPendingBarcode("");
      setIsAddOpen(true);

      setTimeout(() => {
        addFoodRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);

      return;
    }

    setPendingBarcode(code);
    setIsAddOpen(true);
    setNewFoodName("");
    setNewP("");
    setNewC("");
    setNewF("");

    setTimeout(() => {
      addFoodRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  const hasAnyItems = (Object.keys(mealLabelsI18n) as MealKey[]).some(
    (k) => (log[k] ?? []).length > 0
  );

  return (
    <div>
      <div className="foodHeader">
        <div>
          <h2 style={{ margin: 0 }}>{t.foodlog_title}</h2>
          <div className="note">{t.fl_note}</div>
        </div>

        <button className="btnGhost" type="button" onClick={() => setIsScannerOpen(true)}>
          {t.fl_scan_barcode}
        </button>

        <button className="btnPrimary" type="button" onClick={() => setIsAddOpen((v) => !v)}>
          {isAddOpen ? t.fl_add_food_toggle_close : t.fl_add_food_toggle_open}
        </button>
      </div>

      {/* Daily summary */}
      <div className="foodSummary">
        <div className="miniCard">
          <div className="miniTitle">{t.fl_target}</div>
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
              <div className="miniTitle">{t.fl_consumed}</div>
              <div className="miniValue">{dayTotals.calories} kcal</div>
              <div className="muted">
                🥩 {dayTotals.protein}g · 🍚 {dayTotals.carbs}g · 🧈 {dayTotals.fat}g
              </div>
            </div>

            <span className="chev">{openConsumed ? "▲" : "▼"}</span>
          </button>

          <div className={`miniCollapse ${openConsumed ? "open" : ""}`}>
            <div className="miniCollapseInner">
              <div className="miniListTitle">{t.fl_items_today}</div>

              {!hasAnyItems ? (
                <div className="note">{t.fl_no_foods_yet}</div>
              ) : (
                <div className="consumedList">
                  {(Object.keys(mealLabelsI18n) as MealKey[]).map((mk) => {
                    const items = log[mk] ?? [];
                    if (items.length === 0) return null;

                    return (
                      <div key={mk} className="consumedGroup">
                        <div className="consumedGroupTitle">{mealLabelsI18n[mk]}</div>

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
                              aria-label={t.fl_remove}
                              title={t.fl_remove}
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
          <div className="miniTitle">{t.fl_remaining}</div>
          <div className="miniValue">{remaining.calories} kcal</div>
          <div className="muted" style={{ marginTop: 8 }}>
            🥩 {remaining.proteinG}g · 🍚 {remaining.carbsG}g · 🧈 {remaining.fatG}g
          </div>
        </div>
      </div>

      {/* Daily progress bar */}
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

      {/* Add food */}
      {isAddOpen && (
        <div ref={addFoodRef} className="panel" style={{ marginTop: 12 }}>
          <h2>{t.fl_add_food_title}</h2>

          <div className="grid2">
            <label>
              {t.fl_meal}
              <select value={meal} onChange={(e) => setMeal(e.target.value as MealKey)}>
                {(Object.keys(mealLabelsI18n) as MealKey[]).map((k) => (
                  <option key={k} value={k}>
                    {mealLabelsI18n[k]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.fl_search_food}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.fl_search_placeholder}
              />
            </label>

            <label>
              {t.fl_select_food}
              <select value={selectedFoodId} onChange={(e) => setSelectedFoodId(e.target.value)}>
                <option value="">{t.fl_choose}</option>
                {filteredFoods.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.fl_grams}
              <input
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                placeholder={t.fl_grams_placeholder}
                inputMode="numeric"
              />
            </label>

            <div className="actionsRow" style={{ marginTop: 10 }}>
              <button className="btnPrimary" type="button" onClick={addFood} disabled={!selectedFood}>
                {t.fl_add}
              </button>
            </div>

            <div className="divider" />

            <h2 style={{ marginTop: 0 }}>
              {t.fl_add_new_food_title} {pendingBarcode ? ` ${t.fl_barcode_captured}` : ""}
            </h2>

            <div className="grid2">
              <label>
                {t.fl_food_name}
                <input
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  placeholder={t.fl_food_name_placeholder}
                />
              </label>

              <div />

              <label>
                {t.fl_protein_100}
                <input value={newP} onChange={(e) => setNewP(e.target.value)} inputMode="numeric" />
              </label>

              <label>
                {t.fl_carbs_100}
                <input value={newC} onChange={(e) => setNewC(e.target.value)} inputMode="numeric" />
              </label>

              <label>
                {t.fl_fat_100}
                <input value={newF} onChange={(e) => setNewF(e.target.value)} inputMode="numeric" />
              </label>
            </div>

            <div className="actionsRow" style={{ marginTop: 10 }}>
              <button className="btnGhost" type="button" onClick={addNewFoodToDb}>
                {t.fl_save_to_db}
              </button>
            </div>

            <div className="note" style={{ marginTop: 6 }}>{t.fl_tip}</div>
          </div>

          {selectedFood && grams.trim() && clampNum(grams) > 0 && (
            <div className="miniCard" style={{ marginTop: 12 }}>
              {(() => {
                const g = clampNum(grams);
                const m = calcFromPer100(selectedFood.per100, g);
                return (
                  <>
                    <div className="miniTitle">{t.fl_preview}</div>
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
      {(Object.keys(mealLabelsI18n) as MealKey[]).map((key) => {
        const items = log[key] ?? [];
        const tt = totals(items);
        const goalForMeal = perMealTargets[key];

        const kcalPct = percent(tt.calories, goalForMeal.calories);
        const kcalBar = clamp01to100(kcalPct);

        const barClass =
          kcalPct <= 80
            ? "progressBar progressOk"
            : kcalPct <= 110
            ? "progressBar progressWarn"
            : "progressBar progressBad";

        const proteinPct = clamp01to100(percent(tt.protein, goalForMeal.proteinG));
        const carbsPct = clamp01to100(percent(tt.carbs, goalForMeal.carbsG));
        const fatPct = clamp01to100(percent(tt.fat, goalForMeal.fatG));

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
              <div className="mealName">{mealLabelsI18n[key]}</div>
              <div className="mealMeta">
                {t.fl_target_kcal} {goalForMeal.calories} kcal · {t.fl_consumed_kcal} {tt.calories} kcal
              </div>
            </div>

            <div className="progressWrap">
              <div className={barClass} style={{ width: `${kcalBar}%` }} />
            </div>

            <div className="note" style={{ marginTop: 6 }}>
              {tt.calories}/{goalForMeal.calories} kcal ({kcalPct}%)
            </div>

            <div className="miniBars">
              <div className="miniBarRow">
                <div className="miniLabel">{t.fl_protein}</div>
                <div className="miniWrap">
                  <div className="miniFill fillProtein" style={{ width: `${proteinPct}%` }} />
                </div>
                <div className="miniPct">{proteinPct}%</div>
              </div>

              <div className="miniBarRow">
                <div className="miniLabel">{t.fl_carbs}</div>
                <div className="miniWrap">
                  <div className="miniFill fillCarbs" style={{ width: `${carbsPct}%` }} />
                </div>
                <div className="miniPct">{carbsPct}%</div>
              </div>

              <div className="miniBarRow">
                <div className="miniLabel">{t.fl_fat}</div>
                <div className="miniWrap">
                  <div className="miniFill fillFat" style={{ width: `${fatPct}%` }} />
                </div>
                <div className="miniPct">{fatPct}%</div>
              </div>
            </div>

            <div className="mealMeta" style={{ marginTop: 8 }}>
              {t.fl_meal_target_line}: 🥩 {goalForMeal.proteinG}g · 🍚 {goalForMeal.carbsG}g · 🧈 {goalForMeal.fatG}g
              <br />
              {t.fl_meal_consumed_line}: 🥩 {tt.protein}g · 🍚 {tt.carbs}g · 🧈 {tt.fat}g
            </div>

            {items.length === 0 ? (
              <div className="note" style={{ marginTop: 10 }}>
                {t.fl_no_foods_yet}
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
                      aria-label={t.fl_remove}
                      title={t.fl_remove}
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

      <BarcodeScanner
        isActive={isScannerOpen}
        onDetected={onBarcodeDetected}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
