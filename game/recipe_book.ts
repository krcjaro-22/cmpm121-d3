import {
  FINAL_RECIPE,
  type GameState,
  missingFor,
  RECIPES,
} from "../core/mod.ts";

function label(item: string): string {
  return item.replaceAll("_", " ");
}

// A button per recipe, built from the recipe table, so a new row in
// core/recipes.ts appears here with no change to this file. Buttons stay
// clickable when materials are short, so the player hears why crafting failed.
export class RecipeBook {
  private readonly buttons = new Map<string, HTMLButtonElement>();

  constructor(parent: HTMLElement, onCraft: (recipe: string) => void) {
    const list = document.createElement("ol");
    list.className = "recipes";
    RECIPES.forEach((recipe, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recipe";
      if (recipe.id === FINAL_RECIPE) button.classList.add("final");
      button.addEventListener("click", (event) => {
        onCraft(recipe.id);
        // After a mouse click, give keys back to the game. Keyboard users keep focus.
        if (event.detail > 0) button.blur();
      });
      
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = `${index + 1}. ${label(recipe.output)}`;
      const inputs = document.createElement("span");
      inputs.className = "inputs";
      button.append(name, inputs);

      const entry = document.createElement("li");
      entry.append(button);
      list.append(entry);
      this.buttons.set(recipe.id, button);
    });
    parent.replaceChildren(list);
  }

   // Call only when nothing is playing, so the book never shows the future.
   update(state: GameState) {
    for (const recipe of RECIPES) {
      const button = this.buttons.get(recipe.id)!;
      const missing = missingFor(state, recipe.id) ?? {};
      const ready = Object.keys(missing).length === 0;
      const owned = state.inventory[recipe.output] ?? 0;

      const parts = Object.entries(recipe.inputs).map(([item, amount]) =>
        `${label(item)} ${Math.min(state.inventory[item] ?? 0, amount)}/${amount}`
      );
      button.querySelector(".inputs")!.textContent = parts.join(" · ") +
        (owned > 0 ? ` (have ${owned})` : "");

      button.classList.toggle("ready", ready && !state.won);
      button.disabled = state.won;
      button.setAttribute(
        "aria-label",
        `Craft ${label(recipe.output)}, needs ${parts.join(", ")}${
          ready ? ", ready" : ""
        }`,
      );
    }
  }
}

