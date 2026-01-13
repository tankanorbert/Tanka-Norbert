type MacroResult = {
  protein: { grams: number; calories: number; percent: number };
  carbs: { grams: number; calories: number; percent: number };
  fat: { grams: number; calories: number; percent: number };
};

export function calculateMacros(
  totalCalories: number,
  weight: number,
  minCarbsGrams: number = 0
) {
  const proteinGrams = weight * 2;
  const proteinCalories = proteinGrams * 4;

  let fatGrams = weight * 0.8;
  let fatCalories = fatGrams * 9;

  const minCarbsCalories = minCarbsGrams * 4;

  let remainingCalories =
    totalCalories - proteinCalories - fatCalories;

  // ha nincs elég hely carbsra, csökkentjük a zsírt
  if (remainingCalories < minCarbsCalories) {
    const deficit = minCarbsCalories - remainingCalories;
    fatCalories -= deficit;
    fatGrams = fatCalories / 9;
    remainingCalories = minCarbsCalories;
  }

  const carbsCalories = Math.max(0, remainingCalories);
  const carbsGrams = carbsCalories / 4;

  return {
    protein: {
      grams: Math.round(proteinGrams),
      calories: Math.round(proteinCalories),
      percent: Math.round((proteinCalories / totalCalories) * 100),
    },
    carbs: {
      grams: Math.round(carbsGrams),
      calories: Math.round(carbsCalories),
      percent: Math.round((carbsCalories / totalCalories) * 100),
    },
    fat: {
      grams: Math.round(fatGrams),
      calories: Math.round(fatCalories),
      percent: Math.round((fatCalories / totalCalories) * 100),
    },
  };
}
