let spawnInterval; // Declare this variable at the top with your other variables

let EnemySpawnRate = 3; // Time between enemy spawns in seconds
let enemies = []; // Array to hold enemy objects

let boat;
let rotationSpeed = 0.05;
let acceleration = 0.2;
let velocity;
let maxSpeed = 5;
let frictionCoefficient = 0.05;
let bullets = [];
let keys = {}; // Object to keep track of pressed keys
let lastBulletTime = 0; // Track the time since the last bullet was fired
let fireDelay = 500; // Set the delay between consecutive bullet firings (in milliseconds)

let currentState, startButton, backButton;
let islands = [], rocks = [], pressedKeys = {}, trash = [];
let collectedTrashCount = 0;
let lastTrashSpawn = 0;
let startGeneratingTrash = false;

function setup() {
  enemies = []; // Initialize the enemies array here

  createCanvas(windowWidth, windowHeight);
  currentState = 'mainMenu'; 
  createMainMenuButtons(); 
  lastTrashSpawn = millis(); // Initialize lastTrashSpawn to the current time
  
  // Boat setup
  boat = {
    x: width / 2,
    y: height / 2,
    rotation: 0
  };
  velocity = createVector(0, 0); // Initialize velocity
}

function draw() {
  background(currentState === 'game' ? color(128, 180, 255) : color(220));

  if (currentState === 'game') {
    // Update and draw enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      enemies[i].update(boat.x, boat.y);
      enemies[i].display();
      let d = dist(boat.x, boat.y, enemies[i].x, enemies[i].y);
      if (d < enemies[i].size / 2 + 15) {
        goToMainMenu();
        break;
      }
    }

    // Display collected trash count
    fill(0);
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Trash Collected: ${collectedTrashCount}`, 10, 10);

    // Check if trash generation should start
    if (startGeneratingTrash) {
      if (millis() - lastTrashSpawn > 2000 && trash.length < 20) {
        lastTrashSpawn = millis();
        generateNewTrash();
      }
    }

    // Display rocks and islands
    rocks.forEach(rock => rock.display());
    islands.forEach(island => island.display());

    // Display trash
    trash.forEach(t => t.display());

    // Update boat movement
    handleInput();

    // Update and draw bullets
    updateBullets();

    // Draw the boat
    drawBoat();

    // Collision with islands and rocks
    [...islands, ...rocks].forEach(obstacle => {
      let d = dist(boat.x, boat.y, obstacle.x, obstacle.y);
      if (d < obstacle.size / 2 + 15) {
        let angle = atan2(boat.y - obstacle.y, boat.x - obstacle.x);
        let newX = obstacle.x + (obstacle.size / 2 + 15) * cos(angle);
        let newY = obstacle.y + (obstacle.size / 2 + 15) * sin(angle);
        boat.x = newX;
        boat.y = newY;
        velocity.mult(0); // Reset the boat's velocity to zero
      }
    });

    // Collision with trash
    for (let i = trash.length - 1; i >= 0; i--) {
      let d = dist(boat.x, boat.y, trash[i].x, trash[i].y);
      if (d < trash[i].size / 2 + 25) {
        trash.splice(i, 1);
        collectedTrashCount++;
      }
    }
  }

  // UI for main menu
  if (currentState === 'mainMenu') {
    displayMainMenuText();
    startButton.show();
  } else {
    startButton.hide();
  }

  backButton.hide();
}


  
function goToMainMenu() {
  currentState = 'mainMenu';

  // Clear game entities
  enemies = [];
  bullets = [];
  trash = [];
  islands = [];
  rocks = [];

  // Reset game-related variables
  collectedTrashCount = 0;
  startGeneratingTrash = false;

  // Reset boat position and state
  boat.x = width / 2;
  boat.y = height / 2;
  boat.rotation = 0;
  velocity.set(0, 0); // Reset velocity to zero

  // Optionally, you can also reset any other relevant variables or states here
}


class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 2; // Adjust speed as needed
    this.size = 40; // Adjust size as needed
  }

  update(playerX, playerY) {
    let angle = atan2(playerY - this.y, playerX - this.x);
    this.x += this.speed * cos(angle);
    this.y += this.speed * sin(angle);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(atan2(boat.y - this.y, boat.x - this.x) + HALF_PI); // Orient the triangle towards the boat
    fill(255, 0, 0); // Enemy color
    noStroke();
    triangle(
      -this.size / 2, this.size / 2,
      this.size / 2, this.size / 2,
      0, -this.size / 2
    ); // Draw enemy as a triangle
    pop();
  }
}


function spawnEnemy() {
  let edge = floor(random(4)); // 0: top, 1: right, 2: bottom, 3: left
  let x, y;
  if (edge === 0) { // Top
    x = random(windowWidth);
    y = -20;
  } else if (edge === 1) { // Right
    x = windowWidth + 20;
    y = random(windowHeight);
  } else if (edge === 2) { // Bottom
    x = random(windowWidth);
    y = windowHeight + 20;
  } else { // Left
    x = -20;
    y = random(windowHeight);
  }
  enemies.push(new Enemy(x, y));
}


function keyPressed() {
  keys[keyCode] = true; // Set the keyCode as true when the key is pressed
}

function keyReleased() {
  keys[keyCode] = false; // Set the keyCode as false when the key is released
}

function handleInput() {
  if (currentState !== 'game') {
    return; // Exit the function if the game state is not 'game'
  }
  
  if (keys[UP_ARROW]) {
    // Calculate the movement vector based on boat's rotation
    let movement = p5.Vector.fromAngle(boat.rotation - HALF_PI);
    movement.mult(acceleration);
    velocity.add(movement);

    // Limit the speed
    velocity.limit(maxSpeed);
  }            

  if (keys[LEFT_ARROW]) {
    boat.rotation -= rotationSpeed;
  }

  if (keys[RIGHT_ARROW]) {
    boat.rotation += rotationSpeed;
  }

  // Shooting
  if (keys[32]) { // Space key
    // Calculate the current time
    let currentTime = millis();

    // Check if enough time has passed since the last bullet was fired
    if (currentTime - lastBulletTime > fireDelay) {
      // Create a bullet
      let bullet = {
        x: boat.x,
        y: boat.y,
        velocity: p5.Vector.fromAngle(boat.rotation - HALF_PI).mult(8) // Adjust bullet speed here
      };
      bullets.push(bullet);

      // Update the last bullet time to the current time
      lastBulletTime = currentTime;
    }
  }

  // Apply velocity
  boat.x += velocity.x;
  boat.y += velocity.y;

  // Apply friction
  let speed = velocity.mag();
  if (speed > 0) {
    let friction = velocity.copy().mult(-1);
    friction.mult(frictionCoefficient);
    velocity.add(friction);
  }
}

function drawBoat() {
  push();
  translate(boat.x, boat.y);
  rotate(boat.rotation);
  stroke(0); // Set outline color to black
  strokeWeight(2); // Set outline thickness
  fill(255);
  // Draw a simple boat shape
  beginShape();
  vertex(0, -15); // Top tip of the boat
  vertex(10, 15); // Bottom-right
  vertex(-10, 15); // Bottom-left
  endShape(CLOSE);
  pop();
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];

    bullet.x += bullet.velocity.x;
    bullet.y += bullet.velocity.y;

    fill(255, 0, 0);
    ellipse(bullet.x, bullet.y, 8, 8);

    if (bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height) {
      bullets.splice(i, 1);
    } else {
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (dist(bullet.x, bullet.y, enemies[j].x, enemies[j].y) < enemies[j].size / 2 + 4) {
          enemies.splice(j, 1);
          bullets.splice(i, 1);
          break;
        }
      }
    }
  }
}


function displayMainMenuText() {
  textSize(24);
  textAlign(CENTER, TOP);
  fill(0);
  text("Help clear the ocean.\nUse the arrow keys or WASD to move around.\nClick SPACE to shoot!", width/2, 50);
  
  textSize(18);
  textAlign(CENTER, BOTTOM);
  text("Game created by:\nAviad, David, Noah, Luca", width/2, height - 50);
}

function drawNewMap() {
  islands = [];
  rocks = [];
  trash = []; // Clear existing trash
  generateIslands();
  generateRocks();
  generateTrash(); // Generate new trash
  draw();
}

function createMainMenuButtons() {
  startButton = createButton('Start Game');

  const position = [width / 2 - 100, height / 2 - 30]; // Adjusted position to center the button

  startButton.position(position[0], position[1]);
  startButton.size(200, 60); // Adjusted size of the start button
  startButton.style('font-size', '24px'); // Adjusted font size of the button text
  startButton.mousePressed(startGame);

  backButton = createButton('Back to Main Menu');
  backButton.position(width / 2 - 80, height / 1.90 + 70);
  backButton.mousePressed(goToMainMenu);
  backButton.hide(); 
}

function startGame() { 
  currentState = 'game'; 
  generateIslands(); 
  generateRocks(); 
  startGeneratingTrash = true; // Start generating trash

  clearInterval(spawnInterval); // Clear any existing interval before setting a new one
  spawnInterval = setInterval(spawnEnemy, EnemySpawnRate * 1000); // Start spawning enemies
}



function generateRocks() {
  let numRocks = 10;
  for (let i = 0; i < numRocks; i++) {
    let x, y, size;
    let overlapping = true;
    while (overlapping) {
      x = random(width);
      y = random(height);
      size = random(20, 30);
      if (!isCollidingWithObstacles(x, y, size)) {
        overlapping = false;
      }
    }
    rocks.push(new Rock(x, y, size));
  }
}

function generateIslands() {
  let numIslands = 5;
  for (let i = 0; i < numIslands; i++) {
    let x, y, size;
    let overlapping = true;
    while (overlapping) {
      x = random(width);
      y = random(height);
      size = random(50, 100);
      if (!isCollidingWithObstacles(x, y, size)) {
        overlapping = false;
      }
    }
    islands.push(new Island(x, y, size));
  }
}

function generateNewTrash() {
  let validSpawn = false;
  let newTrash;
  while (!validSpawn) {
    let x = random(width);
    let y = random(height);
    let size = random(5, 15); // Random size between 5 and 15
    
    // Check if the new trash is too close to any rocks or islands
    let tooCloseToObstacle = rocks.concat(islands).some(obj => dist(x, y, obj.x, obj.y) < 50); // Adjust the radius as needed
    
    if (!tooCloseToObstacle) {
      newTrash = new Trash(x, y, size); // Create trash with random size
      validSpawn = true;
    }
  }
  trash.push(newTrash);
}

function isCollidingWithObstacles(x, y, size) {
  return rocks.concat(islands).some(obj => dist(x, y, obj.x, obj.y) < (size + obj.size) / 2);
}

class Rock {
  constructor(x, y, size) { this.x = x; this.y = y; this.size = size; }
  display() { fill(100); noStroke(); ellipse(this.x, this.y, this.size); }
}

class Island {
  constructor(x, y, size) { this.x = x; this.y = y; this.size = size; this.palmTree = new PalmTree(this.x, this.y - this.size / 2); }
  display() { fill(244, 164, 96); noStroke(); ellipse(this.x, this.y, this.size); this.palmTree.display(); }
}

class PalmTree {
  constructor(x, y) { this.x = x; this.y = y; }
  display() { fill(139, 69, 19); rect(this.x - 5, this.y, 10, 40); fill(34, 139, 34); triangle(this.x - 20, this.y + 20, this.x + 20, this.y + 20, this.x, this.y - 40); }
}

class Trash {
  constructor(x, y, size = 5) { this.x = x; this.y = y; this.size = size; }
  display() { fill(0); noStroke(); ellipse(this.x, this.y, this.size, this.size); }
}