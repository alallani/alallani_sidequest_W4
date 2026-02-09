class Killer {
  constructor(r, c, tileSize) {
    this.r = r;
    this.c = c;
    this.ts = tileSize;
  }

  // Draw the killer emoji
  draw() {
    textSize(this.ts * 0.6);
    textAlign(CENTER, CENTER);
    text("😈", this.c * this.ts + this.ts / 2, this.r * this.ts + this.ts / 2);
  }

  // Move killer either randomly or chase player
  move(level, player) {
    let dr = 0,
      dc = 0;

    // 20% chance to chase player
    if (random() < 0.2) {
      const rDiff = player.r - this.r;
      const cDiff = player.c - this.c;

      if (Math.abs(rDiff) > Math.abs(cDiff)) dr = Math.sign(rDiff);
      else dc = Math.sign(cDiff);

      // Prevent moving into wall
      const newR = this.r + dr;
      const newC = this.c + dc;
      if (!level.inBounds(newR, newC) || level.isWall(newR, newC)) {
        dr = 0;
        dc = 0;
      }
    }

    // If not chasing or blocked, pick random valid move
    if (dr === 0 && dc === 0) {
      const directions = shuffle([
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ]);

      for (let dir of directions) {
        const newR = this.r + dir.dr;
        const newC = this.c + dir.dc;
        if (level.inBounds(newR, newC) && !level.isWall(newR, newC)) {
          dr = dir.dr;
          dc = dir.dc;
          break;
        }
      }
    }

    this.r += dr;
    this.c += dc;
  }

  // Check if killer collides with player
  checkCollision(player) {
    return this.r === player.r && this.c === player.c;
  }
}
