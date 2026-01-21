export type MealKey =
  | "breakfast"
  | "snack1"
  | "lunch"
  | "snack2"
  | "dinner"
  | "supper";

export const mealLabels: Record<MealKey, string> = {
  breakfast: "Breakfast",
  snack1: "Snack 1",
  lunch: "Lunch",
  snack2: "Snack 2",
  dinner: "Dinner",
  supper: "Supper",
};

export const mealShares6: Array<{ key: MealKey; share: number }> = [
  { key: "breakfast", share: 0.2 },
  { key: "snack1", share: 0.1 },
  { key: "lunch", share: 0.3 },
  { key: "snack2", share: 0.1 },
  { key: "dinner", share: 0.2 },
  { key: "supper", share: 0.1 },
];

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

export type MealMode = 3 | 4;

export function splitIntoMeals(
  calories: number,
  macros: Macros,
  mode: MealMode
): MealSplit[] {
  const splits =
    mode === 3
      ? [
          { name: "Breakfast", share: 0.3 },
          { name: "Lunch", share: 0.4 },
          { name: "Dinner", share: 0.3 },
        ]
      : [
          { name: "Breakfast", share: 0.25 },
          { name: "Lunch", share: 0.35 },
          { name: "Dinner", share: 0.3 },
          { name: "Snack", share: 0.1 },
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
