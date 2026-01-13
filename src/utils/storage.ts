export type StoredData = {
  weight: number;
  height: number;
  age: number;
  gender: "male" | "female";
  activity: number;
};

export function saveData(data: StoredData) {
  localStorage.setItem("calorieData", JSON.stringify(data));
}

export function loadData(): StoredData | null {
  try {
    const data = localStorage.getItem("calorieData");
    if (!data) return null;
    return JSON.parse(data) as StoredData;
  } catch {
    localStorage.removeItem("calorieData");
    return null;
  }
}
