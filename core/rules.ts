// Commands change plain-data state immediately and return immutable event records.
import { FINAL_RECIPE, RECIPES } from "./recipes.ts";
import {
  isPassable,
  type Terrain,
  TERRAIN_DATA,
  terrainAt,
} from "./terrain.ts";

export type Cell = { x: number; y: number };
export type Direction = "north" | "south" | "east" | "west";
export type Inventory = Record<string, number>;

export type GameState = {
  seed: number;
  player: Cell;
  inventory: Inventory;
  collected: Record<string, true>;
  won: boolean;
};

export type Command =
  | { type: "move"; direction: Direction }
  | { type: "gather" }
  | { type: "craft"; recipe: string };

export type GameEvent =
  | { type: "moved"; from: Cell; to: Cell }
  | { type: "blocked"; at: Cell; toward: Cell; terrain: Terrain }
  | {
    type: "gathered";
    at: Cell;
    item: string;
    inventory: Inventory;
  }
  | { type: "gather_failed"; at: Cell; reason: string }
  | {
    type: "crafted";
    recipe: string;
    item: string;
    inventory: Inventory;
  }
  | {
    type: "craft_failed";
    recipe: string;
    reason: string;
    missing: Inventory;
  }
  | { type: "won"; message: string };

const STEPS: Record<Direction, Cell> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

function key(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

export function newGame(seed: number): GameState {
  return {
    seed,
    player: { x: 0, y: 0 },
    inventory: {},
    collected: {},
    won: false,
  };
}

// One read-only query: combines seeded terrain and a player's changes.
export function cellAt(state: GameState, cell: Cell = state.player) {
  const terrain = terrainAt(state.seed, cell.x, cell.y);
  return {
    terrain,
    resource: TERRAIN_DATA[terrain].resource,
    collected: state.collected[key(cell)] === true,
    passable: isPassable(terrain, state.inventory),
  };
}

// Empty means the recipe can be made; undefined means unknown recipe.
export function missingFor(
  state: GameState,
  recipeId: string,
): Inventory | undefined {
  const recipe = RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) return undefined;
  const missing: Inventory = {};
  for (const [item, amount] of Object.entries(recipe.inputs)) {
    const short = amount - (state.inventory[item] ?? 0);
    if (short > 0) missing[item] = short;
  }
  return missing;
}

// The only way to change the game; after winning, every command is ignored.
export function apply(state: GameState, command: Command): GameEvent[] {
  if (state.won) return [];
  switch (command.type) {
    case "move":
      return move(state, command.direction);
    case "gather":
      return gather(state);
    case "craft":
      return craft(state, command.recipe);
  }
}

function move(state: GameState, direction: Direction): GameEvent[] {
  const step = STEPS[direction];
  const from = { ...state.player };
  const to = { x: from.x + step.x, y: from.y + step.y };
  const terrain = terrainAt(state.seed, to.x, to.y);
  if (!isPassable(terrain, state.inventory)) {
    return [{ type: "blocked", at: from, toward: to, terrain }];
  }
  state.player.x = to.x;
  state.player.y = to.y;
  return [{ type: "moved", from, to }];
}

function gather(state: GameState): GameEvent[] {
  const at = { ...state.player };
  const location = cellAt(state);
  if (location.collected) {
    return [{ type: "gather_failed", at, reason: "already collected" }];
  }
  state.collected[key(at)] = true;
  state.inventory[location.resource] =
    (state.inventory[location.resource] ?? 0) + 1;
  return [{
    type: "gathered",
    at,
    item: location.resource,
    inventory: { ...state.inventory },
  }];
}

function craft(state: GameState, recipeId: string): GameEvent[] {
  const recipe = RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) {
    return [{
      type: "craft_failed",
      recipe: recipeId,
      reason: "unknown recipe",
      missing: {},
    }];
  }
  const missing = missingFor(state, recipeId)!;
  if (Object.keys(missing).length > 0) {
    return [{
      type: "craft_failed",
      recipe: recipeId,
      reason: "missing materials",
      missing,
    }];
  }
  for (const [item, amount] of Object.entries(recipe.inputs)) {
    state.inventory[item] -= amount;
  }
  state.inventory[recipe.output] = (state.inventory[recipe.output] ?? 0) + 1;
  const made: GameEvent = {
    type: "crafted",
    recipe: recipeId,
    item: recipe.output,
    inventory: { ...state.inventory },
  };
  if (recipe.id === FINAL_RECIPE) {
    state.won = true;
    return [made, {
      type: "won",
      message: "Rescue beacon activated. Help is on the way!",
    }];
  }
  return [made];
}
