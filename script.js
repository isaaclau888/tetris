const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');
const scoreDisplay = document.getElementById('score');

// Key bindings
const keyBindings = {
    moveLeft: 'a',
    moveRight: 'd',
    drop: 's',
    rotate: 'w'
};

let backgroundColor = '#000000';
context.scale(20, 20);

const colors = [null, 'cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'];
const pieces = ['t', 'o', 'l', 'j', 'i', 's', 'z'];
let board = createMatrix(12, 20);
let player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    type: null
};
let gameActive = false;
let score = 0;
let dropInterval = 1000;
let dropTime = 0;

function createMatrix(w, h) {
    return Array.from({ length: h }, () => Array(w).fill(0));
}

function createPiece(type) {
    const piecesMap = {
        't': [[0, 5, 0], [5, 5, 5], [0, 0, 0]],
        'o': [[4, 4], [4, 4]],
        'l': [[0, 6, 0], [0, 6, 0], [0, 6, 6]],
        'j': [[0, 7, 0], [0, 7, 0], [7, 7, 0]],
        'i': [[0, 0, 0, 0], [8, 8, 8, 8]],
        's': [[0, 9, 9], [9, 9, 0]],
        'z': [[10, 10, 0], [0, 10, 10]],
    };
    return piecesMap[type];
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function collide(area, player) {
    const { matrix, pos } = player;
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < matrix[y].length; ++x) {
            if (matrix[y][x] !== 0 && (area[y + pos.y] && area[y + pos.y][x + pos.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(area, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                area[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix) {
    const originalMatrix = matrix.map(row => row.slice());
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    matrix.forEach(row => row.reverse());

    if (collide(board, player)) {
        for (let y = 0; y < originalMatrix.length; ++y) {
            for (let x = 0; x < originalMatrix[y].length; ++x) {
                matrix[y][x] = originalMatrix[y][x];
            }
        }
    }
}

function drawGhost() {
    let ghostY = player.pos.y;
    while (!collide(board, { matrix: player.matrix, pos: { x: player.pos.x, y: ghostY + 1 } })) {
        ghostY++;
    }
    drawMatrix(player.matrix, { x: player.pos.x, y: ghostY });
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(board, { x: 0, y: 0 });
    drawGhost(); // Draw the ghost block
    drawMatrix(player.matrix, player.pos);
    scoreDisplay.innerText = `Score: ${score}`;
}

function playerReset() {
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    player.matrix = createPiece(randomPiece);
    player.pos.y = 0;
    player.pos.x = Math.floor((board[0].length / 2) - (player.matrix[0].length / 2));

    if (collide(board, player)) {
        gameActive = false; // Set gameActive to false on game over
        alert("Game Over! Your score: " + score);
        resetGame();
    }
}

function update() {
    draw();
    drop();
    requestAnimationFrame(update);
}

function drop() {
    dropTime++;
    if (dropTime > dropInterval / 100) {
        player.pos.y++;
        if (collide(board, player)) {
            player.pos.y--;
            merge(board, player);
            updateScore();
            playerReset();
        }
        dropTime = 0;
    }
}

function updateScore() {
    let linesCleared = 0;
    for (let y = board.length - 1; y >= 0; --y) {
        if (board[y].every(value => value !== 0)) {
            board.splice(y, 1);
            board.unshift(new Array(12).fill(0));
            linesCleared++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 10;
    }
}

function move(dir) {
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir;
    }
}

function control(event) {
    if (!gameActive) return; // Ignore controls if the game is not active
    switch (event.key.toLowerCase()) {
        case keyBindings.moveLeft:
            move(-1);
            break;
        case keyBindings.moveRight:
            move(1);
            break;
        case keyBindings.drop:
            player.pos.y++;
            if (collide(board, player)) {
                player.pos.y--;
                merge(board, player);
                updateScore();
                playerReset();
            }
            break;
        case keyBindings.rotate:
            rotate(player.matrix); // Rotate the current piece
            break;
    }
}

// Event listeners for buttons
startButton.addEventListener('click', () => {
    if (!gameActive) {
        board = createMatrix(12, 20);
        score = 0;
        playerReset();
        gameActive = true;
        document.addEventListener('keydown', control);
        update();
    }
});

resetButton.addEventListener('click', resetGame);

function resetGame() {
    score = 0;
    board = createMatrix(12, 20);
    playerReset();
    draw(); // Redraw after reset
}