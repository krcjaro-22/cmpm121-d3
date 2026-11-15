import { assertEquals } from "@std/assert";
import { unreachableRecipes } from "./can_reach.ts";
import { RECIPES, type Recipe } from "./recipes.ts";

Deno.test("Each real recipe is eventually reachable", () => {
  assertEquals(unreachableRecipes(RECIPES), []);
});

Deno.test("A cyclic recipe is reported as unreachable", () => {
  const broken: Recipe[] = [
    ...RECIPES,
    { id: "impossible", output: "impossible", inputs: { impossible: 1 } },
  ];
  assertEquals(unreachableRecipes(broken), ["impossible"]);
});
