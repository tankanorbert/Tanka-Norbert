// src/utils/i18n.ts
export type Lang = "hu" | "en";

export type TDic = {
  app_title: string;

  day_title: string;
  today: string;
  yesterday: string;
  select_date: string;
  current_day: string;
  clear_day: string;
  clear_go_today: string;
  saved_days: string;
  showing_last: (n: number) => string;

  inputs_title: string;
  weight: string;
  height: string;
  age: string;
  gender: string;
  male: string;
  female: string;
  activity: string;
  sedentary: string;
  light: string;
  moderate: string;
  active: string;
  very_active: string;
  calculate: string;

  calories_title: string;
  maintenance: string;
  fat_loss: string;
  muscle_gain: string;
  goal: string;
  press_calculate_to_see: string;

  foodlog_panel_title: string;
  foodlog_title: string;

  fl_note: string;

  fl_scan_barcode: string;
  fl_add_food_toggle_open: string;
  fl_add_food_toggle_close: string;

  fl_target: string;
  fl_consumed: string;
  fl_remaining: string;

  fl_items_today: string;
  fl_no_foods_yet: string;

  fl_target_kcal: string;
  fl_consumed_kcal: string;

  fl_over: (kcal: number) => string;
  fl_remaining_kcal: (kcal: number) => string;

  fl_add_food_title: string;
  fl_meal: string;
  fl_search_food: string;
  fl_search_placeholder: string;
  fl_select_food: string;
  fl_choose: string;
  fl_grams: string;
  fl_grams_placeholder: string;
  fl_add: string;

  fl_preview: string;

  fl_add_new_food_title: string;
  fl_barcode_captured: string;

  fl_food_name: string;
  fl_food_name_placeholder: string;
  fl_protein_100: string;
  fl_carbs_100: string;
  fl_fat_100: string;
  fl_save_to_db: string;
  fl_tip: string;

  fl_meal_target_line: string;
  fl_meal_consumed_line: string;
  fl_remove: string;

  // ✅ NEW: macro labels + meal labels
  fl_protein: string;
  fl_carbs: string;
  fl_fat: string;

  meal_breakfast: string;
  meal_snack1: string;
  meal_lunch: string;
  meal_snack2: string;
  meal_dinner: string;
  meal_supper: string;

  scan_title: string;
  scan_close: string;
  scan_hint: string;
};

export const dict: Record<Lang, TDic> = {
  hu: {
    app_title: "Kalória kalkulátor",

    day_title: "Nap",
    today: "Ma",
    yesterday: "Tegnap",
    select_date: "Dátum kiválasztása",
    current_day: "Aktuális nap",
    clear_day: "Nap törlése",
    clear_go_today: "Törlés + Ugrás mára",
    saved_days: "Mentett napok",
    showing_last: (n) => `Az utolsó ${n} mentett nap látható.`,

    inputs_title: "Adatok",
    weight: "Testsúly (kg)",
    height: "Magasság (cm)",
    age: "Életkor",
    gender: "Nem",
    male: "Férfi",
    female: "Nő",
    activity: "Aktivitás",
    sedentary: "Ülő életmód",
    light: "Könnyű",
    moderate: "Közepes",
    active: "Aktív",
    very_active: "Nagyon aktív",
    calculate: "Számolás",

    calories_title: "Kalóriák",
    maintenance: "Szintentartás",
    fat_loss: "Fogyás",
    muscle_gain: "Tömegnövelés",
    goal: "Cél",
    press_calculate_to_see: "Nyomd meg a Számolás gombot a kalóriákhoz.",

    foodlog_panel_title: "Étkezési napló",
    foodlog_title: "étkezési napló",

    fl_note: "Válassz ételt és add meg a grammot. A makrók automatikusan számolódnak.",

    fl_scan_barcode: "📷 Vonalkód beolvasás",
    fl_add_food_toggle_open: "➕ Étel hozzáadása",
    fl_add_food_toggle_close: "Bezárás",

    fl_target: "Cél",
    fl_consumed: "Elfogyasztva",
    fl_remaining: "Hátralévő",

    fl_items_today: "Mai tételek",
    fl_no_foods_yet: "Még nincs felvitt étel.",

    fl_target_kcal: "Cél",
    fl_consumed_kcal: "Elfogyasztva",

    fl_over: (kcal) => `Túllépés +${kcal} kcal`,
    fl_remaining_kcal: (kcal) => `Hátralévő ${kcal} kcal`,

    fl_add_food_title: "Étel hozzáadása",
    fl_meal: "Étkezés",
    fl_search_food: "Keresés",
    fl_search_placeholder: "pl. csirke, rizs...",
    fl_select_food: "Étel kiválasztása",
    fl_choose: "— válassz —",
    fl_grams: "Gramm",
    fl_grams_placeholder: "pl. 150",
    fl_add: "Hozzáadás",

    fl_preview: "Előnézet",

    fl_add_new_food_title: "Új étel felvétele az adatbázisba (100g-ra)",
    fl_barcode_captured: "(vonalkód rögzítve ✅)",

    fl_food_name: "Étel neve",
    fl_food_name_placeholder: "pl. fehérjeszelet márkanév",
    fl_protein_100: "Fehérje / 100g",
    fl_carbs_100: "Szénhidrát / 100g",
    fl_fat_100: "Zsír / 100g",
    fl_save_to_db: "Mentés az adatbázisba",
    fl_tip: "Tipp: a címkéről vedd a 100g-os értékeket. Ezután fent csak a grammot add meg.",

    fl_meal_target_line: "Cél",
    fl_meal_consumed_line: "Elfogyasztva",
    fl_remove: "Törlés",

    // ✅ NEW
    fl_protein: "Fehérje",
    fl_carbs: "Szénhidrát",
    fl_fat: "Zsír",

    meal_breakfast: "Reggeli",
    meal_snack1: "Tízórai",
    meal_lunch: "Ebéd",
    meal_snack2: "Uzsonna",
    meal_dinner: "Vacsora",
    meal_supper: "Esti",

    scan_title: "Vonalkód beolvasás",
    scan_close: "Bezárás",
    scan_hint: "Tartsd stabilan a kamerát a vonalkódon.",
  },

  en: {
    app_title: "Calorie Calculator",

    day_title: "Day",
    today: "Today",
    yesterday: "Yesterday",
    select_date: "Select date",
    current_day: "Current day",
    clear_day: "Clear this day",
    clear_go_today: "Clear + go Today",
    saved_days: "Saved days",
    showing_last: (n) => `Showing last ${n} saved days.`,

    inputs_title: "Inputs",
    weight: "Weight (kg)",
    height: "Height (cm)",
    age: "Age",
    gender: "Gender",
    male: "Male",
    female: "Female",
    activity: "Activity",
    sedentary: "Sedentary",
    light: "Light",
    moderate: "Moderate",
    active: "Active",
    very_active: "Very active",
    calculate: "Calculate",

    calories_title: "Calories",
    maintenance: "Maintenance",
    fat_loss: "Fat loss",
    muscle_gain: "Muscle gain",
    goal: "Goal",
    press_calculate_to_see: "Press Calculate to see calories.",

    foodlog_panel_title: "Food log",
    foodlog_title: "Food log",

    fl_note: "Select food + grams. Macros are calculated automatically.",

    fl_scan_barcode: "📷 Scan barcode",
    fl_add_food_toggle_open: "➕ Add food",
    fl_add_food_toggle_close: "Close",

    fl_target: "Target",
    fl_consumed: "Consumed",
    fl_remaining: "Remaining",

    fl_items_today: "Items today",
    fl_no_foods_yet: "No foods yet.",

    fl_target_kcal: "Target",
    fl_consumed_kcal: "Consumed",

    fl_over: (kcal) => `Over +${kcal} kcal`,
    fl_remaining_kcal: (kcal) => `Remaining ${kcal} kcal`,

    fl_add_food_title: "Add food",
    fl_meal: "Meal",
    fl_search_food: "Search food",
    fl_search_placeholder: "type e.g. chicken, rice...",
    fl_select_food: "Select food",
    fl_choose: "— choose —",
    fl_grams: "Grams",
    fl_grams_placeholder: "e.g. 150",
    fl_add: "Add",

    fl_preview: "Preview",

    fl_add_new_food_title: "Add new food to database (per 100g)",
    fl_barcode_captured: "(barcode captured ✅)",

    fl_food_name: "Food name",
    fl_food_name_placeholder: "e.g. My brand protein bar",
    fl_protein_100: "Protein / 100g",
    fl_carbs_100: "Carbs / 100g",
    fl_fat_100: "Fat / 100g",
    fl_save_to_db: "Save to database",
    fl_tip: "Tip: add per-100g values from the nutrition label. Then select grams above.",

    fl_meal_target_line: "Target",
    fl_meal_consumed_line: "Consumed",
    fl_remove: "Remove",

    // ✅ NEW
    fl_protein: "Protein",
    fl_carbs: "Carbs",
    fl_fat: "Fat",

    meal_breakfast: "Breakfast",
    meal_snack1: "Snack 1",
    meal_lunch: "Lunch",
    meal_snack2: "Snack 2",
    meal_dinner: "Dinner",
    meal_supper: "Supper",

    scan_title: "Scan barcode",
    scan_close: "Close",
    scan_hint: "Hold the camera steady on the barcode.",
  },
};
