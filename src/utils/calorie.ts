export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: "male" | "female"
) {
  return gender === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calculateTDEE(bmr: number, activity: number) {
  return Math.round(bmr * activity);
}
export const activityLevels = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};
export function saveData(data: any) {
  localStorage.setItem("calorieData", JSON.stringify(data));
}

export function loadData() {
  const data = localStorage.getItem("calorieData");
  return data ? JSON.parse(data) : null;
}

