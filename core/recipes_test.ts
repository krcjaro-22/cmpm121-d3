import { assert, assertEquals } from "@std/assert";
import { apply, missingFor, newGame, RECIPES, TERRAIN_DATA } from "./mod.ts";

Deno.test("Every ingredient has a source in terrain or another recipe", () => {
  const sources = new Set([
    ...Object.values(TERRAIN_DATA).map((row) => row.resource),
    ...RECIPES.map((recipe) => recipe.output),
  ]);
  for (const recipe of RECIPES) {
    for (const item of Object.keys(recipe.inputs)) {
      assert(sources.has(item), `${recipe.id} needs unavailable ${item}`);
    }
  }
});

Deno.test("All crafting rows work without extra rule cases", () => {
  for (const recipe of RECIPES) {
    const state = newGame(121);
    state.inventory = { ...recipe.inputs };
    assertEquals(missingFor(state, recipe.id), {});
    const events = apply(state, { type: "craft", recipe: recipe.id });
    assertEquals(events[0].type, "crafted");
    assertEquals(state.inventory[recipe.output], 1);
    for (const item of Object.keys(recipe.inputs)) {
      assertEquals(state.inventory[item], 0);
    }
  }
});

Deno.test("Crafting fails without materials and changes nothing", () => {
  const state = newGame(121);
  const before = JSON.parse(JSON.stringify(state));
  const recipe = RECIPES[0];
  const events = apply(state, { type: "craft", recipe: recipe.id });
  assertEquals(state, before);
  assertEquals(events, [{
    type: "craft_failed",
    recipe: recipe.id,
    reason: "missing materials",
    missing: { ...recipe.inputs },
  }]);
});

Deno.test("Unknown recipes cannot change the state", () => {
  const state = newGame(121);
  const before = JSON.parse(JSON.stringify(state));
  const events = apply(state, { type: "craft", recipe: "nonsense" });
  assertEquals(state, before);
  assertEquals(events, [{
    type: "craft_failed",
    recipe: "nonsense",
    reason: "unknown recipe",
    missing: {},
  }]);
});

Deno.test("A retained crafted event does not change after more crafts", () => {
  const state = newGame(121);
  state.inventory.fiber = 2;
  const first = apply(state, { type: "craft", recipe: "rope" });
  const snapshot = JSON.parse(JSON.stringify(first));
  apply(state, { type: "craft", recipe: "rope" });
  assertEquals(first, snapshot);
});
