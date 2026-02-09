/*
Level.js

A Level represents ONE maze grid loaded from levels.json. 

Tile legend (from your original example): 
0 = floor
1 = wall
2 = start
3 = goal
4 = clue (new)
5 = killer (new)

Responsibilities:
- Store the grid
- Find the start tile
- Provide collision/meaning queries (isWall, isGoal, inBounds)
- Draw the tiles (including a goal highlight)
*/

class Level {
  constructor(grid, tileSize) {
    // Store a copy of the original grid for resets
    this.originalGrid = this.copyGrid(grid); // <-- NEW
    // Current grid used during gameplay
    this.grid = this.copyGrid(grid);

    this.ts = tileSize;

    // Start position in grid coordinates (row/col)
    this.start = this.findStart();

    // Normalize start tile to floor
    if (this.start) {
      this.grid[this.start.r][this.start.c] = 0;
      this.originalGrid[this.start.r][this.start.c] = 0; // keep consistent
    }
    this.killers = this.spawnKillers();
  }

  // ----- Size helpers -----
  rows() {
    return this.grid.length;
  }

  cols() {
    return this.grid[0].length;
  }

  pixelWidth() {
    return this.cols() * this.ts;
  }

  pixelHeight() {
    return this.rows() * this.ts;
  }

  // ----- Semantic helpers -----
  inBounds(r, c) {
    return r >= 0 && c >= 0 && r < this.rows() && c < this.cols();
  }

  tileAt(r, c) {
    return this.grid[r][c];
  }

  isWall(r, c) {
    return this.tileAt(r, c) === 1;
  }

  isGoal(r, c) {
    return this.tileAt(r, c) === 3;
  }

  // ----- Handle player interaction with tiles -----
  handlePlayerTile(player) {
    const tile = this.tileAt(player.r, player.c);

    if (tile === 4) {
      // clue
      this.grid[player.r][player.c] = 0; // remove the clue from grid
      return "clue";
    } else if (tile === 3) {
      // goal
      return "goal";
    }

    return null; // nothing special
  }

  // ----- Start-finding -----
  findStart() {
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[0].length; c++) {
        if (this.grid[r][c] === 2) return { r, c };
      }
    }
    return null;
  }

  spawnKillers() {
    const killers = [];

    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.cols(); c++) {
        if (this.grid[r][c] === 5) {
          killers.push(new Killer(r, c, this.ts));
          this.grid[r][c] = 0;
        }
      }
    }

    return killers;
  }

  // ----- Drawing -----
  draw() {
    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.cols(); c++) {
        const v = this.grid[r][c];

        if (v === 1)
          fill(30, 50, 60); // walls
        else fill(232); // floor
        rect(c * this.ts, r * this.ts, this.ts, this.ts);

        if (v === 3) {
          textSize(this.ts * 0.6);
          textAlign(CENTER, CENTER);
          text("🚪", c * this.ts + this.ts / 2, r * this.ts + this.ts / 2);
        }
        if (v === 4) {
          textSize(this.ts * 0.4);
          textAlign(CENTER, CENTER);
          text("🧩", c * this.ts + this.ts / 2, r * this.ts + this.ts / 2);
        }
      }
    }
  }

  // ----- Utility: deep copy of a 2D array -----
  copyGrid(grid) {
    return grid.map((row) => row.slice());
  }
}
