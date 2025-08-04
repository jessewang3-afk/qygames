const badges = ['shangzhong', 'huaer', 'jiaofu', 'dongchang', 'xinchuan'];
const boardRows = 12;
const boardCols = 8;
let board = [];
let score = 0;
let gameOver = false;
let falling = null;
let fallTimer = null;
let fallSpeed = 500;
let timer = 60;
let timerInterval = null;
let difficultyTimer = null;

// 触摸滑动支持
let touchStartX = null;
let touchMoveInterval = null;
let touchMoveDir = 0;

function handleTouchStart(e) {
  if (!falling) return;
  if (e.touches && e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchMoveDir = 0;
  }
}

function handleTouchMove(e) {
  if (!falling || touchStartX === null) return;
  e.preventDefault();
  if (e.touches && e.touches.length > 0) {
    const moveX = e.touches[0].clientX;
    const dx = moveX - touchStartX;
    if (Math.abs(dx) > 10) {
      const dir = dx > 0 ? 1 : -1;
      if (dir !== touchMoveDir) {
        moveFalling(dir);
        touchMoveDir = dir;
        touchStartX = moveX;
        if (touchMoveInterval) clearInterval(touchMoveInterval);
        touchMoveInterval = setInterval(() => {
          if (falling) moveFalling(dir);
        }, 80);
      }
    }
  }
}

function handleTouchEnd(e) {
  touchStartX = null;
  touchMoveDir = 0;
  if (touchMoveInterval) {
    clearInterval(touchMoveInterval);
    touchMoveInterval = null;
  }
}

function handleTouchCancel() {
  handleTouchEnd();
}

window.addEventListener('DOMContentLoaded', () => {
  const gameBoard = document.getElementById('game-board');
  gameBoard.addEventListener('touchstart', handleTouchStart);
  gameBoard.addEventListener('touchmove', handleTouchMove, { passive: false });
  gameBoard.addEventListener('touchend', handleTouchEnd);
  gameBoard.addEventListener('touchcancel', handleTouchCancel);
});

function randomBadge() {
  return badges[Math.floor(Math.random() * badges.length)];
}

function updateScore() {
  document.getElementById('score').innerText = `分数：${score}`;
}

function renderBoard() {
  const gameBoard = document.getElementById('game-board');
  gameBoard.innerHTML = '';
  for (let row = 0; row < boardRows; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    for (let col = 0; col < boardCols; col++) {
      const img = document.createElement('img');
      img.className = 'cell';
      let cell = board[row][col];
      if (falling && falling.row === row && falling.col === col) {
        cell = falling.badge;
        img.style.border = '2px solid #409eff';
        img.style.cursor = 'pointer';
        img.onclick = (e) => {
          const rect = img.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) moveFalling(-1);
          else moveFalling(1);
        };
      }
      img.style.opacity = cell ? 1 : 0;
      img.src = cell ? `images/${cell}.png` : '';
      img.dataset.row = row;
      img.dataset.col = col;
      rowDiv.appendChild(img);
    }
    gameBoard.appendChild(rowDiv);
  }
}

function createBoard() {
  board = Array.from({ length: boardRows }, () => Array(boardCols).fill(null));
  score = 0;
  gameOver = false;
  falling = null;
  document.getElementById('game-over').style.display = 'none';
  updateScore();
  renderBoard();

  // 初始化倒计时
  timer = 600;
  document.getElementById('timer').innerText = `倒计时：${timer}`;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    document.getElementById('timer').innerText = `倒计时：${timer}`;
    if (timer <= 0) endGame();
  }, 1000);

  // 初始化难度提升
  fallSpeed = 500;
  document.getElementById('speed').innerText = `速度：${fallSpeed}ms`;
  if (difficultyTimer) clearInterval(difficultyTimer);
  difficultyTimer = setInterval(() => {
    if (fallSpeed > 50) {
      fallSpeed -= 50;
      document.getElementById('speed').innerText = `速度：${fallSpeed}ms`;
    }
  }, 20000);

  dropNewBadge();
}

function dropNewBadge() {
  if (gameOver) return;
  const col = Math.floor(Math.random() * boardCols);
  if (board[0][col]) {
    endGame();
    return;
  }
  falling = { row: 0, col, badge: randomBadge() };
  renderBoard();
  fallTimer = setInterval(fallStep, fallSpeed);
}

function fallStep() {
  if (!falling) return;
  let { row, col, badge } = falling;
  if (row + 1 < boardRows && !board[row + 1][col]) {
    falling.row++;
    renderBoard();
  } else {
    board[row][col] = badge;
    clearInterval(fallTimer);
    falling = null;
    renderBoard();
    setTimeout(() => {
      handleMergeAndEliminate(row, col);
      if (!gameOver) setTimeout(dropNewBadge, 500);
    }, 200);
  }
}

function moveFalling(dir) {
  if (!falling) return;
  let { row, col } = falling;
  let newCol = col + dir;
  if (newCol >= 0 && newCol < boardCols && !board[row][newCol]) {
    falling.col = newCol;
    renderBoard();
  }
}

window.addEventListener('keydown', (e) => {
  if (!falling) return;
  if (e.key === 'ArrowLeft') moveFalling(-1);
  if (e.key === 'ArrowRight') moveFalling(1);
});

function endGame() {
  gameOver = true;
  falling = null;
  clearInterval(fallTimer);
  clearInterval(timerInterval);
  clearInterval(difficultyTimer);
  document.getElementById('game-over').style.display = 'block';
}

function handleMergeAndEliminate(row, col) {
  const badge = board[row][col];
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  let mergeTarget = null;
  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (nr >= 0 && nr < boardRows && nc >= 0 && nc < boardCols && board[nr][nc] === badge) {
      mergeTarget = [nr, nc];
      break;
    }
  }
  if (mergeTarget) {
    if (badge === 'xinchuan') {
      board[row][col] = null;
      board[mergeTarget[0]][mergeTarget[1]] = null;
      score += 10;
      updateScore();
      renderBoard();
      setOtherBadgesBlack(true);
      showBravoAnimation();
      setTimeout(() => {
        setOtherBadgesBlack(false);
        hideBravoAnimation();
        dropDown();
      }, 900);
      return;
    } else {
      const idx = badges.indexOf(badge);
      if (idx < badges.length - 1) {
        board[row][col] = null;
        board[mergeTarget[0]][mergeTarget[1]] = badges[idx + 1];
        score += 5;
        updateScore();
        renderBoard();
        setTimeout(() => handleMergeAndEliminate(mergeTarget[0], mergeTarget[1]), 300);
        return;
      }
    }
  }

  const toEliminate = [];
  for (let r = 0; r < boardRows; r++) {
    let count = 1;
    for (let c = 1; c < boardCols; c++) {
      if (board[r][c] && board[r][c] === board[r][c - 1]) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) toEliminate.push([r, c - 1 - k, board[r][c - 1]]);
        }
        count = 1;
      }
    }
    if (count >= 3) {
      for (let k = 0; k < count; k++) toEliminate.push([r, boardCols - 1 - k, board[r][boardCols - 1]]);
    }
  }
  for (let c = 0; c < boardCols; c++) {
    let count = 1;
    for (let r = 1; r < boardRows; r++) {
      if (board[r][c] && board[r][c] === board[r - 1][c]) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) toEliminate.push([r - 1 - k, c, board[r - 1][c]]);
        }
        count = 1;
      }
    }
    if (count >= 3) {
      for (let k = 0; k < count; k++) toEliminate.push([boardRows - 1 - k, c, board[boardRows - 1][c]]);
    }
  }

  if (toEliminate.length > 0) {
    const unique = {};
    for (const [r, c, b] of toEliminate) unique[`${r},${c}`] = [r, c];
    for (const key in unique) {
      const [r, c] = unique[key];
      board[r][c] = null;
    }
    score += 10 * Object.keys(unique).length;
    updateScore();
    renderBoard();
    setTimeout(dropDown, 300);
  }
}

function dropDown() {
  for (let col = 0; col < boardCols; col++) {
    for (let row = boardRows - 1; row > 0; row--) {
      if (!board[row][col]) {
        let above = row - 1;
        while (above >= 0 && !board[above][col]) above--;
        if (above >= 0) {
          board[row][col] = board[above][col];
          board[above][col] = null;
        }
      }
    }
  }
  renderBoard();
}

function setOtherBadgesBlack(black) {
  const imgs = document.querySelectorAll('#game-board .cell');
  imgs.forEach(img => {
    if (img.src && !img.src.includes('xinchuan.png')) {
      img.style.filter = black ? 'grayscale(1) brightness(0.2)' : '';
    }
  });
}

function showBravoAnimation() {
  let bravo = document.getElementById('bravo-anim');
  if (!bravo) {
    bravo = document.createElement('div');
    bravo.id = 'bravo-anim';
    bravo.style.position = 'fixed';
    bravo.style.left = '50%';
    bravo.style.top = '40%';
    bravo.style.transform = 'translate(-50%, -50%)';
    bravo.style.background = 'rgba(255,255,255,0.95)';
    bravo.style.borderRadius = '18px';
    bravo.style.padding = '28px 38px';
    bravo.style.fontSize = '2rem';
    bravo.style.color = '#e67e22';
    bravo.style.fontWeight = 'bold';
    bravo.style.boxShadow = '0 4px 24px #aaa';
    bravo.style.zIndex = '9999';
    bravo.style.transition = 'opacity 0.3s';
    bravo.innerText = '新川加油！';
    document.body.appendChild(bravo);
  }
  bravo.style.opacity = '1';
  bravo.style.display = 'block';
}

function hideBravoAnimation() {
  const bravo = document.getElementById('bravo-anim');
  if (bravo) {
    bravo.style.opacity = '0';
    setTimeout(() => { bravo.style.display = 'none'; }, 300);
  }
}

document.getElementById('restart').onclick = () => {
  clearInterval(timerInterval);
  clearInterval(difficultyTimer);
  clearInterval(fallTimer);
  createBoard();
};

createBoard();
