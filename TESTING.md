# Manual test script

For a person, or an agent driving a browser. Run `deno task dev` and open the local URL with `?seed=121`. Before each section, reload. To read logical state, use `game.state` in the console. To read what has played, use the panel beside the grid, including the `#live` text, or look at the marker.

**Promotion rule:** a bug found by hand or by an agent becomes a permanent test in `core/` before it is fixed, unless it truly lives in `game/`, in which case add a step here.

| #  | Action                                                    | Expected observation                                                                                                                                        |
| -- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Load the page                                             | One canvas. A pale marker at the center of a green map. No console errors.                                                                                  |
| 2  | Tap the right arrow                                       | The marker slides one cell east. `#live` says `moved to 1, 0`. `player` is `{ x: 1, y: 0 }`.                                                                |
| 3  | Walk until water or rock is ahead, then press toward it   | The marker lurches and flashes red, then returns to its cell. `#live` says `blocked by water at ...` or `blocked by rock at ...`. `player` has not changed. |
| 4  | Tap an arrow during a walk                                | The tap waits. The marker finishes the walk, then takes that step. It never skips a cell.                                                                   |
| 5  | Mash arrows quickly, then stop                            | The marker settles on the cell `player` reports.                                                                                                            |
| 6  | Hold an arrow down                                        | The marker keeps walking. Holding into a wall repeats the bump.                                                                                             |
| 7  | Load `?seed=7`                                            | A different map.                                                                                                                                            |
| 8  | Run `game.state` in the console                           | Plain data: `seed` and `player`. No terrain list.                                                                                                           |
| 9  | Press an arrow several times                              | Position and Terrain in the panel change as each step plays, and never ahead of the marker.                                                                 |
| 10 | Make the window short, then press the down arrow          | The page does not scroll. The marker moves.                                                                                                                 |
| 11 | Click the sound button, then press an arrow               | The button reads `Sound: off`, and the arrow still moves the marker.                                                                                        |
| 12 | Click the sound button again                              | The button reads `Sound: on`, and you hear a two-note chime.                                                                                                |
| 13 | Tab to the sound button and press Space                   | It toggles. Arrow keys still move the marker.                                                                                                               |
| 14 | Listen while walking and bumping (headphones or speakers) | A soft tick on each step, and a low buzz on each bump. **This is the only check that a person can hear them.**                                              |
| 15 | On a high-resolution display, or at browser zoom 200%     | Grid edges stay sharp. The marker stays centered. Run `document.querySelector("canvas").width`: it is the canvas `clientWidth` times `devicePixelRatio`.    |

Full gameplay test

1. Run deno task dev.

2. Open the game using a fixed seed, such as ?seed=121.

3. Move around and gather resources.

4. Try gathering from the same cell twice. The second attempt should not\
   add another item.

5. Open the inventory and verify that gathered items appear.

6. Attempt to craft an item without enough materials. Verify that the game explains the failure and inventory does not change.

7. Gather the required materials and craft a rope and raft.

8. Move to a channel cell and verify that it is accessible after crafting the raft.

9. Gather the materials for the remaining recipes and craft the rescue beacon.

10. Verify that the win state appears and that further commands do not change the game.
