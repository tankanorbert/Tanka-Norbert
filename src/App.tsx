import { useEffect, useState } from "react";
import { calculateBMR, calculateTDEE, activityLevels } from "./utils/calorie";
import { saveData, loadData } from "./utils/storage";
import "./App.css"

function App() {
  const [weight, setWeight] = useState(93);
  const [height, setHeight] = useState(176);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activity, setActivity] = useState(activityLevels.moderate);
  const [result, setResult] = useState<number | null>(null);

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
    <h2>Results</h2>
    <p>Maintenance: <strong>{Math.round(result)}</strong> kcal</p>
    <p>Fat loss: <strong>{Math.round(result - 500)}</strong> kcal</p>
    <p>Muscle gain: <strong>{Math.round(result + 300)}</strong> kcal</p>
  </div>
)}

    </div>
  );
}

export default App;
