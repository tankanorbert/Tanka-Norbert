// src/utils/food.ts

export type FoodItem = {
  id: string;
  name: string;
  grams: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function totals(items: FoodItem[]) {
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  for (const x of items) {
    protein += x.protein ?? 0;
    carbs += x.carbs ?? 0;
    fat += x.fat ?? 0;
  }

  const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);

  return {
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    calories,
  };
}