/*
Week 4 — Example 4: Playable Maze (JSON + Level class + Player class)
Course: GBDA302
Instructors: Dr. Karen Cochrane and David Han
Date: Feb. 5, 2026

This is the "orchestrator" file:
- Loads JSON levels (preload)
- Builds Level objects
- Creates/positions the Player
- Handles input + level switching

It is intentionally light on "details" because those are moved into:
- Level.js (grid + drawing + tile meaning)
- Player.js (position + movement rules)

Based on the playable maze structure from Example 3
*/

const TS = 32;

// --- Game Data ---
let levelsData;
let levels = [];
let li = 0;
let player;

let evidenceCollected = 0;
const EVIDENCE_NEEDED = 3;

let currentClue = null;
let notEnoughClues = false;

let identifyKiller = false;
let killerOptions = [];
let correctKiller = 0;
let killerImages = [];
let killerResult = null; // null=no choice, "correct"/"wrong"

let level2Killer = null; // only exists in level 2

let playerCaught = false; // flag for collision
let caughtPopup = false; // show "The killer caught you!" popup

const CLUES = [
  [
    "The killer's favourite colour is red.",
    "The killer was seen at the library.",
    "The killer gets cold easily.",
  ],
  [
    "The killer loves vanilla ice cream.",
    "Black hair was found at the scene.",
    "The killer is allergic to cherries.",
  ],
];

function preload() {
  levelsData = loadJSON("levels.json");

  killerImages = [
    [
      loadImage("assets/images/level1_killer1.png"),
      loadImage("assets/images/level1_killer2.png"),
      loadImage("assets/images/level1_killer3.png"),
    ],
    [
      loadImage("assets/images/level2_killer1.png"),
      loadImage("assets/images/level2_killer2.png"),
      loadImage("assets/images/level2_killer3.png"),
    ],
  ];
}

function setup() {
  levels = levelsData.levels.map((grid) => new Level(copyGrid(grid), TS));
  player = new Player(TS);
  loadLevel(0);

  noStroke();
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  background(240);

  levels[li].draw();

  // Draw Level 2 killer
  if (li === 1 && level2Killer) {
    // Always draw the killer at its current position
    level2Killer.draw();

    // If the player is caught, show killer emoji on top of player
    if (playerCaught) {
      textSize(TS * 0.6);
      textAlign(CENTER, CENTER);
      text("😈", player.pixelX(), player.pixelY());
    }
  }

  player.draw();
  drawHUD();

  // Handle popups as before...
  if (currentClue) {
    drawPopup(
      currentClue,
      color(73, 73, 171),
      "Continue",
      color(200, 200, 254),
    );
    return;
  }
  if (notEnoughClues) {
    drawPopup(
      "You don't have all the clues!",
      color(200, 94, 7),
      "Continue",
      color(248, 169, 104),
    );
    return;
  }
  if (identifyKiller) {
    drawKillerPopup();
    return;
  }

  if (caughtPopup) {
    textSize(TS * 0.6);
    textAlign(CENTER, CENTER);
    text("😈", player.pixelX(), player.pixelY());

    drawPopup(
      "The killer caught you!",
      color(150, 50, 50),
      "Restart",
      color(255, 200, 200),
      () => {
        caughtPopup = false;
        playerCaught = false;
        loadLevel(li);
      },
    );
    return;
  }
}

// --- HUD ---
function drawHUD() {
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Level ${li + 1}/${levels.length} — WASD/Arrows to move`, 31, 12);
  text(
    `Clues Collected: ${evidenceCollected}/${EVIDENCE_NEEDED}`,
    31,
    height - 25,
  );
}

function drawPopup(message, bgColor, btnText, btnColor, onClick) {
  let rectW = width * 0.7;
  let rectH = height * 0.5;
  let rectX = (width - rectW) / 2;
  let rectY = (height - rectH) / 2;

  fill(bgColor);
  rect(rectX, rectY, rectW, rectH, 10);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text(message, rectX + rectW / 2, rectY + rectH / 2 - 20);

  let btnW = 100;
  let btnH = 30;
  let btnX = rectX + rectW / 2 - btnW / 2;
  let btnY = rectY + rectH - btnH - 20;

  fill(btnColor);
  rect(btnX, btnY, btnW, btnH, 5);

  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text(btnText, rectX + rectW / 2, btnY + btnH / 2);

  // Save button area for click detection
  popupButton = { x: btnX, y: btnY, w: btnW, h: btnH, onClick };
}

// --- Killer Popup ---
function drawKillerPopup() {
  let rectW = width * 0.7,
    rectH = height * 0.5;
  let rectX = (width - rectW) / 2,
    rectY = (height - rectH) / 2;

  fill(0);
  rect(rectX, rectY, rectW, rectH, 10);

  textAlign(CENTER, TOP);
  textSize(14);

  if (!killerResult) {
    // Show instructions and killer images
    fill(255);
    text("Identify the killer using the clues!", rectX + rectW / 2, rectY + 10);

    let imgSize = 60;
    let numImages = killerOptions.length;
    let paddingX = rectW * 0.15;
    let spacing = numImages > 1 ? (rectW - paddingX * 2) / (numImages - 1) : 0;

    for (let i = 0; i < numImages; i++) {
      let img = killerOptions[i];
      let scale = imgSize / max(img.width, img.height);
      let imgW = img.width * scale,
        imgH = img.height * scale;
      let x = rectX + paddingX + spacing * i - imgW / 2;
      let y = rectY + rectH * 0.65 - imgH / 2;

      image(img, x, y, imgW, imgH);
    }
  } else {
    // Show result message
    fill(killerResult === "correct" ? color(12, 233, 12) : color(233, 12, 12));
    text(
      killerResult === "correct"
        ? "You solved the case!"
        : "Wrong killer! Try again.",
      rectX + rectW / 2,
      rectY + 30,
    );

    // Determine button text
    let btnText;
    if (killerResult === "correct") {
      btnText = li === 1 ? "Back to Level 1" : "Next Level";
    } else {
      btnText = "Restart";
    }

    // Draw button
    let btnW = 120,
      btnH = 30;
    let btnX = rectX + rectW / 2 - btnW / 2;
    let btnY = rectY + rectH - btnH - 20;

    fill(200, 200, 254);
    rect(btnX, btnY, btnW, btnH, 5);

    fill(0);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(btnText, rectX + rectW / 2, btnY + btnH / 2);

    // Store popup button for click handling
    popupButton = {
      x: btnX,
      y: btnY,
      w: btnW,
      h: btnH,
      onClick: () => {
        if (killerResult === "correct") {
          if (li === 1)
            loadLevel(0); // back to level 1
          else nextLevel();
        } else {
          loadLevel(li);
        }

        identifyKiller = false;
        killerResult = null;
        popupButton = null;
      },
    };
  }
}

// --- Input ---
function keyPressed() {
  // Disable all movement if player is caught or in a popup
  if (currentClue || notEnoughClues || identifyKiller || playerCaught) return;

  let dr = 0,
    dc = 0;

  if (keyCode === LEFT_ARROW || key === "a" || key === "A") dc = -1;
  else if (keyCode === RIGHT_ARROW || key === "d" || key === "D") dc = 1;
  else if (keyCode === UP_ARROW || key === "w" || key === "W") dr = -1;
  else if (keyCode === DOWN_ARROW || key === "s" || key === "S") dr = 1;
  else return;

  // Attempt to move the player
  if (player.tryMove(levels[li], dr, dc)) {
    // --- 1) Check collision immediately after player moves ---
    if (li === 1 && level2Killer && level2Killer.checkCollision(player)) {
      playerCaught = true;
      caughtPopup = true;
      return; // killer got player, stop here
    }

    // --- 2) Move killer (if level 2) ---
    if (li === 1 && level2Killer) {
      level2Killer.move(levels[li], player);

      // --- 3) Check collision again after killer moves ---
      if (level2Killer.checkCollision(player)) {
        playerCaught = true;
        caughtPopup = true;
        return;
      }
    }

    // --- 4) Only check tiles (clues/goals) if player is not caught ---
    if (!playerCaught) {
      checkTile();
    }
  }
}

function mousePressed() {
  // Normal popups
  if (currentClue) return handlePopupClick(() => (currentClue = null));
  if (notEnoughClues) return handlePopupClick(() => (notEnoughClues = false));

  // Caught popup
  if (caughtPopup)
    return handlePopupClick(() => {
      caughtPopup = false;
      playerCaught = false;
      loadLevel(li);
    });

  if (identifyKiller) {
    let rectW = width * 0.7,
      rectH = height * 0.5;
    let rectX = (width - rectW) / 2,
      rectY = (height - rectH) / 2;

    if (!killerResult) {
      let imgSize = 60;
      let numImages = killerOptions.length;
      let paddingX = rectW * 0.15;
      let spacing =
        numImages > 1 ? (rectW - paddingX * 2) / (numImages - 1) : 0;

      for (let i = 0; i < numImages; i++) {
        let img = killerOptions[i];
        let scale = imgSize / max(img.width, img.height);
        let imgW = img.width * scale,
          imgH = img.height * scale;
        let x = rectX + paddingX + spacing * i - imgW / 2;
        let y = rectY + rectH * 0.65 - imgH / 2;

        if (
          mouseX >= x &&
          mouseX <= x + imgW &&
          mouseY >= y &&
          mouseY <= y + imgH
        ) {
          killerResult =
            killerOptions[i] === correctKiller ? "correct" : "wrong";
          return;
        }
      }
    } else {
      let btnW = 120,
        btnH = 40;
      let btnX = rectX + rectW / 2 - btnW / 2;
      let btnY = rectY + rectH - btnH - 20;

      if (
        mouseX >= btnX &&
        mouseX <= btnX + btnW &&
        mouseY >= btnY &&
        mouseY <= btnY + btnH
      ) {
        if (killerResult === "correct") nextLevel();
        else loadLevel(li);

        identifyKiller = false;
        killerResult = null;
      }
    }
    return;
  }
}

// --- Popup Click Helper ---
let popupButton = null; // global variable to store current popup button

function handlePopupClick(defaultCallback) {
  if (!popupButton) return;

  if (
    mouseX >= popupButton.x &&
    mouseX <= popupButton.x + popupButton.w &&
    mouseY >= popupButton.y &&
    mouseY <= popupButton.y + popupButton.h
  ) {
    if (popupButton.onClick) popupButton.onClick();
    else if (defaultCallback) defaultCallback();

    // Clear after click
    popupButton = null;
  }
}

function loadLevel(idx) {
  playerCaught = false;
  caughtPopup = false;
  li = idx;
  evidenceCollected = 0;
  currentClue = null;
  notEnoughClues = false;
  identifyKiller = false;
  killerResult = null;

  const level = levels[li];
  level.grid = level.copyGrid(level.originalGrid);

  if (level.start) player.setCell(level.start.r, level.start.c);
  else player.setCell(1, 1);

  if (li === 1) {
    const killers = level.spawnKillers();
    level2Killer = killers.length > 0 ? killers[0] : null;
  } else {
    level2Killer = null;
  }

  resizeCanvas(level.pixelWidth(), level.pixelHeight());
}

function nextLevel() {
  const next = (li + 1) % levels.length;
  loadLevel(next);
}

// --- Utility ---
function copyGrid(grid) {
  return grid.map((row) => row.slice());
}

function checkTile() {
  const result = levels[li].handlePlayerTile(player);

  if (result === "clue") {
    currentClue = CLUES[li][evidenceCollected];
    evidenceCollected++;
  } else if (result === "goal") {
    if (evidenceCollected >= EVIDENCE_NEEDED) {
      setupKillerPopup();
      identifyKiller = true;
    } else {
      notEnoughClues = true;
    }
  }
}

function setupKillerPopup() {
  if (!killerImages[li]) {
    console.warn("No killer images for level:", li);
    return;
  }

  killerOptions = killerImages[li].slice();
  killerOptions = shuffle(killerOptions);
  correctKiller = killerImages[li][0];
}
