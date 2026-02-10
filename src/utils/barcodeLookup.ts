export type BarcodeLookupResult = {
  name: string;
  per100: { protein: number; carbs: number; fat: number };
};

function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

// Open Food Facts: nutriments mezők tipikusan: proteins_100g, carbohydrates_100g, fat_100g
export async function lookupBarcodeOFF(code: string): Promise<BarcodeLookupResult | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data || data.status !== 1 || !data.product) return null;

  const p = data.product;

  const name =
    (p.product_name as string) ||
    (p.product_name_en as string) ||
    (p.generic_name as string) ||
    "";

  const nutr = p.nutriments ?? {};

  const protein = n(nutr.proteins_100g);
  const carbs = n(nutr.carbohydrates_100g);
  const fat = n(nutr.fat_100g);

  if (!name) return null;

  // ha minden 0, lehet hiányos → ilyenkor inkább null, hogy kézzel add meg
  if (protein <= 0 && carbs <= 0 && fat <= 0) return null;

  return {
    name,
    per100: { protein, carbs, fat },
  };
}
