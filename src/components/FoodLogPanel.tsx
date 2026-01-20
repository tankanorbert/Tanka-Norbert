import { useEffect, useMemo, useState } from "react";
import type { MealKey } from "../utils/meals";
import { mealLabels, mealShares6 } from "../utils/meals";
import type { FoodItem } from "../utils/food";
import { totals, uid } from "../utils/food";

import { loadFoodTemplates, saveFoodTemplates } from "../utils/storage";
import type { FoodTemplate } from "../utils/storage";

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

export default function FoodLogPanel({ target, log, onChange }: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [meal, setMeal] = useState<MealKey>("breakfast");
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const [templates, setTemplates] = useState<FoodTemplate[]>(() => loadFoodTemplates());
  

  useEffect(() => {
    saveFoodTemplates(templates);
  }, [templates]);

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

  const remaining = {
    calories: Math.max(0, target.calories - dayTotals.calories),
    proteinG: Math.max(0, target.proteinG - dayTotals.protein),
    carbsG: Math.max(0, target.carbsG - dayTotals.carbs),
    fatG: Math.max(0, target.fatG - dayTotals.fat),
  };

  function addFood() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const item: FoodItem = {
      id: uid(),
      name: trimmed,
      grams: grams.trim() ? clampNum(grams) : undefined,
      protein: clampNum(protein),
      carbs: clampNum(carbs),
      fat: clampNum(fat),
    };

    const next = { ...log, [meal]: [...(log[meal] ?? []), item] };
    onChange(next);

    setName("");
    setGrams("");
    setProtein("");
    setCarbs("");
    setFat("");
  }

  function saveAsTemplate() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const t: FoodTemplate = {
      name: trimmed,
      grams: grams.trim() ? clampNum(grams) : undefined,
      protein: clampNum(protein),
      carbs: clampNum(carbs),
      fat: clampNum(fat),
    };

    setTemplates((prev) => [t, ...prev.filter((x) => x.name.toLowerCase() !== t.name.toLowerCase())]);
  }

  function quickAddTemplate(t: FoodTemplate) {
    const item: FoodItem = {
      id: uid(),
      name: t.name,
      grams: t.grams,
      protein: t.protein,
      carbs: t.carbs,
      fat: t.fat,
    };

    const next = { ...log, [meal]: [...(log[meal] ?? []), item] };
    onChange(next);
  }

  function removeFood(mealKey: MealKey, id: string) {
    const next = { ...log, [mealKey]: (log[mealKey] ?? []).filter((x) => x.id !== id) };
    onChange(next);
  }

  return (
    <div>
      <div className="foodHeader">
        <div>
          <h2 style={{ margin: 0 }}>Food log</h2>
          <div className="note">Add foods manually (macros), see daily totals and per-meal progress.</div>
        </div>

        <button className="btnPrimary" type="button" onClick={() => setIsAddOpen((v) => !v)}>
          {isAddOpen ? "Close" : "➕ Add food"}
        </button>
      </div>

      {/* Daily summary */}
      <div className="foodSummary">
        <div className="miniCard">
          <div className="miniTitle">Target</div>
          <div className="miniValue">{target.calories} kcal</div>
          <div className="muted">🥩 {target.proteinG}g · 🍚 {target.carbsG}g · 🧈 {target.fatG}g</div>
        </div>

        <div className="miniCard">
          <div className="miniTitle">Consumed</div>
          <div className="miniValue">{dayTotals.calories} kcal</div>
          <div className="muted">🥩 {dayTotals.protein}g · 🍚 {dayTotals.carbs}g · 🧈 {dayTotals.fat}g</div>
        </div>

        <div className="miniCard">
          <div className="miniTitle">Remaining</div>
          <div className="miniValue">{remaining.calories} kcal</div>
          <div className="muted">🥩 {remaining.proteinG}g · 🍚 {remaining.carbsG}g · 🧈 {remaining.fatG}g</div>
        </div>
      </div>

      {/* Add food (collapsible) */}
      {isAddOpen && (
        <div className="panel" style={{ marginTop: 12 }}>
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
              Food name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. oats" />
            </label>

            <label>
              Grams (optional)
              <input value={grams} onChange={(e) => setGrams(e.target.value)} placeholder="e.g. 80" inputMode="numeric" />
            </label>

            <div />

            <label>
              Protein (g)
              <input value={protein} onChange={(e) => setProtein(e.target.value)} inputMode="numeric" />
            </label>

            <label>
              Carbs (g)
              <input value={carbs} onChange={(e) => setCarbs(e.target.value)} inputMode="numeric" />
            </label>

            <label>
              Fat (g)
              <input value={fat} onChange={(e) => setFat(e.target.value)} inputMode="numeric" />
            </label>
          </div>

          <div className="actionsRow" style={{ marginTop: 10 }}>
            <button className="btnPrimary" type="button" onClick={addFood}>
              Add
            </button>
            <button className="btnGhost" type="button" onClick={saveAsTemplate}>
              Save as template
            </button>
          </div>

          {templates.length > 0 && (
            <>
              <div className="divider" />
              <div>
                <strong>Templates (quick add)</strong>
                <div className="pills">
                  {templates.slice(0, 18).map((t, idx) => (
                    <button
                      key={`${t.name}-${idx}`}
                      type="button"
                      className="chip"
                      onClick={() => quickAddTemplate(t)}
                      title={`🥩 ${t.protein}g · 🍚 ${t.carbs}g · 🧈 ${t.fat}g`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="note" style={{ marginTop: 6 }}>
                  Tip: choose a meal first, then tap a template.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Meals */}
      {Object.keys(mealLabels).map((k) => {
        const key = k as MealKey;
        const items = log[key] ?? [];
        const t = totals(items);
        const goalForMeal = perMealTargets[key];

        const pct =
          goalForMeal.calories <= 0 ? 0 : Math.round((t.calories / goalForMeal.calories) * 100);
        const barPct = Math.min(100, Math.max(0, pct));
        const barClass =
          pct <= 80 ? "progressBar progressOk" : pct <= 110 ? "progressBar progressWarn" : "progressBar progressBad";

        return (
          <div key={key} className="mealCard">
            <div className="mealTop">
              <div className="mealName">{mealLabels[key]}</div>
              <div className="mealMeta">
                Target {goalForMeal.calories} kcal · Consumed {t.calories} kcal
              </div>
            </div>

            {/* Progress bar (kcal) */}
            <div className="progressWrap">
              <div className={barClass} style={{ width: `${barPct}%` }} />
            </div>
            <div className="note" style={{ marginTop: 6 }}>
              {t.calories}/{goalForMeal.calories} kcal ({pct}%)
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

                    <button className="iconBtn" type="button" onClick={() => removeFood(key, x.id)} aria-label="Remove">
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
