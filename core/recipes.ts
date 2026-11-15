export type Recipe = {
  id: string;
  output: string;
  inputs: Record<string, number>;
};

export const FINAL_RECIPE = "rescue_beacon";

export const RECIPES: Recipe[] = [
  { id: "rope", output: "rope", inputs: { fiber: 1 } },
  { id: "raft", output: "raft", inputs: { scrap: 1, rope: 1 } },
  {
    id: "climbing_kit",
    output: "climbing_kit",
    inputs: { scrap: 1, copper: 1 },
  },
  {
    id: "copper_wire",
    output: "copper_wire",
    inputs: { copper: 1, fiber: 1 },
  },
  {
    id: "power_cell",
    output: "power_cell",
    inputs: { crystal: 1, copper: 1 },
  },
  {
    id: FINAL_RECIPE,
    output: FINAL_RECIPE,
    inputs: { copper_wire: 1, power_cell: 1, scrap: 1 },
  },
];
