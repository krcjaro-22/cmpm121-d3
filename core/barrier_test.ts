import { assertEquals } from "@std/assert";
import { apply, newGame, TERRAIN_DATA, terrainAt } from "./mod.ts";
import type { Terrain } from "./terrain.ts";

// Find land directly west of a target barrier, so a move tests the actual rule.
function atBarrier(kind: Terrain) {
  const state = newGame(121);
  for (let y = -60; y <= 60; y++) {
    for (let x = -60; x <= 60; x++) {
      if (
        terrainAt(121, x, y) === "shore" ||
        terrainAt(121, x, y) === "grove"
      ) {
        if (terrainAt(121, x + 1, y) === kind) {
          state.player = { x, y };
          return state;
        }
      }
    }
  }
  throw new Error(`Cannot find land near ${kind}`);
}

for (
  const [terrain, recipe, materials] of [
    ["channel", "raft", { scrap: 1, rope: 1 }],
    ["cliff", "climbing_kit", { scrap: 1, copper: 1 }],
  ] as const
) {
  Deno.test(`${terrain} is closed until ${recipe} is crafted`, () => {
    const state = atBarrier(terrain);
    const blocked = apply(state, { type: "move", direction: "east" });
    assertEquals(blocked[0].type, "blocked");
    state.inventory = { ...materials };
    const made = apply(state, { type: "craft", recipe });
    assertEquals(made[0].type, "crafted");
    const moved = apply(state, { type: "move", direction: "east" });
    assertEquals(moved[0].type, "moved");
    assertEquals(terrainAt(121, state.player.x, state.player.y), terrain);
    const gathered = apply(state, { type: "gather" });
    assertEquals(gathered[0].type, "gathered");
    assertEquals(state.inventory[TERRAIN_DATA[terrain].resource], 1);
  });
}
