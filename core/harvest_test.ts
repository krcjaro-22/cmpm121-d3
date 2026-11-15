import { assertEquals } from "@std/assert";
import { apply, cellAt, newGame, terrainAt } from "./mod.ts";

Deno.test("Gathering gives one resource from the current terrain", () => {
  const state = newGame(121);
  const item = cellAt(state).resource;
  const events = apply(state, { type: "gather" });
  assertEquals(state.inventory[item], 1);
  assertEquals(state.collected["0,0"], true);
  assertEquals(events, [{
    type: "gathered",
    at: { x: 0, y: 0 },
    item,
    inventory: { [item]: 1 },
  }]);
});

Deno.test("The same cell cannot be harvested twice", () => {
  const state = newGame(121);
  apply(state, { type: "gather" });
  const snapshot = JSON.parse(JSON.stringify(state));
  const events = apply(state, { type: "gather" });
  assertEquals(events, [{
    type: "gather_failed",
    at: { x: 0, y: 0 },
    reason: "already collected",
  }]);
  assertEquals(state, snapshot);
});

Deno.test("Harvested cells are tracked separately", () => {
  const state = newGame(121);
  const first = apply(state, { type: "gather" });
  // Find another passable adjacent cell and pick a resource there.
  const directions = [
    ["north", 0, -1],
    ["south", 0, 1],
    ["west", -1, 0],
    ["east", 1, 0],
  ] as const;
  const next = directions.find(([, x, y]) => {
    const kind = terrainAt(121, x, y);
    return kind === "shore" || kind === "grove";
  });
  if (!next) throw new Error("No neighboring free cell");
  apply(state, { type: "move", direction: next[0] });
  apply(state, { type: "gather" });
  assertEquals(Object.keys(state.collected).length, 2);
  // The event's inventory is not the live, mutated inventory object.
  assertEquals(Object.values(first[0]).length, 4);
  assertEquals(first[0].type, "gathered");
  if (first[0].type === "gathered") {
    assertEquals(first[0].inventory[first[0].item], 1);
  }
});

Deno.test("Game state and resource events survive JSON", () => {
  const state = newGame(121);
  const events = apply(state, { type: "gather" });
  const result = { state, events };
  assertEquals(JSON.parse(JSON.stringify(result)), result);
});
