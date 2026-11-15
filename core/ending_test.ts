import { assertEquals } from "@std/assert";
import { apply, FINAL_RECIPE, newGame, RECIPES } from "./mod.ts";

Deno.test("making the rescue beacon wins and freezes every command", () => {
  const state = newGame(121);
  const final = RECIPES.find((recipe) => recipe.id === FINAL_RECIPE)!;
  state.inventory = { ...final.inputs };
  const events = apply(state, { type: "craft", recipe: FINAL_RECIPE });
  assertEquals(events.map((event) => event.type), ["crafted", "won"]);
  assertEquals(state.won, true);
  const snapshot = JSON.parse(JSON.stringify(state));
  for (const command of [
    { type: "move", direction: "north" },
    { type: "move", direction: "south" },
    { type: "move", direction: "east" },
    { type: "move", direction: "west" },
    { type: "gather" },
    { type: "craft", recipe: "rope" },
  ] as const) {
    assertEquals(apply(state, command), []);
    assertEquals(state, snapshot);
  }
});
