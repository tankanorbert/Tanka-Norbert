import type { MealKey } from "./meals";
import type { FoodItem } from "./food";

// -------------------- USER INPUTS (weight/height/age/gender/activity) --------------------
const DATA_KEY = "calorieData_v1";

export type StoredData = {
  weight: number;
  height: number;
  age: number;
  gender: "male" | "female";
  activity: number;
};

export function saveData(data: StoredData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadData(): StoredData | null {
  const raw = localStorage.getItem(DATA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredData;
  } catch {
    return null;
  }
}

// -------------------- GOAL (cut/maint/bulk) --------------------
const GOAL_KEY = "calorieGoal";
export type Goal = "cut" | "maint" | "bulk";

export function saveGoal(goal: Goal) {
  localStorage.setItem(GOAL_KEY, goal);
}

export function loadGoal(): Goal {
  const raw = localStorage.getItem(GOAL_KEY);
  if (raw === "cut" || raw === "maint" || raw === "bulk") return raw;
  return "maint";
}

// -------------------- FOOD LOG (dated) --------------------
export type FoodLog = Record<MealKey, FoodItem[]>;

export function createEmptyFoodLog(): FoodLog {
  return {
    breakfast: [],
    snack1: [],
    lunch: [],
    snack2: [],
    dinner: [],
    supper: [],
  };
}

// YYYY-MM-DD (Budapest time)
export function formatDateId(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function foodLogKey(dateId: string) {
  return `foodLog_${dateId}`;
}

export function loadFoodLogByDate(dateId: string): FoodLog {
  const raw = localStorage.getItem(foodLogKey(dateId));
  if (!raw) return createEmptyFoodLog();

  try {
    return JSON.parse(raw) as FoodLog;
  } catch {
    return createEmptyFoodLog();
  }
}

export function saveFoodLogByDate(dateId: string, log: FoodLog) {
  localStorage.setItem(foodLogKey(dateId), JSON.stringify(log));
}

export function clearFoodLogByDate(dateId: string) {
  localStorage.removeItem(`foodLog_${dateId}`);
}

const LAST_DATE_KEY = "foodLog_lastDate";

export function loadLastDateId(): string | null {
  return localStorage.getItem(LAST_DATE_KEY);
}

export function saveLastDateId(dateId: string) {
  localStorage.setItem(LAST_DATE_KEY, dateId);
}

export function listSavedFoodLogDays(): string[] {
  const prefix = "foodLog_";
  const days: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (!key.startsWith(prefix)) continue;

    const dayId = key.slice(prefix.length);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dayId)) days.push(dayId);
  }

  days.sort((a, b) => (a < b ? 1 : -1));
  return days;
}

// -------------------- FOOD TEMPLATES --------------------
const FOOD_TEMPLATES_KEY = "foodTemplates_v1";

export type FoodTemplate = Omit<FoodItem, "id">;

export function loadFoodTemplates(): FoodTemplate[] {
  const raw = localStorage.getItem(FOOD_TEMPLATES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FoodTemplate[];
  } catch {
    return [];
  }
}

export function saveFoodTemplates(templates: FoodTemplate[]) {
  localStorage.setItem(FOOD_TEMPLATES_KEY, JSON.stringify(templates));
}
