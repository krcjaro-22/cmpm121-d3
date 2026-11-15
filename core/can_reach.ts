import { type Recipe, RECIPES } from "./recipes.ts";
import { TERRAIN_DATA } from "./terrain.ts";

// Repeat discovery until no new item or recipe can be reached.

// Ignore quantities: this tests possible recipes, not map-specific amounts.
export function unreachableRecipes(
  recipes: readonly Recipe[] = RECIPES,
): string[] {
  const reached = new Set<string>();
  const made = new Set<string>();
  for (const row of Object.values(TERRAIN_DATA)) {
    if (!row.requires) reached.add(row.resource);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const recipe of recipes) {
      if (made.has(recipe.id)) continue;
      if (!Object.keys(recipe.inputs).every((item) => reached.has(item))) {
        continue;
      }
      made.add(recipe.id);
      reached.add(recipe.output);
      for (const row of Object.values(TERRAIN_DATA)) {
        if (row.requires === recipe.output) reached.add(row.resource);
      }
      changed = true;
    }
  }
  return recipes.filter((recipe) => !made.has(recipe.id)).map((r) => r.id);
}
