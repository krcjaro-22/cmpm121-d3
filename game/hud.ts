import { type GameEvent, type GameState, terrainAt } from "../core/mod.ts";

function element(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function describe(event: GameEvent): string {
  switch (event.type) {
    case "moved":
      return `moved to ${event.to.x}, ${event.to.y}`;
    case "blocked":
      return `blocked by ${event.terrain} at ${event.toward.x}, ${event.toward.y}`;
    case "gathered":
      return `collected ${event.item}`;
    case "gather_failed":
      return `gather failed: ${event.reason}`;
    case "crafted":
      return `crafted ${event.item}`;
    case "craft_failed":
      return `craft failed: ${event.reason}`;
    case "won":
      return event.message;
  }
}

// The readout, as ordinary page elements that CSS can style and that assistive
// tools can read. It changes only as events play.
export class Hud {
  private readonly seed: number;

  constructor(state: GameState) {
    this.seed = state.seed;
    this.showPosition(state.player.x, state.player.y);

    this.showInventory(state.inventory);
  }

  show(event: GameEvent) {
    element("live").textContent = describe(event);
    if (event.type === "moved") {
      this.showPosition(event.to.x, event.to.y);
    }

    // Update inventory after gathering or crafting
    if (event.type === "gathered" || event.type === "crafted") {
      this.showInventory(event.inventory);
    }

    // Display victory message
    if (event.type === "won") {
      const victory = element("victory");
      victory.textContent = event.message;
      victory.hidden = false;
    }
  }

  private showPosition(x: number, y: number) {
    element("position").textContent = `${x}, ${y}`;
    element("terrain").textContent = terrainAt(this.seed, x, y);
  }

  private showInventory(inventory: Record<string, number>) {
    const inventoryElement = element("inventory");
    inventoryElement.replaceChildren();

    const items = Object.entries(inventory)
      .filter(([, quantity]) => quantity > 0);

    if (items.length === 0) {
      inventoryElement.textContent = "No resources collected yet.";
      return;
    }

    const list = document.createElement("ul");

    for (const [item, quantity] of items) {
      const entry = document.createElement("li");
      entry.textContent = `${item}: ${quantity}`;
      list.append(entry);
    }

    inventoryElement.append(list);
  }
}
