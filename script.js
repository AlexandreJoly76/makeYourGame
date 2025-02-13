import dialogues from "./dialogues.js";
import tileMap from "./tileMap.js";
let isGameOver = true;
let isInConfirmation = false;
const PLAYER_WIDTH = 50;
const ScoreByType = {
  2: 200,
  3: 300,
};
let tileSize = 60;
let isInMenu = true;
const playerSpeed = 300; // pixels par seconde
let actualLevel = 1;
let totalLives = 3;
let livesLeft = 3;
let keysPressed = {};
let hud
let gamePaused = false;
let animationFrameId;
let music;
const levelsBackgrounds = {
  menu: "url('https://i.postimg.cc/htdVFFpc/bg-Main-Menu.jpg')",
  1: "url('https://i.postimg.cc/Pf8Fv69w/Design-sans-titre-2.png')",
  2: "url('https://i.postimg.cc/V61VZttc/background2.png')",
  3: "url('https://i.postimg.cc/XJM7X4Pv/background3.png')",
};
let activeIntervals = [];
let activeEnemyShots = [];
let activePlayerShots = [];
let enemyDirection = "right";
let enemies = [];
let enemyIntervalShoot;

let menu;
let btns = [];

let player;
let playerRect;
let position;

let scoreDisplay;
let score = 0;

function createPlayer(x, y, tileSize = 50) {
  player = document.createElement("div");
  player.classList.add("player");
  player.style.position = "absolute";
  player.style.width = `${tileSize}px`;
  player.style.height = `${tileSize}px`;
  gameArea.appendChild(player);
  let playerX = x * tileSize;
  let playerY = y * tileSize;

  // Appliquer la position
  player.style.left = `${playerX}px`;
  player.style.top = `${playerY}px`;

  position = { left: parseInt(player.style.left), bottom: 55 };
}
// gameArea  width and height
let gameArea = document.getElementsByClassName("gameArea")[0];
const gameAreaRect = gameArea.getBoundingClientRect();

//scoring implementation
function initializeScore() {
  scoreDisplay = document.createElement("div");
  scoreDisplay.classList.add("score");
  scoreDisplay.innerText = `Score: ${score}`;
  hud.appendChild(scoreDisplay);
}
function initializeLives() {
  let lifeContainer = document.createElement("div");
  lifeContainer.classList.add("lifeContainer");
  lifeContainer.innerText = "Lives: ";

  for (let i = 0; i < totalLives; i++) {
    let life = document.createElement("img");
    life.src = "assets/heartIcon.png";
    life.classList.add("life");
    i>livesLeft-1?life.classList.add("hit"):null;
    lifeContainer.appendChild(life);
  }
  hud.appendChild(lifeContainer);
}
function initializeLevelHud() {
  let levelDisplay = document.createElement("div");
  levelDisplay.classList.add("level");
  levelDisplay.innerText = `Level: ${actualLevel}`;
  hud.appendChild(levelDisplay);
}
// Pause menu
let menuPause = document.createElement("div");
menuPause.classList.add("menuPause", "menu");
menuPause.style.zIndex = "100";
menuPause.innerHTML = `<h1>Pause</h1><button class="btn selected">Continue</button><button class="btn">Restart</button><button class="btn">Menu</button>`;

// Event for pause the game
let Pause = addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (isInConfirmation) return;
    togglePause();
  }
});

function createEnemy(x, y, tileSize = 50, type = 2) {
  let enemy = document.createElement("div");
  enemy.classList.add("enemy");
  enemy.style.left = x + "px";
  enemy.style.top = y + "px";
  enemy.style.width = tileSize + "px";
  enemy.style.height = tileSize + "px";
  enemy.style.backgroundImage = `url('assets/enemy${type - 1}.png')`;
  enemy.dataset.type = type;

  gameArea.appendChild(enemy);

  // On ajoute l'ennemi à la liste pour la gestion des collisions et déplacements
  enemies.push({
    div: enemy,
    x: x,
    y: y,
  });
}

function handleMovement(delta) {
  if (isInMenu) return;
  let moved = false;

  if (
    keysPressed["ArrowRight"] &&
    position.left + PLAYER_WIDTH < gameAreaRect.width
  ) {
    position.left = Math.min(
      position.left + playerSpeed * (delta / 1000),
      gameAreaRect.width - PLAYER_WIDTH
    );
    moved = true;
  }

  if (keysPressed["ArrowLeft"] && position.left > 0) {
    position.left = Math.max(position.left - playerSpeed * (delta / 1000), 0);
    moved = true;
  }

  if (keysPressed["KeyB"]) {
    enemyShot();
  }

  if (moved) {
    player.style.left = position.left + "px";
  }
}

const FPS = 60; // Nombre d'images par seconde
const frameDuration = 1000 / FPS; // Durée d'une frame en millisecondes (~16,66 ms pour 60 FPS)
let lastTime = 0; // Dernier timestamp traité

let timeSinceLastFrame = 0;

const gameLoop = (timestamp) => {
  if (!isInMenu) {
    let delta = timestamp - lastTime;
    timeSinceLastFrame += delta;

    if (timeSinceLastFrame >= frameDuration) {
      lastTime = timestamp;
      timeSinceLastFrame %= frameDuration; // Conserver l'excédent pour éviter de perdre des frames

      handleShot();
      moveEnemies(tileSize);
      handleMovement(frameDuration); // Toujours avec frameDuration pour garder un rythme stable
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }
};

function initializeGame() {
  mainMenu();
  // menuControls();
  enableMenuControls();
}
initializeGame();

function startGame(level) {
  isInMenu = false;
  gameArea.innerHTML = "";
  gamePaused = false;
  isGameOver = false;
  enemies = [];
  if (level === 1) {
    score = 0;
    livesLeft = 3;
  }
  actualLevel = level;
  activeIntervals.forEach((interval) => {
    clearInterval(interval);
  });
  initializeMap(level);
  initializeHud();
  clearInterval(enemyIntervalShoot);
  randomEnemyShots();

  gameLoop(0);
}

function initializeMap(level) {
  gameArea.innerHTML = ""; // Efface l'écran avant d'afficher la map
  enemies = [];

  const tileMapLevel = tileMap[level]; // Récupère la carte du niveau

  let map = tileMapLevel.map; // Récupère la carte du niveau

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const tile = map[y][x];

      if (tile >= 2) {
        createEnemy(x * tileSize, y * tileSize+20, tileSize, tile); // Place un ennemi
      }
      if (tile === 1) {
        createPlayer(x, y, tileSize);
      }
    }
  }
}

function startLevel(level) {
  initializeBackground(level);
  if (dialogues[level]) {
    dialogueIndex = 0;
    displayDialogues(dialogues[level], () => {
      startGame(level);
    });
  } else {
    startGame(level);
  }
}
function mainMenu() {
  gameArea.innerHTML = "";
  isInMenu = true;
  let mainMenu = document.createElement("div");
  mainMenu.classList.add("mainMenu", "menu");
  mainMenu.innerHTML = `<h1>Star Wars : invasion</h1><button class="btn selected">Start</button><button class="btn">Scoreboard</button>`;
  initializeBackground("menu");
  let startBtn = mainMenu.querySelector("button");
  startBtn.addEventListener("click", () => {
    gameArea.removeChild(mainMenu);
    startLevel(1);
  });
  let scoreboardBtn = mainMenu.querySelector("button:last-child");
  scoreboardBtn.addEventListener("click", () => {
    displayScoreboard();
  });
  gameArea.appendChild(mainMenu);
  menu = mainMenu;
  btns = Array.from(mainMenu.getElementsByClassName("btn"));
}
function displayScoreboard() {
  gameArea.innerHTML = "";
  let scoreboard = document.createElement("div");
  scoreboard.classList.add("scoreboard", "menu");
  let highscores = JSON.parse(localStorage.getItem("highscores")) || [];
  let topScores = highscores.slice(0, 5);
  let scoreList = topScores
    .map((score, index) => {
      return `<li>${index + 1}. ${score.name} - ${score.score}</li>`;
    })
    .join("");

  scoreboard.innerHTML = `<h1>Scoreboard</h1><ul>${scoreList}</ul><button class="btn selected">Back</button>`;

  gameArea.appendChild(scoreboard);
  let backBtn = scoreboard.querySelector("button");
  menu = scoreboard;
  btns = Array.from(scoreboard.getElementsByClassName("btn"));
  backBtn.addEventListener("click", () => {
    gameArea.removeChild(scoreboard);
    mainMenu();
  });
}
function togglePause() {
  if (isGameOver) {
    return;
  }
  gamePaused = !gamePaused;

  if (gamePaused) {
    isInMenu = true;
    activeIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    gameArea.appendChild(menuPause);
    cancelAnimationFrame(animationFrameId);
    pauseShots();
    menu = menuPause;
    btns = Array.from(menuPause.getElementsByClassName("btn"));
    //Select the first button by default
    btns.forEach((btn) => btn.classList.remove("selected"));
    btns[0].classList.add("selected");
  } else {
    isInMenu = false;
    gameArea.removeChild(menuPause);
    resumeShots();
    moveEnemies(enemyDirection === "right" ? false : true);
    requestAnimationFrame(gameLoop);
  }
}
function initializeBackground(level) {
  gameArea.style.setProperty("--bg-img", levelsBackgrounds[level]);
}

document.addEventListener("keydown", (e) => {
  if (!keysPressed[e.code]) {
    keysPressed[e.code] = true;
  }
});
document.addEventListener("keyup", (e) => {
  keysPressed[e.code] = false;
});

let lastShotTime = 0;

function handleShot() {
  if (keysPressed["Space"]) {
    fireShot();
  }
}

const fireShot = () => {
  if (isInMenu) return;
  const currentTime = Date.now();
  if (currentTime - lastShotTime < 400) {
    return;
  }
  lastShotTime = currentTime;
  //Play the sound of the shot
  playSound("sounds/laser.wav");
  let shot = document.createElement("div");
  shot.classList.add("shot");
  gameArea.appendChild(shot);
  shot.style.left = position.left + PLAYER_WIDTH / 2 - 2 + "px";
  shot.style.bottom = position.bottom + PLAYER_WIDTH + "px";
  let shotRect = shot.getBoundingClientRect();
  let shotLoop = setInterval(() => {
    shotDeplacement(shot, "up");
    shotRect = shot.getBoundingClientRect();
    if (shotRect.top < gameAreaRect.top - 20) {
      clearInterval(shotLoop);
      gameArea.removeChild(shot);
    }

    for (let index = 0; index < enemies.length; index++) {
      let enemy = enemies[index];
      if (isCollision(shotRect, enemy.div.getBoundingClientRect())) {
        //Play the sound
        let randSound = Math.round(Math.random() * 3) + 1;
        playSound(`sounds/hitsound${randSound}.mp3`);
        enemy.div.style.background = "none";
        gameArea.removeChild(shot);
        clearInterval(shotLoop);
        let type = enemy.div.dataset.type;
        enemies.splice(index, 1); // Remove the hit enemy from the array
        updateScore(type);
        //Check win
        winGame();
        break; // Break the loop if an enemy is hit
      }
    }
  }, 20);
  activePlayerShots.push({ element: shot, interval: shotLoop });
};
function shotDeplacement(shot, direction) {
  if (direction === "up") {
    shot.style.bottom = parseInt(shot.style.bottom) + 10 + "px";
  }
  if (direction === "down") {
    shot.style.top = parseInt(shot.style.top) + 10 + "px";
  }
}
function isCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top
  );
}

function updateScore(type) {
  score += ScoreByType[type];
  scoreDisplay.innerText = `Score: ${score}`;
}
// Handle enemies shots

function playSound(src, volume = 0.1) {
  let sound = new Audio(src);
  sound.volume = volume;
  sound.play();
}

const enemyShot = () => {
  if (gamePaused) return;
  // Select the closest enemy to the player to shoot
  let closestEnemy = null;
  let minDistance = Infinity;
  let playerRect = player.getBoundingClientRect();
  enemies.forEach((enemy, index) => {
    let enemyRect = enemy.div.getBoundingClientRect();
    let distance = Math.abs(enemyRect.left - playerRect.left);
    if (distance <= minDistance) {
      minDistance = distance;
      closestEnemy = index;
    }
  });
  let enemy = enemies[closestEnemy];

  const enemyShot = document.createElement("div");
  enemyShot.classList.add("enemyShot");
  gameArea.appendChild(enemyShot);
  playSound("sounds/laser.wav");
  enemyShot.style.left = parseInt(enemy.div.style.left) + tileSize / 2 + "px";
  enemyShot.style.top = parseInt(enemy.div.style.top) + tileSize / 2 + "px";

  let enemyShotRect = enemyShot.getBoundingClientRect();

  let enemyShotLoop = setInterval(() => {
    if (!gamePaused) {
      shotDeplacement(enemyShot, "down");
      enemyShotRect = enemyShot.getBoundingClientRect();
      if (enemyShotRect.top + 20 > gameAreaRect.top + gameAreaRect.height) {
        clearInterval(enemyShotLoop);
        gameArea.removeChild(enemyShot);
      }
      if (isCollision(enemyShotRect, player.getBoundingClientRect())) {
        player.classList.add("hit");
        setTimeout(() => {
          player.classList.remove("hit");
        }, 1000);
        let life = document.getElementsByClassName("life");
        life[livesLeft - 1].classList.add("hit");
        playSound(`sounds/ouch${livesLeft}.mp3`);
        livesLeft--;
        if (livesLeft === 0) {
          gameover();
          keysPressed = {};
          clearInterval(enemyShotLoop);
          enemyShot.remove();
        }
        clearInterval(enemyShotLoop);
        enemyShot.remove();
      }
    }
  }, 20);
  activeEnemyShots.push({ element: enemyShot, interval: enemyShotLoop });
};
function pauseShots() {
  activeEnemyShots.forEach((shot) => {
    clearInterval(shot.interval);
  });
  activePlayerShots.forEach((shot) => {
    clearInterval(shot.interval);
  });
}
function resumeShots() {
  // For enemy shots
  activeEnemyShots.forEach((shot) => {
    const enemyShot = shot.element;
    let enemyShotRect = enemyShot.getBoundingClientRect();

    // Clear any existing interval before starting a new one
    if (shot.interval) {
      clearInterval(shot.interval);
    }

    let enemyShotLoop = setInterval(() => {
      if (!gamePaused) {
        shotDeplacement(enemyShot, "down");
        enemyShotRect = enemyShot.getBoundingClientRect();

        if (enemyShotRect.top + 20 > gameAreaRect.top + gameAreaRect.height) {
          clearInterval(enemyShotLoop);
          gameArea.removeChild(enemyShot);
        }

        if (isCollision(enemyShotRect, player.getBoundingClientRect())) {
          player.classList.add("hit");
          setTimeout(() => {
            player.classList.remove("hit");
          }, 1000);

          let life = document.getElementsByClassName("life");
          life[livesLeft - 1].style.visibility = "hidden";
          playSound(`sounds/ouch${livesLeft}.mp3`);
          livesLeft--;

          if (livesLeft === 0) {
            gameover();
            keysPressed = {};
            clearInterval(enemyShotLoop);
            enemyShot.remove();
          }
          clearInterval(enemyShotLoop);
          enemyShot.remove();
        }
      }
    }, 20);

    // Update the shot's interval reference
    shot.interval = enemyShotLoop;
  });

  // For player shots
  activePlayerShots.forEach((playerShot) => {
    const shot = playerShot.element;

    // Declare shotRect here to avoid the Uncaught ReferenceError
    let shotRect;

    // Clear any existing interval before starting a new one
    if (playerShot.interval) {
      clearInterval(playerShot.interval);
    }

    let shotLoop = setInterval(() => {
      shotDeplacement(shot, "up");
      shotRect = shot.getBoundingClientRect(); // Ensure shotRect is assigned

      if (shotRect.top < gameAreaRect.top - 20) {
        clearInterval(shotLoop);
        shot.remove();
      }

      for (let index = 0; index < enemies.length; index++) {
        let enemy = enemies[index];

        if (isCollision(shotRect, enemy.div.getBoundingClientRect())) {
          // Play the sound
          let randSound = Math.round(Math.random() * 3) + 1;
          playSound(`sounds/hitsound${randSound}.mp3`);
          enemy.div.style.background = "none";
          gameArea.removeChild(shot);
          clearInterval(shotLoop);
          enemies.splice(index, 1); // Remove the hit enemy from the array
          updateScore();
          winGame();
          break; // Break the loop if an enemy is hit
        }
      }
    }, 20);

    // Update the shot's interval reference
    playerShot.interval = shotLoop;
  });
}
function randomEnemyShots() {
  enemyIntervalShoot = setInterval(() => {
    enemyShot();
  }, 3000);
}

// Handle enemy movement
let moveRight = true; // Indique si les ennemis se déplacent à droite
let moveLeft = false; // Indique si les ennemis se déplacent à gauche

function moveEnemies(tileSize) {
  const tileWidth = tileSize;
  const gameAreaRect = gameArea.getBoundingClientRect(); // Zone de jeu

  // Calculer la position des ennemis à chaque mouvement
  let bounds = getActiveEnemyBounds(); // Récupérer les coordonnées max et min des ennemis

  // Si les ennemis atteignent le bord droit
  if (
    bounds.maxX + tileWidth >= gameAreaRect.width &&
    enemyDirection === "right"
  ) {
    moveEnemiesDown();
    enemyDirection = "left"; // Changer la direction vers la gauche
  }
  // Si les ennemis atteignent le bord gauche
  else if (bounds.minX <= 0 && enemyDirection === "left") {
    moveEnemiesDown();
    enemyDirection = "right"; // Changer la direction vers la droite
  }

  // Déplacer tous les ennemis horizontalement selon la direction
  moveEnemiesHorizontally(enemyDirection === "right" ? 2 : -2);
  // Vérifier si les ennemis atteignent le joueur
  checkEnemiesCollision();
}

function checkEnemiesCollision() {
  enemies.forEach((enemy) => {
    if (
      isCollision(
        player.getBoundingClientRect(),
        enemy.div.getBoundingClientRect()
      )
    ) {
      gameover();
    }
    if (parseInt(enemy.div.style.top) + tileSize >= gameAreaRect.height) {
      gameover();
    }
  });
}
// Fonction pour déplacer tous les ennemis horizontalement
function moveEnemiesHorizontally(amount) {
  enemies.forEach((enemy) => {
    let currentLeft = parseInt(enemy.div.style.left);
    enemy.div.style.left = currentLeft + amount + "px"; // Déplacement horizontal
  });
}

// Fonction pour déplacer tous les ennemis d'une ligne vers le bas
function moveEnemiesDown() {
  enemies.forEach((enemy) => {
    let currentTop = parseInt(enemy.div.style.top);
    enemy.div.style.top = currentTop + 30 + "px"; // Déplacement vertical vers le bas
  });
}

function getActiveEnemyBounds() {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  enemies.forEach((enemy) => {
    if (parseInt(enemy.div.style.left) < minX) {
      minX = parseInt(enemy.div.style.left);
    }
    if (parseInt(enemy.div.style.top) < minY) {
      minY = parseInt(enemy.div.style.top);
    }
    if (parseInt(enemy.div.style.left) > maxX) {
      maxX = parseInt(enemy.div.style.left);
    }
    if (parseInt(enemy.div.style.top) > maxY) {
      maxY = parseInt(enemy.div.style.top);
    }
  });
  return { minX, minY, maxX, maxY };
}

document.addEventListener("keydown", (e) => {
  if (e.key === "p") {
    togglePause();
  }
  if (e.key === "r") {
    window.location.reload();
  }
  if (e.key === "u") {
    livesLeft++;
    let life = document.createElement("img");
    life.src = "assets/heartIcon.png";
    life.classList.add("life");
    lifeContainer.appendChild(life);
  }
});

function gameover() {
  if (isGameOver) return;
  isGameOver = true;
  isInMenu = true;
  if (!gamePaused) {
    cancelAnimationFrame(animationFrameId);
    //Get the name of the player
    let playerName = prompt("Enter your name : ");
    if (playerName === null || playerName === "") {
      playerName = "Player";
    }
    if (playerName.length > 10) {
      playerName = playerName.slice(0, 10);
    }
    playerName = playerName.toLowerCase();
    let livesScore = livesLeft * 1000;
    score += livesScore;
    //Put the score in the local storage
    let highscores = JSON.parse(localStorage.getItem("highscores")) || [];
    highscores.push({ name: playerName, score: score });
    highscores.sort((a, b) => b.score - a.score);
    highscores = highscores.slice(0, 5);
    localStorage.setItem("highscores", JSON.stringify(highscores));
    const gameOver = document.createElement("div");
    gameOver.classList.add("gameOver", "menu");
    gameOver.innerHTML = `
    <h1>Game over</h1>
    <div class="scoreDiv">
      <h2>Your score is : ${score} !</h2>
      </div>
      <button class="btn selected">Restart</button>
    <button class="btn">Scoreboard</button>
      <button class="btn">Menu</button>`;
    gameOver.style.zIndex = "100";
    gameArea.appendChild(gameOver);
    activeIntervals.forEach(clearInterval);
    clearInterval(enemyIntervalShoot);
  }
  menu = document.querySelector(".gameOver");
  btns = Array.from(menu.getElementsByClassName("btn"));
}

//click mouse event
document.addEventListener("mousemove", (e) => {
  if (gamePaused) {
    let btns = Array.from(document.getElementsByClassName("btn"));
    btns.forEach((btn) => {
      let btnPosition = btn.getBoundingClientRect();
      if (
        e.clientX >= btnPosition.left &&
        e.clientX <= btnPosition.right &&
        e.clientY >= btnPosition.top &&
        e.clientY <= btnPosition.bottom
      ) {
        btns.forEach((btn) => btn.classList.remove("selected"));
        btn.classList.add("selected");
      }
    });
  }
});

document.addEventListener("click", (e) => {
  let btn = e.target.closest(".btn");
  if (btn) {
    if (btn.innerText === "Continue" && gamePaused) {
      togglePause();
    } else if (btn.innerText === "Restart") {
      confirmationMessage(
        "Are You Sure ? you will restart at level 1",
        startLevel,
        1
      );
    } else if (btn.innerText === "Menu") {
      confirmationMessage(
        "Are You Sure ? you will return to the main menu",
        mainMenu
      );
    }
  }
});

function confirmationMessage(message, callback, ...args) {
  let lastMenu = menu;
  let lastBtns = btns;
  isInConfirmation = true;
  let confirmation = document.createElement("div");
  confirmation.classList.add("confirmation", "menu");
  confirmation.innerHTML = `
  <h2>${message}</h2>
  <button class="btn selected">Yes</button>
  <button class="btn">No</button>`;
  gameArea.appendChild(confirmation);
  menu = confirmation;
  btns = Array.from(menu.getElementsByClassName("btn"));
  btns[0].addEventListener("click", () => {
    gameArea.removeChild(confirmation);
    isInConfirmation = false;
    callback(args);
  });
  btns[1].addEventListener("click", () => {
    menu = lastMenu;
    btns = lastBtns;
    isInConfirmation = false;
    gameArea.removeChild(confirmation);
  });
}

function winGame() {
  if (isGameOver) return;
  if (enemies.length === 0) {
    let totalLevels = Object.keys(tileMap).length;
    pauseShots();
    //Add more score depending on the time left (the max time is 97 seconds that add 0 points)
    let timeLeft =
      97 - parseInt(document.querySelector(".timer").innerText.split(" ")[1]);
    let timeScore = timeLeft * 100;
    score += timeScore;
    //Add more score depending on the lives left
    let win = document.createElement("div");
    win.classList.add("win", "menu");
    
    win.innerHTML = `
    <h1>You win</h1>`;
    if (actualLevel < totalLevels) {
      win.innerHTML+=`
    <button class="btn selected">Next Level</button>
    <button class="btn">Restart</button>
    `
    }
    win.innerHTML+= `<button class="btn ${actualLevel==totalLevels?"selected":""}">Menu</button>`;
    win.style.zIndex = "100";
    win.style.position = "absolute";
    gameArea.appendChild(win);
    cancelAnimationFrame(animationFrameId);
    activeIntervals.forEach(clearInterval);
    clearInterval(enemyIntervalShoot);

    isGameOver = true; // Set isGameOver to true to stop the timer
    isInMenu = true;
    menu = win;
    btns = Array.from(menu.getElementsByClassName("btn"));
  }
}

function initializeHud() {
  hud = document.createElement("div");
  hud.classList.add("hud");
  gameArea.appendChild(hud);
  initializeLevelHud();
  initializeScore();
  Timer();
  initializeLives();
}
function Timer() {
  let timerDisplay = document.createElement("div");
  let timer = 0;
  timerDisplay.classList.add("timer");
  timerDisplay.innerText = `Time: ${timer}`;
  hud.appendChild(timerDisplay);
  const timerInterval = setInterval(() => {
    if (!gamePaused && !isGameOver) {
      timer++;
      timerDisplay.innerText = `Time: ${timer}`;
    } else if (isGameOver) {
      clearInterval(timerInterval);
    }
  }, 1000);
}

// function menuControls() {
//   if (isInMenu) {
//     document.addEventListener("keydown", (e) => {
//       if (e.key === "ArrowDown") {
//         if (!isInMenu) return;
//         let selected = menu.querySelector(".selected");
//         let next = selected.nextElementSibling;
//         while (next && !next.classList.contains("btn")) {
//           next = next.nextElementSibling;
//         }
//         if (next) {
//           selected.classList.remove("selected");
//           next.classList.add("selected");
//         } else {
//           selected.classList.remove("selected");
//           btns[0].classList.add("selected");
//         }
//         playSound("sounds/menuBtnSound.mp3");
//       }
//       if (e.key === "ArrowUp") {
//         if (!isInMenu) return;

//         let selected = menu.querySelector(".selected");
//         let prev = selected.previousElementSibling;
//         while (prev && !prev.classList.contains("btn")) {
//           prev = prev.previousElementSibling;
//         }
//         if (prev) {
//           selected.classList.remove("selected");
//           prev.classList.add("selected");
//         } else {
//           selected.classList.remove("selected");
//           btns[btns.length - 1].classList.add("selected");
//         }
//         playSound("sounds/menuBtnSound.mp3");
//       }
//       if (e.key === "Enter") {
//         if (!isInMenu) return;
//         let selected = menu.querySelector(".selected");

//         if (selected.innerText === "Start") {
//             startLevel(1);
//           } else if (selected.innerText === "Restart") {
//             startLevel(actualLevel);
//           } else if (selected.innerText === "Continue") {
//             togglePause();
//           } else if (selected.innerText === "Scoreboard") {
//             displayScoreboard();
//           } else if (selected.innerText === "Menu" || selected.innerText === "Back") {
//             mainMenu();
//           }
//           playSound("sounds/menuBtnSound2.mp3");
//       }
//     });
//   }
// }
let dialogueIndex = 0;
let dialogue = document.createElement("div");
let dialogueText = document.createElement("p");

function displayDialogues(dialogues, callback) {
  // Disable the menu controls
  disableMenuControls();

  dialogueIndex = 0;
  gameArea.innerHTML = "";
  dialogue.classList.add("dialogue", "menu");
  dialogue.appendChild(dialogueText);
  gameArea.appendChild(dialogue);

  dialogueText.innerText = dialogues[dialogueIndex];
  dialogueIndex++;

  let isDialogueComplete = false;

  function onEnterPress(e) {
    if (e.key === "Enter") {
      if (isDialogueComplete) return;
      if (dialogues.length && dialogueIndex < dialogues.length) {
        dialogueText.innerText = dialogues[dialogueIndex];
        dialogueIndex++;
        playSound("sounds/menuBtnSound.mp3");
      } else {
        isDialogueComplete = true;
        document.removeEventListener("keydown", onEnterPress);
        dialogue.remove();
        callback();

        // Re-enable the menu controls
        enableMenuControls();
      }
    }
  }

  document.addEventListener("keydown", onEnterPress);
}

function disableMenuControls() {
  // Disable the menu control event listeners here
  document.removeEventListener("keydown", menuControlListener);
}

function enableMenuControls() {
  // Re-enable the menu control event listeners here
  document.addEventListener("keydown", menuControlListener);
}

function menuControlListener(e) {
  if (!isInMenu) return;
  if (e.key === "ArrowDown") {
    let selected = menu.querySelector(".selected");
    let next = selected.nextElementSibling;
    while (next && !next.classList.contains("btn")) {
      next = next.nextElementSibling;
    }
    if (next) {
      selected.classList.remove("selected");
      next.classList.add("selected");
    } else {
      selected.classList.remove("selected");
      btns[0].classList.add("selected");
    }
    playSound("sounds/menuBtnSound.mp3");
  }
  if (e.key === "ArrowUp") {
    let selected = menu.querySelector(".selected");
    let prev = selected.previousElementSibling;
    while (prev && !prev.classList.contains("btn")) {
      prev = prev.previousElementSibling;
    }
    if (prev) {
      selected.classList.remove("selected");
      prev.classList.add("selected");
    } else {
      selected.classList.remove("selected");
      btns[btns.length - 1].classList.add("selected");
    }
    playSound("sounds/menuBtnSound.mp3");
  }
  if (e.key === "Enter") {
    let selected = menu.querySelector(".selected");

    if (selected.innerText === "Start") {
      selected.click();
    } else if (selected.innerText === "Restart") {
      selected.click();
    } else if (selected.innerText === "Continue") {
      togglePause();
    } else if (selected.innerText === "Scoreboard") {
      displayScoreboard();
    } else if (selected.innerText === "Menu" || selected.innerText === "Back") {
      selected.click();
    } else if (selected.innerText === "Next Level") {
      startLevel(actualLevel + 1);
    } else if (selected.innerText === "Yes" || selected.innerText === "No") {
      selected.click();
    }
    playSound("sounds/menuBtnSound2.mp3");
  }
}
