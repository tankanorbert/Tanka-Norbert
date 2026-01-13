import { useEffect, useState } from "react";
import { calculateBMR, calculateTDEE, activityLevels } from "./utils/calorie";
import { saveData, loadData } from "./utils/storage";
import { calculateMacros } from "./utils/macros";
import {MacroPie} from "./components/MacroPie";
import { splitIntoMeals } from "./utils/meals";
import "./App.css"

function App() {
  const [weight, setWeight] = useState(93);
  const [height, setHeight] = useState(176);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activity, setActivity] = useState(activityLevels.moderate);
  const [result, setResult] = useState<number | null>(null);
  const maintenanceCalories = result ? Math.round(result) : null;
const cutCalories = result ? Math.max(1200, Math.round(result - 500)) : null;
const bulkCalories = result ? Math.round(result + 300) : null;
const maintenanceMacros = maintenanceCalories ? calculateMacros(maintenanceCalories, weight) : null;
const cutMacros = cutCalories ? calculateMacros(cutCalories, weight) : null;
const bulkMacros =bulkCalories ? calculateMacros(bulkCalories, weight) : null;
const [goal, setGoal] = useState<"cut" | "maint" | "bulk">("maint");

const selected = (() => {
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
})();
const mealPlan = selected ? splitIntoMeals(selected.calories, selected.macros) : null;




  useEffect(() => {
    const stored = loadData();
    if (!stored) return;

    setWeight(stored.weight);
    setHeight(stored.height);
    setAge(stored.age);
    setGender(stored.gender);
    setActivity(stored.activity);
  }, []);

  function calculate() {
    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activity);
    setResult(tdee);

    saveData({ weight, height, age, gender, activity });
  }

  return (
    <div className={"cointainer"}>
      <h1>Calorie Calculator</h1>

      <label>
        Weight (kg)
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
        />
      </label>

      <br />

      <label>
        Height (cm)
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
        />
      </label>

      <br />

      <label>
        Age
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
        />
      </label>

      <br />

      <label>
        Gender
        <select value={gender} onChange={(e) => setGender(e.target.value as any)}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label>

      <br />

      <label>
        Activity
        <select
          value={activity}
          onChange={(e) => setActivity(Number(e.target.value))}
        >
          <option value={activityLevels.sedentary}>Sedentary</option>
          <option value={activityLevels.light}>Light</option>
          <option value={activityLevels.moderate}>Moderate</option>
          <option value={activityLevels.active}>Active</option>
          <option value={activityLevels.veryActive}>Very active</option>
        </select>
      </label>

      <br /><br />

      <button onClick={calculate}>Calculate</button>

      {result && (
  <div className="results">
    <h2>Calories</h2>
    <p>Maintenance: <strong>{maintenanceCalories}</strong> kcal</p>
    <p>Fat loss: <strong>{cutCalories}</strong> kcal</p>
    <p>Muscle gain: <strong>{bulkCalories}</strong> kcal</p>

    <hr />

    <h2>Macros by goal</h2>

    {cutMacros && (
      <div style={{ marginBottom: 16 }}>
        <h3>Fat loss</h3>
        <p>🥩 Protein: <strong>{cutMacros.protein.grams} g</strong> ({cutMacros.protein.calories} kcal · {cutMacros.protein.percent}%)</p>
        <p>🍚 Carbs: <strong>{cutMacros.carbs.grams} g</strong> ({cutMacros.carbs.calories} kcal · {cutMacros.carbs.percent}%)</p>
        <p>🧈 Fat: <strong>{cutMacros.fat.grams} g</strong> ({cutMacros.fat.calories} kcal · {cutMacros.fat.percent}%)</p>
      </div>
    )}

    {maintenanceMacros && (
      <div style={{ marginBottom: 16 }}>
        <h3>Maintenance</h3>
        <p>🥩 Protein: <strong>{maintenanceMacros.protein.grams} g</strong> ({maintenanceMacros.protein.calories} kcal · {maintenanceMacros.protein.percent}%)</p>
        <p>🍚 Carbs: <strong>{maintenanceMacros.carbs.grams} g</strong> ({maintenanceMacros.carbs.calories} kcal · {maintenanceMacros.carbs.percent}%)</p>
        <p>🧈 Fat: <strong>{maintenanceMacros.fat.grams} g</strong> ({maintenanceMacros.fat.calories} kcal · {maintenanceMacros.fat.percent}%)</p>
      </div>
    )}

    {bulkMacros && (
      <div>
        <h3>Muscle gain</h3>
        <p>🥩 Protein: <strong>{bulkMacros.protein.grams} g</strong> ({bulkMacros.protein.calories} kcal · {bulkMacros.protein.percent}%)</p>
        <p>🍚 Carbs: <strong>{bulkMacros.carbs.grams} g</strong> ({bulkMacros.carbs.calories} kcal · {bulkMacros.carbs.percent}%)</p>
        <p>🧈 Fat: <strong>{bulkMacros.fat.grams} g</strong> ({bulkMacros.fat.calories} kcal · {bulkMacros.fat.percent}%)</p>
      </div>
    )}
    <hr />
<hr />

<h2>Macro chart</h2>

<label style={{ marginBottom: 12 }}>
  Goal
  <select value={goal} onChange={(e) => setGoal(e.target.value as any)}>
    <option value="cut">Fat loss</option>
    <option value="maint">Maintenance</option>
    <option value="bulk">Muscle gain</option>
  </select>
</label>

{selected && (
  <MacroPie title={selected.title} calories={selected.calories} macros={selected.macros} />
)}

  </div>
)}
<hr />
<h2>Meal split</h2>

{mealPlan && (
  <div>
    {mealPlan.map((m) => (
      <div key={m.name} style={{ marginBottom: 12 }}>
        <strong>{m.name}</strong> — {m.calories} kcal
        <div>🥩 {m.proteinG} g · 🍚 {m.carbsG} g · 🧈 {m.fatG} g</div>
      </div>
    ))}
  </div>
)}

    </div>
  );
}

export default App;
