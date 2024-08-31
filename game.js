const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Add these variables at the top of the file
let screenShake = { x: 0, y: 0 };
const monsterShakeDuration = 500; // milliseconds

function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 40,
    speed: 5,
    points: 21  // Changed from 50 to 21
};

const monsterNames = ['Blinky', 'Pinky', 'Inky']; // Random names for monsters

const monsters = [
    { x: 50, y: 50, size: 40, speed: 2.5, name: monsterNames[0], score: 0 },
    { x: canvas.width - 50, y: 50, size: 40, speed: 2.5, name: monsterNames[1], score: 0 },
    { x: canvas.width - 50, y: canvas.height - 50, size: 40, speed: 2.5, name: monsterNames[2], score: 0 }
];

let gameStarted = false;
let gameOver = false;
let lastTime = 0;
let lastPointReductionTime = 0;
const pointReductionInterval = 1000; // 1 second

function drawPlayer() {
    // Draw the player body
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.size, player.size);
    
    // Draw "ME" on the player
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
        'ME',
        player.x + player.size / 2,
        player.y + player.size / 2
    );
}

// Modify the drawMonsters function
function drawMonsters() {
    monsters.forEach(monster => {
        const shakeX = monster.shaking ? (Math.random() - 0.5) * 4 : 0;
        const shakeY = monster.shaking ? (Math.random() - 0.5) * 4 : 0;
        
        // Draw the monster body
        ctx.fillStyle = 'red';
        ctx.fillRect(monster.x + shakeX, monster.y + shakeY, monster.size, monster.size);
        
        // Draw the first character of the monster's name
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            monster.name[0],
            monster.x + shakeX + monster.size / 2,
            monster.y + shakeY + monster.size / 2
        );
    });
}

function movePlayer() {
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - player.size) player.y += player.speed;
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.size) player.x += player.speed;
}

function moveMonsters() {
    monsters.forEach((monster, index) => {
        const dx = player.x - monster.x;
        const dy = player.y - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const newX = monster.x + (dx / distance) * monster.speed;
            const newY = monster.y + (dy / distance) * monster.speed;
            
            // Check for collision with other monsters
            const collides = monsters.some((otherMonster, otherIndex) => {
                if (index !== otherIndex) {
                    const distX = newX - otherMonster.x;
                    const distY = newY - otherMonster.y;
                    const distSquared = distX * distX + distY * distY;
                    return distSquared < (monster.size * monster.size);
                }
                return false;
            });
            
            if (!collides) {
                monster.x = newX;
                monster.y = newY;
            }
        }
    });
}

// Modify the checkMonsterCollision function
function checkMonsterCollision() {
    let isColliding = false;
    monsters.forEach(monster => {
        const dx = player.x - monster.x;
        const dy = player.y - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.size + monster.size) / 2) {
            isColliding = true;
            const currentTime = Date.now();
            if (currentTime - lastPointReductionTime >= pointReductionInterval) {
                player.points -= 1;
                monster.score += 1; // Increase monster's score
                lastPointReductionTime = currentTime;
                if (player.points <= 0) {
                    gameOver = true;
                }
            }
            monster.shaking = true;
            setTimeout(() => { monster.shaking = false; }, monsterShakeDuration);
            vibrate();
        }
    });
    return isColliding;
}

// Modify the vibrate function
function vibrate() {
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
    screenShake = { x: 10, y: 10 };
    setTimeout(() => { screenShake = { x: 0, y: 0 }; }, 300);
}

function drawUI() {
    // Always draw the points
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Points: ${player.points}`, 10, 30);
    
    if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2 - 100);

        // Add game instructions
        ctx.font = '20px Arial';
        ctx.fillText('Instructions:', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('Use arrow keys to move', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Avoid the monsters (B, P, I)', canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText('Survive as long as possible', canvas.width / 2, canvas.height / 2 + 100);
        ctx.fillText('You start with 21 points', canvas.width / 2, canvas.height / 2 + 140);
        ctx.fillText('Game over when points reach 0', canvas.width / 2, canvas.height / 2 + 180);
    } else if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);

        // Find the monster with the highest score
        const topMonster = monsters.reduce((prev, current) => 
            (prev.score > current.score) ? prev : current
        );

        // Display the monster with the most points
        ctx.font = '24px Arial';
        ctx.fillText(`${topMonster.name} has the most grandmasti with ${topMonster.score} points!`, 
            canvas.width / 2, canvas.height / 2 + 10);

        ctx.font = '20px Arial';
        ctx.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 60);
        
        // Draw points again on top of the overlay
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Final Points: ${player.points}`, 10, 30);
    }
}

function drawPoints() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Points: ${player.points}`, 10, 30);
    
    // Draw monster scores
    ctx.textAlign = 'right';
    monsters.forEach((monster, index) => {
        ctx.fillText(`${monster.name}: ${monster.score}`, canvas.width - 10, 30 + index * 30);
    });
    
    // Debugging information
    ctx.textAlign = 'left';
    ctx.fillText(`Game Started: ${gameStarted}`, 10, 60);
    ctx.fillText(`Game Over: ${gameOver}`, 10, 90);
}

// Modify the gameLoop function
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Clear the entire canvas with a dark background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply screen shake
    ctx.save();
    ctx.translate(
        screenShake.x * (Math.random() - 0.5),
        screenShake.y * (Math.random() - 0.5)
    );
    
    if (gameStarted && !gameOver) {
        movePlayer();
        moveMonsters();
        checkMonsterCollision();
    }
    
    drawPlayer();
    drawMonsters();
    drawUI();
    drawPoints();
    
    ctx.restore();
    
    requestAnimationFrame(gameLoop);
}

const keys = {};

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        if (!gameStarted) {
            gameStarted = true;
        } else if (gameOver) {
            resetGame();
        }
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

// Modify the resetGame function to initialize monster shaking property
function resetGame() {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.points = 21;  // Changed from 50 to 21
    monsters.forEach((monster, index) => {
        if (index === 0) {
            monster.x = 50;
            monster.y = 50;
        } else if (index === 1) {
            monster.x = canvas.width - 50;
            monster.y = 50;
        } else {
            monster.x = canvas.width - 50;
            monster.y = canvas.height - 50;
        }
        monster.shaking = false;
        monster.score = 0; // Reset monster's score
    });
    gameOver = false;
    gameStarted = true;
}

window.addEventListener('resize', () => {
    setCanvasSize();
});

setCanvasSize();
requestAnimationFrame(gameLoop);