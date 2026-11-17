# Flooded Signal

Flooded Signal is a survival and crafting game where you explore a procedurally generated world, gather resources, craft equipment, and build a rescue beacon to signal for help.

## Play the Game

[Play Flooded Signal](https://krcjaro-22.github.io/cmpm121-d3/)

## Repository

[GitHub Repository](https://github.com/krcjaro-22/cmpm121-d3)

## Controls

- **Arrow keys:** Move the player around the map.
- **Sound button:** Toggle game audio on and off.

## Running Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/krcjaro-22/cmpm121-d3.git
   ```

2. Navigate into the project folder:

   ```bash
   cd cmpm121-d3
   ```

3. Start the development server:

   ```bash
   deno task dev
   ```

4. Open the local URL provided in your terminal.

## Gameplay

1. Explore the procedurally generated world.
2. Gather resources from different terrain types.
3. Open your inventory to check collected materials.
4. Craft equipment using the resources you collect.
5. Use crafted equipment to access previously blocked terrain.
6. Gather the materials needed to craft the rescue beacon.
7. Craft the rescue beacon to win the game.

## Crafting Recipes

Recipes are defined in `core/recipes.ts` inside the `RECIPES` array.

Each recipe contains three properties:

- `id`: The unique identifier for the recipe.
- `output`: The item produced by crafting.
- `inputs`: An object containing the required materials and quantities.

Example recipe:

```ts
{
  id: "example_item",
  output: "example_item",
  inputs: { fiber: 2, scrap: 1 },
}
```

To add a recipe, add a new object to the `RECIPES` array in `core/recipes.ts`. Make sure all required ingredients can be obtained from terrain resources or other recipes.

## Testing

Run the full project checks with:

```bash
deno task ci
```

This runs formatting, linting, type checking, automated tests, architecture boundary checks, and the production build.
