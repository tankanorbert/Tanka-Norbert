// src/utils/foodDb.ts

export type Per100 = {
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodDbItem = {
  id: string;
  name: string;
  per100: Per100;
  barcode?: string;
};

export function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function calcCalories(p: number, c: number, f: number) {
  return Math.round(p * 4 + c * 4 + f * 9);
}

export function calcFromPer100(per100: Per100, grams: number) {
  const k = grams / 100;

  const protein = Math.round(per100.protein * k);
  const carbs = Math.round(per100.carbs * k);
  const fat = Math.round(per100.fat * k);

  const calories = calcCalories(protein, carbs, fat);
  return { protein, carbs, fat, calories };
}

// helper: default ételek felvétele (barcode nélkül)
function f(id: string, name: string, protein: number, carbs: number, fat: number): FoodDbItem {
  return { id, name, per100: { protein, carbs, fat } };
}

export const defaultFoodDb: FoodDbItem[] = [
  // --- Protein (lean) ---
  f("chicken_breast", "Chicken breast (raw)", 23, 0, 2),
  f("turkey_breast", "Turkey breast (raw)", 24, 0, 1),
  f("lean_beef_5", "Lean ground beef 5% (raw)", 21, 0, 5),
  f("tuna_water", "Tuna canned (in water, drained)", 24, 0, 1),
  f("salmon", "Salmon (raw)", 20, 0, 13),
  f("white_fish", "White fish (cod/hake)", 18, 0, 1),
  f("shrimp", "Shrimp", 20, 0, 1),
  f("egg_whites", "Egg whites", 11, 0, 0),
  f("whole_egg", "Whole egg", 13, 1, 10),
  f("cottage_lean", "Cottage cheese (low-fat)", 12, 3, 2),
  f("greek_yogurt_0", "Greek yogurt 0%", 10, 4, 0),
  f("whey_powder", "Whey protein powder", 80, 8, 6),

  // --- Carbs (staples) ---
  f("rice_white_dry", "Rice white (dry)", 7, 80, 1),
  f("rice_basmati_cooked", "Rice basmati (cooked)", 3, 28, 0),
  f("oats", "Oats", 13, 60, 7),
  f("pasta_dry", "Pasta (dry)", 13, 75, 2),
  f("potato", "Potato", 2, 17, 0),
  f("sweet_potato", "Sweet potato", 2, 20, 0),
  f("bread", "Bread (average)", 9, 49, 3),
  f("tortilla", "Tortilla wrap", 8, 50, 8),
  f("cornflakes", "Cornflakes", 7, 84, 1),
  f("banana", "Banana", 1, 23, 0),
  f("apple", "Apple", 0, 14, 0),
  f("berries", "Berries mix", 1, 12, 0),

  // --- Veg (low cal) ---
  f("broccoli", "Broccoli", 3, 7, 0),
  f("spinach", "Spinach", 3, 4, 0),
  f("tomato", "Tomato", 1, 4, 0),
  f("cucumber", "Cucumber", 1, 4, 0),
  f("carrot", "Carrot", 1, 10, 0),
  f("onion", "Onion", 1, 9, 0),

  // --- Fats / add-ons ---
  f("olive_oil", "Olive oil", 0, 0, 100),
  f("butter", "Butter", 1, 0, 82),
  f("peanut_butter", "Peanut butter", 25, 20, 50),
  f("almonds", "Almonds", 21, 22, 50),
  f("walnuts", "Walnuts", 15, 14, 65),
  f("avocado", "Avocado", 2, 9, 15),

  // --- Gym classics ---
  f("skyr", "Skyr", 11, 4, 0),
  f("milk_15", "Milk 1.5%", 3, 5, 2),
  f("cheese_light", "Cheese light", 30, 2, 10),
  f("beans", "Beans (cooked)", 9, 22, 1),
  f("lentils", "Lentils (cooked)", 9, 20, 0),
  f("chickpeas", "Chickpeas (cooked)", 9, 27, 3),
];
