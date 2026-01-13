type Macro = {
  grams: number;
  calories: number;
  percent: number;
};

type Macros = {
  protein: Macro;
  carbs: Macro;
  fat: Macro;
};

export type MealSplit = {
  name: string;
  share: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export function splitIntoMeals(
  calories: number,
  macros: Macros
): MealSplit[] {
  const splits = [
    { name: "Breakfast", share: 0.25 },
    { name: "Lunch", share: 0.35 },
    { name: "Dinner", share: 0.30 },
    { name: "Snack", share: 0.10 },
  ];

  return splits.map((s) => ({
    name: s.name,
    share: s.share,
    calories: Math.round(calories * s.share),
    proteinG: Math.round(macros.protein.grams * s.share),
    carbsG: Math.round(macros.carbs.grams * s.share),
    fatG: Math.round(macros.fat.grams * s.share),
  }));
}
