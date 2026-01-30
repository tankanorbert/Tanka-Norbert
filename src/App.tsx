import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import { calculateBMR, calculateTDEE, activityLevels } from "./utils/calorie";
import { calculateMacros } from "./utils/macros";
import FoodLogPanel from "./components/FoodLogPanel";
//import BarcodeScanner from "./components/BarcodeScanner";

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

/**
 * Smooth collapsible helper:
 * - measures inner content height and returns maxHeight in px
 * - recalculates when open/deps change
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

    // content can change after first render (fonts, images, async)
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ...deps]);

  return { innerRef, maxHeightPx: `${h}px` };
}


function App() {
  // ----------- INPUTS -----------
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

  // ----------- DAY / LOG BY DATE -----------
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

  // ----------- CALC HELPERS -----------
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
      return { title: "Fat loss", calories: cutCalories, macros: cutMacros };
    }
    if (goal === "bulk" && bulkCalories && bulkMacros) {
      return { title: "Muscle gain", calories: bulkCalories, macros: bulkMacros };
    }
    if (maintenanceCalories && maintenanceMacros) {
      return { title: "Maintenance", calories: maintenanceCalories, macros: maintenanceMacros };
    }
    return null;
  }, [goal, cutCalories, cutMacros, bulkCalories, bulkMacros, maintenanceCalories, maintenanceMacros]);

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

    // ha akarod: calculate után automatikusan nyíljon a Food log is
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
  

  // ----------- Smooth heights (measured) -----------
  const inputsCollapse = useCollapseHeight(showInputs, [weight, height, age, gender, activity]);
  const caloriesCollapse = useCollapseHeight(showCalories, [result, goal, maintenanceCalories, cutCalories, bulkCalories]);
  const foodCollapse = useCollapseHeight(showFoodLog, [!!foodTarget, dateId, foodLog]);

  return (
    <div className="container">
      <h1>Calorie Calculator</h1>

      {/* ---------------- DAY ---------------- */}
      <div className="panel">
        <h2>Day</h2>

        <div className="dayPanel">
          <div className="dayTopRow">
            <div className="dayQuick">
              <button className="chip" type="button" onClick={() => setDateId(formatDateId(new Date()))}>
                Today
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
                Yesterday
              </button>
            </div>

            <label className="dayDate" style={{ marginBottom: 0 }}>
              Select date
              <input type="date" value={dateId} onChange={(e) => setDateId(e.target.value)} />
            </label>
          </div>

          <div className="daySecondRow">
            <div className="muted">
              Current day: <strong>{dateId}</strong>
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
                Clear this day
              </button>

              <button
                className="btnGhost"
                type="button"
                onClick={() => {
                  clearFoodLogByDate(dateId);
                  const today = formatDateId(new Date());
                  setDateId(today);
                }}
              >
                Clear + go Today
              </button>
            </div>
          </div>

          {savedDays.length > 0 && (
            <div className="savedBox">
              <strong>Saved days</strong>

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
                Showing last {Math.min(14, savedDays.length)} saved days.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- INPUTS (collapsible) ---------------- */}
      <div className="panel">
        <button
          className="panelHeader"
          type="button"
          aria-expanded={showInputs}
          onClick={() => setShowInputs((v) => !v)}
        >
          <h2>Inputs</h2>
          <span className="chevron">{showInputs ? "▲" : "▼"}</span>
        </button>

        <div className={`collapse ${showInputs ? "open" : ""}`} style={{ maxHeight: inputsCollapse.maxHeightPx }}>
          <div ref={inputsCollapse.innerRef} className="collapseInner">
            <div className="grid2">
              <label>
                Weight (kg)
                <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
              </label>

              <label>
                Height (cm)
                <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
              </label>

              <label>
                Age
                <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
              </label>

              <label>
                Gender
                <select value={gender} onChange={(e) => setGender(e.target.value as any)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>

              <label>
                Activity
                <select value={activity} onChange={(e) => setActivity(Number(e.target.value))}>
                  <option value={activityLevels.sedentary}>Sedentary</option>
                  <option value={activityLevels.light}>Light</option>
                  <option value={activityLevels.moderate}>Moderate</option>
                  <option value={activityLevels.active}>Active</option>
                  <option value={activityLevels.veryActive}>Very active</option>
                </select>
              </label>

              <div style={{ display: "flex", alignItems: "end" }}>
                <button className="btnPrimary" type="button" onClick={calculate} style={{ width: "100%" }}>
                  Calculate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- CALORIES (header always visible) ---------------- */}
      <div className="panel" ref={caloriesPanelRef}>
        <button
          className="panelHeader"
          type="button"
          aria-expanded={showCalories}
          onClick={() => setShowCalories((v) => !v)}
        >
          <h2>Calories</h2>
          <span className="chevron">{showCalories ? "▲" : "▼"}</span>
        </button>

        <div className={`collapse ${showCalories ? "open" : ""}`} style={{ maxHeight: caloriesCollapse.maxHeightPx }}>
          <div ref={caloriesCollapse.innerRef} className="collapseInner">
            {result ? (
              <>
                <div className="kpi">
                  <div className="kpiCard">
                    <div className="kpiTitle">Maintenance</div>
                    <div className="kpiValue">{maintenanceCalories} kcal</div>
                  </div>

                  <div className="kpiCard">
                    <div className="kpiTitle">Fat loss</div>
                    <div className="kpiValue">{cutCalories} kcal</div>
                  </div>

                  <div className="kpiCard">
                    <div className="kpiTitle">Muscle gain</div>
                    <div className="kpiValue">{bulkCalories} kcal</div>
                  </div>
                </div>

                <hr />

                <label>
                  Goal
                  <select
                    value={goal}
                    onChange={(e) => {
                      const g = e.target.value as "cut" | "maint" | "bulk";
                      setGoal(g);
                      saveGoal(g);
                    }}
                  >
                    <option value="cut">Fat loss</option>
                    <option value="maint">Maintenance</option>
                    <option value="bulk">Muscle gain</option>
                  </select>
                </label>
              </>
            ) : (
              <p className="muted">
                Press <strong>Calculate</strong> to see calories.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- FOOD LOG (header always visible) ---------------- */}
      <div className="panel">
        <button
          className="panelHeader"
          type="button"
          aria-expanded={showFoodLog}
          onClick={() => setShowFoodLog((v) => !v)}
        >
          <h2>Food log</h2>
          <span className="chevron">{showFoodLog ? "▲" : "▼"}</span>
        </button>

        <div className={`collapse ${showFoodLog ? "open" : ""}`} style={{ maxHeight: foodCollapse.maxHeightPx }}>
          <div ref={foodCollapse.innerRef} className="collapseInner">
            {foodTarget ? (
              <FoodLogPanel target={foodTarget} log={foodLog} onChange={(next) => setFoodLog(next)} />
            ) : (
              <p className="muted">Calculate + choose a goal to enable the food log.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
