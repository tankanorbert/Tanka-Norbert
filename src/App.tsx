import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { calculateBMR, calculateTDEE, activityLevels } from "./utils/calorie";
import { calculateMacros } from "./utils/macros";

import {MacroPie} from "./components/MacroPie";
import FoodLogPanel from "./components/FoodLogPanel";

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

function App() {
  const [weight, setWeight] = useState(93);
  const [height, setHeight] = useState(176);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activity, setActivity] = useState(activityLevels.moderate);

  const [result, setResult] = useState<number | null>(null);

  const [goal, setGoal] = useState<"cut" | "maint" | "bulk">(loadGoal());

  const todayId = formatDateId(new Date());
  const [dateId, setDateId] = useState<string>(() => loadLastDateId() ?? todayId);

  const [foodLog, setFoodLog] = useState<FoodLog>(() => {
    const initialDate = loadLastDateId() ?? todayId;
    return loadFoodLogByDate(initialDate);
  });

  const [savedDays, setSavedDays] = useState<string[]>(() => listSavedFoodLogDays());

  useEffect(() => {
    const stored = loadData();
    if (!stored) return;

    setWeight(stored.weight);
    setHeight(stored.height);
    setAge(stored.age);
    setGender(stored.gender);
    setActivity(stored.activity);
  }, []);

  useEffect(() => {
    setFoodLog(loadFoodLogByDate(dateId));
    saveLastDateId(dateId);
  }, [dateId]);

  useEffect(() => {
    saveFoodLogByDate(dateId, foodLog);
    setSavedDays(listSavedFoodLogDays());
  }, [dateId, foodLog]);

  const maintenanceCalories = result ? Math.round(result) : null;
  const cutCalories = result ? Math.max(1200, Math.round(result - 500)) : null;
  const bulkCalories = result ? Math.round(result + 300) : null;

  const maintenanceMacros = useMemo(
    () => (maintenanceCalories ? calculateMacros(maintenanceCalories, weight) : null),
    [maintenanceCalories, weight]
  );

  const cutMacros = useMemo(
    () =>
      cutCalories
        ? // Ha a calculateMacros nálad nem fogad 3. paramétert, töröld a ", 50"-et:
          calculateMacros(cutCalories, weight, 50)
        : null,
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
  }, [
    goal,
    cutCalories,
    cutMacros,
    bulkCalories,
    bulkMacros,
    maintenanceCalories,
    maintenanceMacros,
  ]);

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

  return (
    <div className="container">
      <h1>Calorie Calculator</h1>

      {/* Day switcher */}
      <div className="panel">
        <h2>Day</h2>

        <div className="stackGap">
          <div className="actionsRow">
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

            <label style={{ marginBottom: 0, minWidth: 180 }}>
              Select date
              <input type="date" value={dateId} onChange={(e) => setDateId(e.target.value)} />
            </label>
          </div>

          <div className="muted">
            Current day: <strong>{dateId}</strong>
          </div>

          <div className="actionsRow">
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

          {savedDays.length > 0 && (
            <div>
              <strong>Saved days</strong>

              <div className="pills">
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

              <div className="muted" style={{ marginTop: 6 }}>
                Showing last {Math.min(14, savedDays.length)} saved days.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inputs */}
      <div className="panel">
        <h2>Inputs</h2>

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
        </div>

        <button className="btnPrimary" onClick={calculate}>
          Calculate
        </button>
      </div>

      {result && (
        <>
          <div className="panel">
            <h2>Calories</h2>

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
          </div>

          <div className="panel">
            <h2>Macro chart</h2>
            {selected ? (
              <MacroPie title={selected.title} calories={selected.calories} macros={selected.macros} />
            ) : (
              <p className="muted">Pick a goal to see the chart.</p>
            )}

            <hr />

            
          </div>

          {foodTarget && (
            <div className="panel">
              <FoodLogPanel target={foodTarget} log={foodLog} onChange={(next) => setFoodLog(next)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
