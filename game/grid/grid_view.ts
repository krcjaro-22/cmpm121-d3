// The only folder allowed to import Phaser, and for one job: drawing the grid.
// Input, the HUD, sound, and the order of events all live outside it.
import Phaser from "phaser";
import type { Cell, GameEvent, GameState, Terrain } from "../../core/mod.ts";
import { terrainAt } from "../../core/mod.ts";

export const CELL_SIZE = 32;
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;
const WALK_MS = 120;
const BUMP_MS = 60;
const MARKER_COLOR = 0xf5e6a8;
const BUMP_COLOR = 0xe0533d;
const GATHER_COLOR = 0x9be37a;
const CRAFT_COLOR = 0xffc94a;
const HARVESTED_COLOR = 0x14161a;
const PULSE_MS = 140;

const TERRAIN_COLORS: Record<Terrain, number> = {
  shore: 0x5d9e4a,
  grove: 0x2f6b3a,
  channel: 0x2d5f9e,
  cliff: 0x6e6a66,
};

// Enough cells to cover the view, plus a margin so that the camera can lag behind
// the player without showing an unpainted edge.
const CELLS_ACROSS = 16;
const CELLS_DOWN = 13;

function cellCenter({ x, y }: Cell): Cell {
  return {
    x: x * CELL_SIZE + CELL_SIZE / 2,
    y: y * CELL_SIZE + CELL_SIZE / 2,
  };
}

// One output of the presenter. It shows events; it decides nothing.
// Humble Object: http://xunitpatterns.com/Humble%20Object.html
export class GridView extends Phaser.Scene {
  private readonly seed: number;
  private readonly start: Cell;
  private ground!: Phaser.GameObjects.Graphics;
  private marker!: Phaser.GameObjects.Arc;
  // Cells this view has shown being gathered. Built from events, not read from
  // the core, so a harvested mark never appears before its gather plays.
  private readonly harvested = new Set<string>();
  private center: Cell;

  constructor(state: GameState) {
    super("grid");
    this.seed = state.seed;
    this.start = { ...state.player };
    this.center = { ...state.player };
  }

  create() {
    this.ground = this.add.graphics();
    const { x, y } = cellCenter(this.start);
    this.marker = this.add.circle(x, y, CELL_SIZE * 0.35, MARKER_COLOR);
    this.cameras.main.startFollow(this.marker, true, 0.2, 0.2);
    this.drawCellsAround(this.start);
    this.fitToDisplay();
  }

  // Phaser has no device-pixel setting of its own. So the canvas backing store is
  // CSS size times devicePixelRatio, the CSS size stays put, and a camera zoom lets
  // all drawing stay in logical pixels. The media query fires when the ratio changes:
  // a move to another monitor, or browser zoom. The view's CSS size is fixed, so plain
  // window resizes need nothing here.
  private fitToDisplay() {
    const ratio = globalThis.devicePixelRatio || 1;
    this.scale.resize(
      Math.round(VIEW_WIDTH * ratio),
      Math.round(VIEW_HEIGHT * ratio),
    );
    this.scale.canvas.style.width = `${VIEW_WIDTH}px`;
    this.scale.canvas.style.height = `${VIEW_HEIGHT}px`;
    this.cameras.main.setZoom(ratio);
    matchMedia(`(resolution: ${ratio}dppx)`).addEventListener(
      "change",
      () => this.fitToDisplay(),
      { once: true },
    );
  }

  show(event: GameEvent): Promise<void> {
    switch (event.type) {
      case "moved":
        this.drawCellsAround(event.to);
        return this.walk(event.to);
      case "blocked":
        return this.bump(event.at, event.toward);
      case "gathered":
        this.harvested.add(`${event.at.x},${event.at.y}`);
        this.drawCellsAround(this.center);
        return this.pulse(GATHER_COLOR, 1.35, event.at);
      case "gather_failed":
      case "craft_failed":
        return this.shake();
      case "crafted":
        return this.pulse(CRAFT_COLOR, 1.6);
      case "won":
        return this.celebrate();
      default:
        // A new event type fails to type-check here until it has a presentation.
        event satisfies never;
        return Promise.resolve();
    }
  }

  private walk(to: Cell): Promise<void> {
    return new Promise((done) => {
      this.tweens.add({
        targets: this.marker,
        ...cellCenter(to),
        duration: WALK_MS,
        onComplete: () => done(),
      });
    });
  }

  // Lurch part of the way toward the blocked cell, flash, and come back.
  private bump(at: Cell, toward: Cell): Promise<void> {
    const start = cellCenter(at);
    const target = cellCenter(toward);
    this.marker.setFillStyle(BUMP_COLOR);
    return new Promise((done) => {
      this.tweens.add({
        targets: this.marker,
        x: start.x + (target.x - start.x) * 0.3,
        y: start.y + (target.y - start.y) * 0.3,
        duration: BUMP_MS,
        yoyo: true,
        onComplete: () => {
          this.marker.setFillStyle(MARKER_COLOR);
          done();
        },
      });
    });
  }

  // Swell and flash, then settle back. A gather also drops a spark from the cell.
  private pulse(color: number, scale: number, from?: Cell): Promise<void> {
    this.marker.setFillStyle(color);
    if (from) {
      const { x, y } = cellCenter(from);
      const spark = this.add.circle(x, y, CELL_SIZE * 0.18, color);
      this.tweens.add({
        targets: spark,
        y: y - CELL_SIZE,
        alpha: 0,
        duration: PULSE_MS * 3,
        onComplete: () => spark.destroy(),
      });
    }
    return new Promise((done) => {
      this.tweens.add({
        targets: this.marker,
        scale,
        duration: PULSE_MS,
        yoyo: true,
        onComplete: () => {
          this.marker.setFillStyle(MARKER_COLOR);
          done();
        },
      });
    });
  }

  
  private celebrate(): Promise<void> {
    this.marker.setFillStyle(CRAFT_COLOR);
    const rings = [0, 1, 2].map((index) =>
      new Promise<void>((done) => {
        const ring = this.add.circle(
          this.marker.x,
          this.marker.y,
          CELL_SIZE / 2,
        )
          .setStrokeStyle(3, CRAFT_COLOR)
          .setFillStyle();
        this.tweens.add({
          targets: ring,
          scale: 8,
          alpha: 0,
          delay: index * 300,
          duration: 1200,
          onComplete: () => {
            ring.destroy();
            done();
          },
        });
      })
    );
    return Promise.all(rings).then(() => {});
  }

  // Paint only what is near the camera. Asking the core again costs little, and
  // the world itself is never stored.
  private drawCellsAround(center: Cell) {
    this.center = { ...center };
    const { x: centerX, y: centerY } = center;
    this.ground.clear();
    for (let y = centerY - CELLS_DOWN; y <= centerY + CELLS_DOWN; y++) {
      for (let x = centerX - CELLS_ACROSS; x <= centerX + CELLS_ACROSS; x++) {
        this.ground.fillStyle(TERRAIN_COLORS[terrainAt(this.seed, x, y)]);
        this.ground.fillRect(
          x * CELL_SIZE,
          y * CELL_SIZE,
          CELL_SIZE - 1,
          CELL_SIZE - 1,
        );
        if (this.harvested.has(`${x},${y}`)) {
          // A small dark notch: this cell has been picked clean.
          this.ground.fillStyle(HARVESTED_COLOR, 0.55);
          this.ground.fillCircle(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE * 0.16,
          );
        }
      }
    }
  }
}

// Resolves once Phaser has booted and the scene exists. Phaser's input and audio
// are off: this project only asks it to draw.
export function startGridView(
  parent: HTMLElement,
  state: GameState,
): Promise<GridView> {
  return new Promise((ready) => {
    const view = new GridView(state);
    new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      backgroundColor: "#14161a",
      banner: false,
      audio: { noAudio: true },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      scene: view,
      callbacks: {
        postBoot: () => ready(view),
      },
    });
  });
}