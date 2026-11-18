import { apply, type Command, type Direction, RECIPES } from "../core/mod.ts";
import type { GameState } from "../core/mod.ts";
import type { Presenter } from "./presenter.ts";

const ARROWS: Record<string, Direction> = {
  ArrowUp: "north",
  ArrowDown: "south",
  ArrowLeft: "west",
  ArrowRight: "east",
};

// Input in, core in the middle, presenter out. None of those three knows the others,
// which makes this a Mediator: https://refactoring.guru/design-patterns/mediator
// There is no frame loop here: a command runs on a key press or when playback ends.
export class Controller {
  private readonly state: GameState;
  private readonly presenter: Presenter;
  // A tap made during a walk, kept until the presenter is free.
  private pressed: Command | null = null;
  private held: Direction[] = [];
  // Runs when nothing is playing and no next command has started, so it is safe
  // to read the core here. During playback, the core is ahead of what the player
  // has seen, and reading it would show the future.
  onSettled: () => void = () => {};
  // Every command that changed something, in order. Paste the output of
  // game.controller.exportRun() into core/run.json to record a playthrough.
  readonly history: Command[] = [];

  constructor(state: GameState, presenter: Presenter) {
    this.state = state;
    this.presenter = presenter;
    presenter.onIdle = () => {
      this.next();
      // next() may have just started another walk.
      if (!presenter.busy) this.onSettled();
    };
    addEventListener("keydown", (event) => this.keyDown(event));
    addEventListener("keyup", (event) => this.keyUp(event));
    addEventListener("blur", () => this.held = []);
  }

  private keyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    // G gathers resources from the current tile.
    if (event.key.toLowerCase() === "g") {
      event.preventDefault();
      if (event.repeat) return;

      this.pressed = { type: "gather" };
      this.next();
      return;
    }

    // Number keys craft the recipe shown with that number in the recipe book.
    const recipe = RECIPES[Number(event.key) - 1];
    if (/^[1-9]$/.test(event.key) && recipe) {
      event.preventDefault();
      if (event.repeat) return;
      this.craft(recipe.id);
      return;
    }
    const direction = ARROWS[event.key];
    if (!direction) return;

    // Otherwise arrow keys would also scroll the page.
    event.preventDefault();
    if (event.repeat) return;
    this.held.push(direction);
    this.pressed = { type: "move", direction };
    this.next();
  }

  // For the recipe book's buttons. Waits like a key tap if a walk is playing.
  craft(recipe: string) {
    this.pressed = { type: "craft", recipe };
    this.next();
  }

  exportRun(): string {
    return JSON.stringify(
      { seed: this.state.seed, commands: this.history },
      null,
      2,
    );
  }

  private keyUp(event: KeyboardEvent) {
    this.held = this.held.filter((direction) =>
      direction !== ARROWS[event.key]
    );
  }

  private next() {
    // While the presenter is busy, input waits and the core hears nothing. The
    // busy state lives here in game/: the core never learns about animation.
    if (this.presenter.busy) return;

    const held = this.held.at(-1);
    const command: Command | null = this.pressed ??
      (held ? { type: "move", direction: held } : null);
    this.pressed = null;
    if (!command) return;

    // Playing nothing would report idle at once, and a held key would land back
    // here until the stack overflowed. No events means there is nothing to wait for.
    const events = apply(this.state, command);
    if (events.length > 0) {
      this.history.push(command);
      this.presenter.play(events);
    }
  }
}