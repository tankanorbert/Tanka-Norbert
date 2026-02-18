// src/App.tsx
import { useEffect, useMemo, useRef, useState } from "react"; import "./App.css";

import { calculateBMR, calculateTDEE, activityLevels } from "./utils/calorie"; import { calculateMacros } from "./utils/macros"; import FoodLogPanel from "./components/FoodLogPanel";

import {
  saveData,
  loadData,
  saveGoal,
  loadGoal,
  loadFoodLogByDate,
  saveFoodLogByDate,
  formatDateId,
  loadLastDateId,
  saveLastDateId,
  listSavedFoodLogDays,
  clearFoodLogByDate,
} from "./utils/storage";
import type { FoodLog } from "./utils/storage";

import { dict } from "./utils/i18n";
import type { Lang } from "./utils/i18n";

/**
 * Smooth collapsible helper:
 * measures inner content height
 */
function useCollapseHeight(open: boolean, deps: unknown[] = []) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [h, setH] = useState(0);

  useEffect(() => {
    if (!open) {
      setH(0);
      return;
    }
    const el = innerRef.current;
    if (!el) return;

    const measure = () => setH(el.scrollHeight);
    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ...deps]);

  return { innerRef, maxHeightPx: `${h}px` }; }

function App() {
  // 🌍 Language
  const [lang, setLang] = useState<Lang>(() => {
    const v = localStorage.getItem("lang");
    return v === "hu" || v === "en" ? v : "hu";
  });

  const t = dict[lang];

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // -------- INPUTS --------
  const [weight, setWeight] = useState(93);
  const [height, setHeight] = useState(176);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activity, setActivity] = useState(activityLevels.moderate);

  // Collapsibles
  const [showInputs, setShowInputs] = useState(true);
  const [showCalories, setShowCalories] = useState(false);
  const [showFoodLog, setShowFoodLog] = useState(false);

  // Results
  const [result, setResult] = useState<number | null>(null);
  const [goal, setGoal] = useState<"cut" | "maint" | "bulk">(loadGoal());

  // Scroll helpers
  const caloriesPanelRef = useRef<HTMLDivElement | null>(null);
  const hasCalculatedOnce = useRef(false);

  // -------- DAY / LOG BY DATE --------
  const todayId = formatDateId(new Date());
  const [dateId, setDateId] = useState<string>(() => loadLastDateId() ?? todayId);

  const [foodLog, setFoodLog] = useState<FoodLog>(() => {
    const initialDate = loadLastDateId() ?? todayId;
    return loadFoodLogByDate(initialDate);
  });

  const [savedDays, setSavedDays] = useState<string[]>(() => listSavedFoodLogDays());

  // Load saved inputs once
  useEffect(() => {
    const stored = loadData();
    if (!stored) return;

    setWeight(stored.weight);
    setHeight(stored.height);
    setAge(stored.age);
    setGender(stored.gender);
    setActivity(stored.activity);
  }, []);

  // When date changes, load its food log, persist last date
  useEffect(() => {
    setFoodLog(loadFoodLogByDate(dateId));
    saveLastDateId(dateId);
  }, [dateId]);

  // Save food log by date whenever it changes
  useEffect(() => {
    saveFoodLogByDate(dateId, foodLog);
    setSavedDays(listSavedFoodLogDays());
  }, [dateId, foodLog]);

  // -------- CALC HELPERS --------
  const maintenanceCalories = result ? Math.round(result) : null;
  const cutCalories = result ? Math.max(1200, Math.round(result - 500)) : null;
  const bulkCalories = result ? Math.round(result + 300) : null;

  const maintenanceMacros = useMemo(
    () => (maintenanceCalories ? calculateMacros(maintenanceCalories, weight) : null),
    [maintenanceCalories, weight]
  );

  const cutMacros = useMemo(
    () => (cutCalories ? calculateMacros(cutCalories, weight, 50) : null),
    [cutCalories, weight]
  );

  const bulkMacros = useMemo(
    () => (bulkCalories ? calculateMacros(bulkCalories, weight) : null),
    [bulkCalories, weight]
  );

  const selected = useMemo(() => {
    if (goal === "cut" && cutCalories && cutMacros) {
      return { title: t.fat_loss, calories: cutCalories, macros: cutMacros };
    }
    if (goal === "bulk" && bulkCalories && bulkMacros) {
      return { title: t.muscle_gain, calories: bulkCalories, macros: bulkMacros };
    }
    if (maintenanceCalories && maintenanceMacros) {
      return { title: t.maintenance, calories: maintenanceCalories, macros: maintenanceMacros };
    }
    return null;
  }, [goal, cutCalories, cutMacros, bulkCalories, bulkMacros, maintenanceCalories, maintenanceMacros, t]);

  const foodTarget = useMemo(() => {
    return selected
      ? {
          calories: selected.calories,
          proteinG: selected.macros.protein.grams,
          carbsG: selected.macros.carbs.grams,
          fatG: selected.macros.fat.grams,
        }
      : null;
  }, [selected]);

  function calculate() {
    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activity);
    setResult(tdee);

    saveData({ weight, height, age, gender, activity });
  }

  // Calculate után: nyissa a Calories-t + első alkalommal scroll
  useEffect(() => {
    if (!result) return;

    setShowCalories(true);
    // opcionális: Food log is nyíljon ki
    // setShowFoodLog(true);

    if (!hasCalculatedOnce.current) {
      hasCalculatedOnce.current = true;

      setTimeout(() => {
        caloriesPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 120);
    }
  }, [result]);

  // Smooth heights
  const inputsCollapse = useCollapseHeight(showInputs, [weight, height, age, gender, activity, lang]);
  const caloriesCollapse = useCollapseHeight(showCalories, [result, goal, maintenanceCalories, cutCalories, bulkCalories, lang]);
  const foodCollapse = useCollapseHeight(showFoodLog, [!!foodTarget, dateId, foodLog, lang]);

  return (
    <div className="container">
      {/* Language switch */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label="Language">
          <option value="hu">Magyar</option>
          <option value="en">English</option>
        </select>
      </div>

      <h1>{t.app_title}</h1>

      {/* ---------------- DAY ---------------- */}
      <div className="panel">
        <h2>{t.day_title}</h2>

        <div className="dayPanel">
          <div className="dayTopRow">
            <div className="dayQuick">
              <button className="chip" type="button" onClick={() => setDateId(formatDateId(new Date()))}>
                {t.today}
              </button>

              <button
                className="chip"
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setDateId(formatDateId(d));
                }}
              >
                {t.yesterday}
              </button>
            </div>

            <label className="dayDate" style={{ marginBottom: 0 }}>
              {t.select_date}
              <input type="date" value={dateId} onChange={(e) => setDateId(e.target.value)} />
            </label>
          </div>

          <div className="daySecondRow">
            <div className="muted">
              {t.current_day}: <strong>{dateId}</strong>
            </div>

            <div className="dayActions">
              <button
                className="btnDanger"
                type="button"
                onClick={() => {
                  clearFoodLogByDate(dateId);
                  setFoodLog(loadFoodLogByDate(dateId));
                  setSavedDays(listSavedFoodLogDays());
                }}
              >
                {t.clear_day}
              </button>

              <button
                className="btnGhost"
                type="button"
                onClick={() => {
                  clearFoodLogByDate(dateId);
                  setDateId(formatDateId(new Date()));
                }}
              >
                {t.clear_go_today}
              </button>
            </div>
          </div>

          {savedDays.length > 0 && (
            <div className="savedBox">
              <strong>{t.saved_days}</strong>

              <div className="pills" style={{ marginTop: 8 }}>
                {savedDays.slice(0, 14).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={d === dateId ? "chip chipActive" : "chip"}
                    onClick={() => setDateId(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="muted" style={{ marginTop: 8 }}>
                {t.showing_last(Math.min(14, savedDays.length))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- INPUTS ---------------- */}
      <div className="panel">
        <button
          className="panelHeader"
          type="button"
          aria-expanded={showInputs}
          onClick={() => setShowInputs((v) => !v)}
        >
          <h2>{t.inputs_title}</h2>
          <span className="chevron">{showInputs ? "▲" : "▼"}</span>
        </button>

        <div className={`collapse ${showInputs ? "open" : ""}`} style={{ maxHeight: inputsCollapse.maxHeightPx }}>
          <div ref={inputsCollapse.innerRef} className="collapseInner">
            <div className="grid2">
              <label>
                {t.weight}
                <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
              </label>

              <label>
                {t.height}
                <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
              </label>

              <label>
                {t.age}
                <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
              </label>

              <label>
                {t.gender}
                <select value={gender} onChange={(e) => setGender(e.target.value as any)}>
                  <option value="male">{t.male}</option>
                  <option value="female">{t.female}</option>
                </select>
              </label>

              <label>
                {t.activity}
                <select value={activity} onChange={(e) => setActivity(Number(e.target.value))}>
                  <option value={activityLevels.sedentary}>{t.sedentary ?? "Sedentary"}</option>
                  <option value={activityLevels.light}>{t.light ?? "Light"}</option>
                  <option value={activityLevels.moderate}>{t.moderate ?? "Moderate"}</option>
                  <option value={activityLevels.active}>{t.active ?? "Active"}</option>
                  <option value={activityLevels.veryActive}>{t.very_active ?? "Very active"}</option>
                </select>
              </label>

              <div style={{ display: "flex", alignItems: "end" }}>
                <button className="btnPrimary" type="button" onClick={calculate} style={{ width: "100%" }}>
                  {t.calculate}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- CALORIES ---------------- */}
      <div className="panel" ref={caloriesPanelRef}>
        <button
          className="panelHeader"
          type="button"
          aria-expanded={showCalories}
          onClick={() => setShowCalories((v) => !v)}
        >
          <h2>{t.calories_title}</h2>
          <span className="chevron">{showCalories ? "▲" : "▼"}</span>
        </button>

        <div className={`collapse ${showCalories ? "open" : ""}`} style={{ maxHeight: caloriesCollapse.maxHeightPx }}>
          <div ref={caloriesCollapse.innerRef} className="collapseInner">
            {result ? (
              <>
                <div className="kpi">
                  <div className="kpiCard">
                    <div className="kpiTitle">{t.maintenance}</div>
                    <div className="kpiValue">{maintenanceCalories} kcal</div>
                  </div>

                  <div className="kpiCard">
                    <div className="kpiTitle">{t.fat_loss}</div>
                    <div className="kpiValue">{cutCalories} kcal</div>
                  </div>

                  <div className="kpiCard">
                    <div className="kpiTitle">{t.muscle_gain}</div>
                    <div className="kpiValue">{bulkCalories} kcal</div>
                  </div>
                </div>

                <hr />

                <label>
                  {t.goal}
                  <select
                    value={goal}
                    onChange={(e) => {
                      const g = e.target.value as "cut" | "maint" | "bulk";
                      setGoal(g);
                      saveGoal(g);
                    }}
                  >
                    <option value="cut">{t.fat_loss}</option>
                    <option value="maint">{t.maintenance}</option>
                    <option value="bulk">{t.muscle_gain}</option>
                  </select>
                </label>
              </>
            ) : (
              <p className="muted">{t.press_calculate_to_see}</p>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- FOOD LOG ---------------- */}
      <div className="panel">
        <button
          className="panelHeader"
          type="button"
          aria-expanded={showFoodLog}
          onClick={() => setShowFoodLog((v) => !v)}
        >
          <h2>{t.foodlog_panel_title}</h2>
          <span className="chevron">{showFoodLog ? "▲" : "▼"}</span>
        </button>

        <div className={`collapse ${showFoodLog ? "open" : ""}`} style={{ maxHeight: foodCollapse.maxHeightPx }}>
          <div ref={foodCollapse.innerRef} className="collapseInner">
            {foodTarget ? (
              <FoodLogPanel target={foodTarget} log={foodLog} onChange={(next) => setFoodLog(next as any)} lang={lang} t={t} />
            ) : (
              <p className="muted">{t.press_calculate_to_see}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

