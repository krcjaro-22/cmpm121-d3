import { assertEquals } from "@std/assert";
import { apply, type Command, newGame } from "./mod.ts";
import run from "./run.json" with { type: "json" };

function replay() {
  const state = newGame(run.seed);
  const events = [];
  for (const command of run.commands as Command[]) {
    events.push(...apply(state, command));
  }
  return { state, events };
}

Deno.test("the recorded run wins using only commands", () => {
  const result = replay();
  assertEquals(result.state.won, true);
  assertEquals(result.events.at(-1)?.type, "won");
});

Deno.test("replaying a complete game reproduces all state and events", () => {
  const a = replay();
  const b = replay();
  assertEquals(a, b);
  assertEquals(JSON.parse(JSON.stringify(a)), a);
});
