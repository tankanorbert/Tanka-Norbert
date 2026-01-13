export function calculateMacros(
  calories: number,
  weight: number
) {
  const proteinGrams = weight * 2;
  const fatGrams = weight * 1;

  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;

  const remainingCalories =
    calories - proteinCalories - fatCalories;

  const carbsGrams = Math.max(0, remainingCalories / 4);

  return {
    protein: Math.round(proteinGrams),
    fat: Math.round(fatGrams),
    carbs: Math.round(carbsGrams),
  };
}
