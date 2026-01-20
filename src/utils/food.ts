export type FoodItem = {
  id: string;
  name: string;
  grams?: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function calcCaloriesFromMacros(p: number, c: number, f: number) {
  return Math.round(p * 4 + c * 4 + f * 9);
}

export function totals(items: FoodItem[]) {
  const protein = items.reduce((s, x) => s + x.protein, 0);
  const carbs = items.reduce((s, x) => s + x.carbs, 0);
  const fat = items.reduce((s, x) => s + x.fat, 0);

  return {
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    calories: calcCaloriesFromMacros(protein, carbs, fat),
  };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
